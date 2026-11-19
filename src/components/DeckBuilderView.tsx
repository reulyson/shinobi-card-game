import React, { useMemo, useState } from 'react';
import { Plus, Minus, Play, RotateCcw, Search } from 'lucide-react';
import {
  ALL_CARDS,
  DECK_PRESETS,
  getNotDeckableReason,
  isDeckableCard,
  validateDeck,
  EQUIPMENT_CARDS,
  JUTSU_CARDS,
  NINJA_CARDS,
  TRAP_CARDS,
  UNIT_CARDS,
  getCardById,
} from '../data/cards';
import { ArenaId, CardDef, formatKeywords, JutsuSpeed, SPEED_DISPLAY_NAME, TeamFaction } from '../types/game';
import { CardView } from './CardView';
import { CardFace } from './card/CardFace';
import { CardInspector } from './CardInspector';

interface DeckBuilderViewProps {
  mode: 'collection' | 'builder';
  activeDeckIds: string[];
  selectedArena: ArenaId;
  onUpdateDeck: (cardIds: string[]) => void;
  onSelectArena: (arena: ArenaId) => void;
  onStartMatch: () => void;
}

const FACTIONS: ('Todos' | TeamFaction)[] = [
  'Todos',
  'Time 7',
  'Time 8',
  'Time 9',
  'Time 10',
  'Som & Sannin',
  'Hokages',
  'Areia',
  'Névoa',
  'Neutro',
  'Akatsuki',
];

type TypeFilter =
  | 'Todos'
  | 'Ninja'
  | 'Unidade'
  | 'Equipamento'
  | 'Armadilha'
  | JutsuSpeed;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Ninja', label: 'Ninjas (Promoção)' },
  { id: 'Unidade', label: 'Unidades' },
  { id: 'Equipamento', label: 'Equipamentos' },
  { id: 'Armadilha', label: 'Armadilhas' },
  { id: 'Imediata', label: SPEED_DISPLAY_NAME.Imediata },
  { id: 'Rapida', label: SPEED_DISPLAY_NAME.Rapida },
  { id: 'Focada', label: SPEED_DISPLAY_NAME.Focada },
  { id: 'Lenta', label: SPEED_DISPLAY_NAME.Lenta },
];

const MAX_DECK_SIZE = 24;

export const DeckBuilderView: React.FC<DeckBuilderViewProps> = ({
  mode,
  activeDeckIds,
  selectedArena,
  onUpdateDeck,
  onSelectArena,
  onStartMatch,
}) => {
  const [factionFilter, setFactionFilter] = useState<'Todos' | TeamFaction>('Todos');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Todos');
  const [search, setSearch] = useState('');
  const [inspectedCard, setInspectedCard] = useState<CardDef | null>(ALL_CARDS[0]);

  const filteredCards = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (factionFilter !== 'Todos' && card.faction !== factionFilter) return false;
      if (typeFilter === 'Ninja' && card.kind !== 'ninja') return false;
      if (typeFilter === 'Unidade' && card.kind !== 'unidade') return false;
      if (typeFilter === 'Equipamento' && card.kind !== 'equipamento') return false;
      if (typeFilter === 'Armadilha' && card.kind !== 'armadilha') return false;
      if (
        (typeFilter === 'Imediata' ||
          typeFilter === 'Rapida' ||
          typeFilter === 'Focada' ||
          typeFilter === 'Lenta') &&
        (card.kind !== 'jutsu' || card.speed !== typeFilter)
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const text =
          card.kind === 'jutsu'
            ? `${card.name} ${card.effectText} ${SPEED_DISPLAY_NAME[card.speed]} ${card.category} ${card.faction}`
            : card.kind === 'armadilha' || card.kind === 'equipamento'
              ? `${card.name} ${card.effectText} ${card.faction}`
              : `${card.name} ${card.title} ${card.abilityText} ${formatKeywords(card.keywords, ' ')} ${card.faction}`;
        if (!text.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [factionFilter, typeFilter, search]);

  const deckCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of activeDeckIds) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [activeDeckIds]);

  const uniqueDeckEntries = useMemo(() => {
    return Object.entries(deckCounts)
      .map(([id, count]) => ({ card: getCardById(id), count }))
      .filter((entry): entry is { card: CardDef; count: number } => Boolean(entry.card))
      .sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name));
  }, [deckCounts]);

  const distinctNinjasCount = useMemo(() => {
    return Object.keys(deckCounts).filter((id) => getCardById(id)?.kind === 'ninja').length;
  }, [deckCounts]);

  const deckCheck = useMemo(() => validateDeck(activeDeckIds), [activeDeckIds]);

  const canAddCard = (card: CardDef) => {
    if (!isDeckableCard(card)) return false;
    if (activeDeckIds.length >= MAX_DECK_SIZE) return false;
    const currentCount = deckCounts[card.id] || 0;
    if (card.kind === 'ninja') {
      if (currentCount >= 2) return false;
      if (currentCount === 0 && distinctNinjasCount >= 3) return false;
      return true;
    }
    return currentCount < 3;
  };

  const addCardToDeck = (cardId: string) => {
    const card = getCardById(cardId);
    if (!card || !canAddCard(card)) return;
    onUpdateDeck([...activeDeckIds, cardId]);
  };

  const removeCardFromDeck = (cardId: string) => {
    const idx = activeDeckIds.indexOf(cardId);
    if (idx === -1) return;
    const next = [...activeDeckIds];
    next.splice(idx, 1);
    onUpdateDeck(next);
  };

  const manaCurve = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const id of activeDeckIds) {
      const card = getCardById(id);
      if (!card) continue;
      const idx = Math.min(5, Math.max(0, card.cost - 1));
      buckets[idx] += 1;
    }
    return buckets;
  }, [activeDeckIds]);

  const maxBucket = Math.max(1, ...manaCurve);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              {mode === 'collection' ? 'Grimório Ninja' : 'Construtor de Deck'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {ALL_CARDS.length} cartas · {NINJA_CARDS.length} Ninjas · {UNIT_CARDS.length} Unidades · {JUTSU_CARDS.length} Jutsus · {TRAP_CARDS.length} Armadilhas · {EQUIPMENT_CARDS.length} Equipamentos
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar carta ou palavra-chave..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {FACTIONS.map((faction) => (
              <button
                key={faction}
                type="button"
                onClick={() => setFactionFilter(faction)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  factionFilter === faction
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {faction}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === t.id
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/70'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
            Nenhuma carta encontrada com esses filtros.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const count = deckCounts[card.id] || 0;
              const maxCopies = card.kind === 'ninja' ? 2 : 3;
              const canAdd = canAddCard(card);
              return (
                <div key={card.id} className="flex flex-col gap-2">
                  <CardView
                    card={card}
                    size="collection"
                    selected={inspectedCard?.id === card.id}
                    onClick={() => setInspectedCard(card)}
                    onInspect={(c) => setInspectedCard(c)}
                  />
                  {mode === 'builder' && !isDeckableCard(card) && (
                    <p className="px-1 text-[11px] leading-snug text-rose-300/90">
                      {getNotDeckableReason(card)}
                    </p>
                  )}
                  {mode === 'builder' && isDeckableCard(card) && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-mono-num text-slate-400">
                        No deck: <strong className="text-white">{count}</strong>/{maxCopies}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={count === 0}
                          onClick={() => removeCardFromDeck(card.id)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-35"
                          aria-label={`Remover ${card.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!canAdd}
                          onClick={() => addCardToDeck(card.id)}
                          className="p-1.5 rounded bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-200 disabled:opacity-35"
                          aria-label={`Adicionar ${card.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
        <div className="rounded-xl border border-slate-800 bg-[#111927] p-4">
          <div className="text-xs font-semibold text-slate-400 mb-3">
            Inspeção da Carta
          </div>
          <CardInspector card={inspectedCard} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111927] p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Deck Selecionado</h2>
              <p className="text-xs text-slate-400 font-mono-num">
                {activeDeckIds.length}/{MAX_DECK_SIZE} cartas · Ninjas {distinctNinjasCount}/3
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Máx. 3 Ninjas (2 cópias cada), 3 cópias das demais. Tokens não entram no baralho.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateDeck(DECK_PRESETS[0].cardIds)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300"
              title="Restaurar deck inicial"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Decks Prontos</span>
            {DECK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onUpdateDeck(preset.cardIds);
                }}
                className="text-left px-2.5 py-2 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/60 transition-colors"
              >
                <div className="text-xs font-semibold text-white">{preset.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{preset.subtitle}</div>
              </button>
            ))}
          </div>


          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-2">
              Curva de Chakra
            </div>
            <div className="grid grid-cols-6 gap-1.5 items-end h-14 px-1">
              {manaCurve.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t bg-sky-500/75"
                    style={{ height: `${Math.max(8, (val / maxBucket) * 100)}%` }}
                    title={`${val} cartas`}
                  />
                  <span className="text-[10px] font-mono-num text-slate-400">
                    {idx === 5 ? '6+' : idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1">
            {uniqueDeckEntries.map(({ card, count }) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-slate-900/90 border border-slate-800/80 text-xs"
              >
                <button
                  type="button"
                  onClick={() => setInspectedCard(card)}
                  className="flex items-center gap-2 min-w-0 text-left hover:text-amber-300"
                >
                  <span className="sc-deck-thumb relative overflow-hidden rounded border border-slate-700/80 bg-slate-950 shrink-0">
                    <span className="absolute inset-0 origin-top-left" style={{ transform: 'scale(0.179)' }}>
                      <CardFace card={card} size="hand" />
                    </span>
                  </span>
                  <span className="truncate text-slate-200">{card.name}</span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono-num text-amber-300 font-semibold">x{count}</span>
                  {mode === 'builder' && (
                    <button
                      type="button"
                      onClick={() => removeCardFromDeck(card.id)}
                      className="text-slate-500 hover:text-red-400"
                      aria-label={`Remover ${card.name}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeDeckIds.length >= MAX_DECK_SIZE && !deckCheck.ok && (
            <p className="text-[11px] text-rose-300 leading-snug">{deckCheck.errors[0]}</p>
          )}
          <button
            type="button"
            disabled={!deckCheck.ok}
            onClick={onStartMatch}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {activeDeckIds.length < MAX_DECK_SIZE
                ? `Complete ${MAX_DECK_SIZE} cartas`
                : deckCheck.ok
                  ? 'Entrar em Batalha'
                  : 'Baralho inválido'}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
};
