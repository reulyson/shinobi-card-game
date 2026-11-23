import { DECK_PRESETS, validateDeck } from '../data/cards';

const LIBRARY_KEY = 'shinobi_chronicles_deck_library_v1';
const ACTIVE_ID_KEY = 'shinobi_chronicles_active_deck_id_v1';
const LEGACY_DECK_KEY = 'shinobi_chronicles_deck_v4';

export interface SavedDeck {
  id: string;
  name: string;
  cardIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DeckLibraryState {
  decks: SavedDeck[];
  activeDeckId: string;
}

function newDeckId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `deck_${crypto.randomUUID()}`;
  }
  return `deck_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultDeckFromLegacy(): SavedDeck {
  const legacy = readJson<string[]>(LEGACY_DECK_KEY);
  const cardIds =
    legacy && Array.isArray(legacy) && validateDeck(legacy).ok
      ? legacy
      : DECK_PRESETS[0].cardIds;
  const now = Date.now();
  return {
    id: newDeckId(),
    name: 'Meu baralho',
    cardIds,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadDeckLibrary(): DeckLibraryState {
  const stored = readJson<{ decks: SavedDeck[]; activeDeckId?: string }>(LIBRARY_KEY);
  if (stored?.decks?.length) {
    const activeDeckId =
      stored.activeDeckId && stored.decks.some((d) => d.id === stored.activeDeckId)
        ? stored.activeDeckId
        : stored.decks[0].id;
    return { decks: stored.decks, activeDeckId };
  }

  const first = defaultDeckFromLegacy();
  const state: DeckLibraryState = { decks: [first], activeDeckId: first.id };
  persistDeckLibrary(state);
  return state;
}

export function persistDeckLibrary(state: DeckLibraryState): void {
  try {
    localStorage.setItem(
      LIBRARY_KEY,
      JSON.stringify({ decks: state.decks, activeDeckId: state.activeDeckId })
    );
    const active = state.decks.find((d) => d.id === state.activeDeckId);
    if (active) {
      localStorage.setItem(LEGACY_DECK_KEY, JSON.stringify(active.cardIds));
    }
  } catch {
    // ignore quota
  }
}

export function getActiveDeckCardIds(state: DeckLibraryState): string[] {
  const deck = state.decks.find((d) => d.id === state.activeDeckId);
  return deck?.cardIds ?? DECK_PRESETS[0].cardIds;
}

export function createEmptyDeck(name: string): SavedDeck {
  const now = Date.now();
  return {
    id: newDeckId(),
    name,
    cardIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateDeck(source: SavedDeck, name?: string): SavedDeck {
  const now = Date.now();
  return {
    id: newDeckId(),
    name: name ?? `${source.name} (cópia)`,
    cardIds: [...source.cardIds],
    createdAt: now,
    updatedAt: now,
  };
}

export function deckFromPreset(presetId: string, name?: string): SavedDeck | null {
  const preset = DECK_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  const now = Date.now();
  return {
    id: newDeckId(),
    name: name ?? preset.name,
    cardIds: [...preset.cardIds],
    createdAt: now,
    updatedAt: now,
  };
}