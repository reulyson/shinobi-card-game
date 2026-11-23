import { useCallback, useEffect, useMemo, useState } from 'react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST, DEFAULT_ARENA_ID } from './data/arenas';
import { validateDeck } from './data/cards';
import { ArenaId } from './types/game';
import { LobbyScreen } from './ui/screens/LobbyScreen';
import { DeckBuilderScreen } from './ui/screens/DeckBuilderScreen';
import { DeckLibraryScreen } from './ui/screens/DeckLibraryScreen';
import { RulesScreen } from './ui/screens/RulesScreen';
import { MatchHistoryScreen } from './ui/screens/MatchHistoryScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { HudDemo } from './ui/hud/HudDemo';
import { soundFX } from './utils/sound';
import { CardGallery } from './ui/card/CardGallery';
import { ArenaDemo, resolveArenaDemoFromSearch } from './ui/combat';
import { AppNav } from './ui/shell';
import {
  AppDomain,
  domainFromPathname,
  montarDeckViewFromPath,
  navigateToDomain,
  navigateToPath,
  pathForMontarDeckEditor,
  screenFromDomain,
  type ScreenFromDomain,
} from './navigation/domains';
import {
  deckFromPreset,
  duplicateDeck,
  getActiveDeckCardIds,
  loadDeckLibrary,
  persistDeckLibrary,
  type DeckLibraryState,
  type SavedDeck,
} from './storage/deckLibrary';

const STORAGE_ARENA_KEY = 'shinobi_chronicles_arena_v1';

type ActiveScreen = ScreenFromDomain;

type EditorDraft = {
  deckId: string | null;
  name: string;
  cardIds: string[];
};

function screenToDomain(screen: ActiveScreen): AppDomain {
  switch (screen) {
    case 'lobby':
      return 'lobby';
    case 'grimorio':
      return 'grimorio';
    case 'montar-deck':
      return 'montar-deck';
    case 'guia-ninja':
      return 'guia-ninja';
    case 'historico':
      return 'historico';
    case 'battle':
      return 'batalha';
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

function initialScreen(): ActiveScreen {
  if (typeof window === 'undefined') return 'lobby';
  return screenFromDomain(domainFromPathname(window.location.pathname));
}

function isHudDemo(): boolean {
  if (typeof window === 'undefined') return false;
  if (!import.meta.env.DEV) return false;
  const demo = new URLSearchParams(window.location.search).get('demo');
  return demo === 'hud' || demo === 'part4';
}

export default function App() {
  if (isHudDemo()) return <HudDemo />;

  if (import.meta.env.DEV) {
    const arenaDemo = resolveArenaDemoFromSearch(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    if (arenaDemo) return <ArenaDemo demoId={arenaDemo} />;
  }

  return <AppMain />;
}

function AppMain() {
  const [screen, setScreen] = useState<ActiveScreen>(initialScreen);
  const [pathname, setPathname] = useState(
    () => (typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  const [deckLibrary, setDeckLibrary] = useState<DeckLibraryState>(() => loadDeckLibrary());
  const [editorDraft, setEditorDraft] = useState<EditorDraft | null>(null);

  const montarDeckRoute = useMemo(
    () => montarDeckViewFromPath(pathname),
    [pathname]
  );

  const activeDeckIds = useMemo(
    () => getActiveDeckCardIds(deckLibrary),
    [deckLibrary]
  );

  const goToPath = useCallback((path: string, replace = false) => {
    const domain = domainFromPathname(path);
    setScreen(screenFromDomain(domain));
    setPathname(path);
    navigateToPath(path, replace);
  }, []);

  const goToScreen = useCallback(
    (next: ActiveScreen, replace = false) => {
      if (next === 'montar-deck') {
        goToPath('/montar-deck', replace);
        return;
      }
      setScreen(next);
      setPathname(pathForDomainHelper(next));
      navigateToDomain(screenToDomain(next), replace);
    },
    [goToPath]
  );

  function pathForDomainHelper(next: ActiveScreen): string {
    switch (next) {
      case 'lobby':
        return '/';
      case 'grimorio':
        return '/grimorio';
      case 'montar-deck':
        return '/montar-deck';
      case 'guia-ninja':
        return '/guia-ninja';
      case 'historico':
        return '/historico';
      case 'battle':
        return '/batalha';
      default: {
        const _exhaustive: never = next;
        return _exhaustive;
      }
    }
  }

  const commitLibrary = useCallback((next: DeckLibraryState) => {
    setDeckLibrary(next);
    persistDeckLibrary(next);
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const path = window.location.pathname;
      setPathname(path);
      setScreen(screenFromDomain(domainFromPathname(path)));
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const [selectedArena, setSelectedArena] = useState<ArenaId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ARENA_KEY) as ArenaId | null;
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return 'vale_do_fim';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ARENA_KEY, selectedArena);
    } catch {
      // Ignore storage error
    }
  }, [selectedArena]);

  const pickMatchArena = (): ArenaId =>
    ARENA_EFFECTS_ENABLED ? ARENA_LIST[Math.floor(Math.random() * ARENA_LIST.length)].id : DEFAULT_ARENA_ID;
  const [matchArena, setMatchArena] = useState<ArenaId>(pickMatchArena);

  const handleStartBattle = () => {
    if (validateDeck(activeDeckIds).ok) {
      soundFX.playKunaiDraw();
      setMatchArena(pickMatchArena());
      goToScreen('battle');
    } else {
      goToPath('/montar-deck');
    }
  };

  const openCreateDeck = () => {
    setEditorDraft({
      deckId: null,
      name: 'Novo deck',
      cardIds: [],
    });
    goToPath('/montar-deck/criar');
  };

  const openEditDeck = (deckId: string) => {
    const deck = deckLibrary.decks.find((d) => d.id === deckId);
    if (!deck) return;
    setEditorDraft({
      deckId: deck.id,
      name: deck.name,
      cardIds: [...deck.cardIds],
    });
    goToPath(pathForMontarDeckEditor(deckId));
  };

  const closeEditor = () => {
    setEditorDraft(null);
    goToPath('/montar-deck');
  };

  const saveEditorDraft = () => {
    if (!editorDraft) return;
    const trimmed = editorDraft.name.trim() || 'Deck sem nome';
    const now = Date.now();
    let decks: SavedDeck[] = [...deckLibrary.decks];
    let activeDeckId = deckLibrary.activeDeckId;

    if (editorDraft.deckId) {
      decks = decks.map((d) =>
        d.id === editorDraft.deckId
          ? { ...d, name: trimmed, cardIds: [...editorDraft.cardIds], updatedAt: now }
          : d
      );
    } else {
      const created: SavedDeck = {
        id: `deck_${now}_${Math.random().toString(36).slice(2, 9)}`,
        name: trimmed,
        cardIds: [...editorDraft.cardIds],
        createdAt: now,
        updatedAt: now,
      };
      decks.push(created);
      activeDeckId = created.id;
    }

    commitLibrary({ decks, activeDeckId });
    closeEditor();
  };

  const selectActiveDeck = (deckId: string) => {
    commitLibrary({ ...deckLibrary, activeDeckId: deckId });
  };

  const deleteDeck = (deckId: string) => {
    const decks = deckLibrary.decks.filter((d) => d.id !== deckId);
    if (decks.length === 0) return;
    const activeDeckId =
      deckLibrary.activeDeckId === deckId ? decks[0].id : deckLibrary.activeDeckId;
    commitLibrary({ decks, activeDeckId });
  };

  const duplicateSavedDeck = (deckId: string) => {
    const source = deckLibrary.decks.find((d) => d.id === deckId);
    if (!source) return;
    const copy = duplicateDeck(source);
    commitLibrary({
      decks: [...deckLibrary.decks, copy],
      activeDeckId: deckLibrary.activeDeckId,
    });
  };

  const importPresetToLibrary = (presetId: string) => {
    const fromPreset = deckFromPreset(presetId);
    if (!fromPreset) return;
    commitLibrary({
      decks: [...deckLibrary.decks, fromPreset],
      activeDeckId: fromPreset.id,
    });
  };

  useEffect(() => {
    if (screen !== 'montar-deck') return;
    if (montarDeckRoute.view === 'hub') {
      setEditorDraft(null);
      return;
    }
    if (montarDeckRoute.view === 'editar' && montarDeckRoute.deckId && !editorDraft) {
      const deck = deckLibrary.decks.find((d) => d.id === montarDeckRoute.deckId);
      if (deck) {
        setEditorDraft({
          deckId: deck.id,
          name: deck.name,
          cardIds: [...deck.cardIds],
        });
      } else {
        goToPath('/montar-deck', true);
      }
    }
    if (montarDeckRoute.view === 'criar' && !editorDraft) {
      setEditorDraft({ deckId: null, name: 'Novo deck', cardIds: [] });
    }
  }, [screen, montarDeckRoute, editorDraft, deckLibrary.decks, goToPath]);

  const showCardGallery =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('gallery') === 'cartas';

  if (showCardGallery) {
    return <CardGallery />;
  }

  const showDeckEditor =
    screen === 'montar-deck' &&
    (montarDeckRoute.view === 'criar' || montarDeckRoute.view === 'editar') &&
    editorDraft;

  const viewportLocked =
    screen === 'grimorio' ||
    showDeckEditor ||
    (screen === 'montar-deck' && montarDeckRoute.view === 'hub');

  const activeDeckMeta = deckLibrary.decks.find((d) => d.id === deckLibrary.activeDeckId);

  const isMenuShell = screen !== 'battle';
  /** Só Grimório / Montar deck: viewport fixo com scroll interno nos painéis. */
  const panelViewport = isMenuShell && viewportLocked;

  return (
    <div
      className={`w-full text-slate-100 flex flex-col app-shell-clip ${
        panelViewport ? 'app-menu-shell' : isMenuShell ? 'min-h-dvh flex-1' : 'min-h-dvh'
      } ${isMenuShell ? 'app-v2-mesh' : 'bg-[#0B111A]'}`}
    >
      {isMenuShell && (
        <AppNav screen={screen} onNavigate={goToScreen} onStartBattle={handleStartBattle} />
      )}

      <main
        className={`flex flex-col w-full relative ${
          screen === 'battle'
            ? 'min-h-0 overflow-hidden flex-1'
            : panelViewport
              ? 'app-menu-main app-menu-main--locked'
              : 'flex-1'
        }`}
      >
        <div className={`relative flex flex-col w-full ${viewportLocked ? 'flex-1 min-h-0' : ''}`}>
          {screen === 'lobby' && (
            <LobbyScreen
              selectedArena={selectedArena}
              activeDeckIds={activeDeckIds}
              activeDeckName={activeDeckMeta?.name}
              onSelectPreset={(ids, arena) => {
                const now = Date.now();
                const next: SavedDeck = {
                  id: `deck_import_${now}`,
                  name: 'Deck do lobby',
                  cardIds: ids,
                  createdAt: now,
                  updatedAt: now,
                };
                commitLibrary({
                  decks: [...deckLibrary.decks, next],
                  activeDeckId: next.id,
                });
                setSelectedArena(arena);
              }}
              onSelectArena={setSelectedArena}
              onStartBattle={handleStartBattle}
              onOpenBuilder={() => goToPath('/montar-deck')}
              onOpenGrimorio={() => goToScreen('grimorio')}
              onOpenRules={() => goToScreen('guia-ninja')}
              onOpenHistory={() => goToScreen('historico')}
            />
          )}

          {screen === 'grimorio' && (
            <DeckBuilderScreen
              mode="collection"
              activeDeckIds={activeDeckIds}
              selectedArena={selectedArena}
              onUpdateDeck={() => {}}
              onSelectArena={setSelectedArena}
              onStartMatch={handleStartBattle}
              onOpenDeckBuilder={() => goToPath('/montar-deck')}
            />
          )}

          {screen === 'montar-deck' && montarDeckRoute.view === 'hub' && (
            <DeckLibraryScreen
              decks={deckLibrary.decks}
              activeDeckId={deckLibrary.activeDeckId}
              onCreateDeck={openCreateDeck}
              onEditDeck={openEditDeck}
              onSelectActive={selectActiveDeck}
              onDeleteDeck={deleteDeck}
              onDuplicateDeck={duplicateSavedDeck}
              onImportPreset={importPresetToLibrary}
              onStartMatch={handleStartBattle}
            />
          )}

          {showDeckEditor && editorDraft && (
            <DeckBuilderScreen
              mode="builder"
              activeDeckIds={editorDraft.cardIds}
              selectedArena={selectedArena}
              onUpdateDeck={(cardIds) => setEditorDraft({ ...editorDraft, cardIds })}
              onSelectArena={setSelectedArena}
              onStartMatch={handleStartBattle}
              deckName={editorDraft.name}
              onDeckNameChange={(name) => setEditorDraft({ ...editorDraft, name })}
              onSaveDeck={saveEditorDraft}
              onCancelEdit={closeEditor}
            />
          )}

          {screen === 'guia-ninja' && <RulesScreen onStartMatch={handleStartBattle} />}

          {screen === 'historico' && <MatchHistoryScreen onStartMatch={handleStartBattle} />}

          {screen === 'battle' && (
            <BattleScreen
              playerDeckIds={activeDeckIds}
              initialArena={matchArena}
              onExitToBuilder={() => goToPath('/montar-deck')}
              onExit={() => goToScreen('lobby')}
              onOpenHistory={() => goToScreen('historico')}
            />
          )}
        </div>
      </main>
    </div>
  );
}