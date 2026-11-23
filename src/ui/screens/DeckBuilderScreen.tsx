import React, { useMemo, useState } from 'react';
import { Plus, Minus, RotateCcw, Search, BookOpen, Hammer, ArrowLeft, Save } from 'lucide-react';
import {
  ALL_CARDS,
  DECK_PRESETS,
  getNotDeckableReason,
  isDeckableCard,
  validateDeck,
  getCardById,
} from '../../data/cards';
import {
  ArenaId,
  CardDef,
  formatKeywords,
  isOcultoJutsu,
  JutsuSpeed,
  SPEED_DISPLAY_NAME,
  TeamFaction,
} from '../../types/game';
import { CardView } from '../shared/CardView';
import { CardFace } from '../card/CardFace';
import { CardInspector } from '../shared/CardInspector';
import { DomainPageHero, DomainPageShell, DomainPanel, type MenuDomain } from '../shell';

interface DeckBuilderScreenProps {
  mode: 'collection' | 'builder';
  activeDeckIds: string[];
  selectedArena: ArenaId;
  onUpdateDeck: (cardIds: string[]) => void;
  onSelectArena: (arena: ArenaId) => void;
  onStartMatch: () => void;
  onOpenDeckBuilder?: () => void;
  /** Apenas no editor (montar-deck/criar|editar). */
  deckName?: string;
  onDeckNameChange?: (name: string) => void;
  onSaveDeck?: () => void;
  onCancelEdit?: () => void;
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
  | 'Oculto'
  | JutsuSpeed;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Ninja', label: 'Ninjas (Promoção)' },
  { id: 'Unidade', label: 'Unidades' },
  { id: 'Equipamento', label: 'Equipamentos' },
  { id: 'Oculto', label: 'Ocultos' },
  { id: 'Imediata', label: SPEED_DISPLAY_NAME.Imediata },
  { id: 'Rapida', label: SPEED_DISPLAY_NAME.Rapida },
  { id: 'Focada', label: SPEED_DISPLAY_NAME.Focada },
  { id: 'Lenta', label: SPEED_DISPLAY_NAME.Lenta },
  { id: 'Oculta', label: SPEED_DISPLAY_NAME.Oculta },
];

const MAX_DECK_SIZE = 24;

export const DeckBuilderScreen: React.FC<DeckBuilderScreenProps> = ({
  mode,
  activeDeckIds,
  selectedArena,
  onUpdateDeck,
  onSelectArena,
  onStartMatch,
  onOpenDeckBuilder,
  deckName,
  onDeckNameChange,
  onSaveDeck,
  onCancelEdit,
}) => {
  const isGrimorio = mode === 'collection';
  const [factionFilter, setFactionFilter] = useState<'Todos' | TeamFaction>('Todos');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Todos');
  const [search, setSearch] = useState('');
  const [inspectedCard, setInspectedCard] = useState<CardDef | null>(ALL_CARDS[0]);
  const [inspectorRank, setInspectorRank] = useState<1 | 2 | 3>(1);

  const selectCardForInspect = (card: CardDef) => {
    setInspectedCard(card);
    if (card.kind === 'ninja') {
      setInspectorRank(1);
    }
  };

  const filteredCards = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (factionFilter !== 'Todos' && card.faction !== factionFilter) return false;
      if (typeFilter === 'Ninja' && card.kind !== 'ninja') return false;
      if (typeFilter === 'Unidade' && card.kind !== 'unidade') return false;
      if (typeFilter === 'Equipamento' && card.kind !== 'equipamento') return false;
      if (typeFilter === 'Oculto' && !isOcultoJutsu(card)) return false;
      if (
        (typeFilter === 'Imediata' ||
          typeFilter === 'Rapida' ||
          typeFilter === 'Focada' ||
          typeFilter === 'Lenta' ||
          typeFilter === 'Oculta') &&
        (card.kind !== 'jutsu' || card.speed !== typeFilter)
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const text =
          card.kind === 'jutsu'
            ? `${card.name} ${card.effectText} ${SPEED_DISPLAY_NAME[card.speed]} ${card.category} ${card.faction}`
            : card.kind === 'equipamento'
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

  const shellDomain: MenuDomain = isGrimorio ? 'grimorio' : 'montar-deck';
  const deckFillPct = Math.min(100, Math.round((activeDeckIds.length / MAX_DECK_SIZE) * 100));

  const searchField = (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar carta ou palavra-chave..."
        className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-900 border text-slate-100 placeholder:text-slate-500 focus:outline-none ${
          isGrimorio
            ? 'border-sky-800/80 focus:border-sky-400'
            : 'border-emerald-900/60 focus:border-emerald-400'
        }`}
      />
    </div>
  );

  const heroActions = isGrimorio ? (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
      <span className="domain-mode-chip domain-mode-chip--sky">
        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
        Somente consulta
      </span>
      {searchField}
      {onOpenDeckBuilder && (
        <button
          type="button"
          onClick={onOpenDeckBuilder}
          className="btn-ember text-sm px-4 py-2 whitespace-nowrap"
        >
          Montar Deck →
        </button>
      )}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
      {onCancelEdit && (
        <button type="button" onClick={onCancelEdit} className="btn-ghost text-sm py-2 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Meus decks
        </button>
      )}
      <span className="domain-mode-chip domain-mode-chip--jade">
        <Hammer className="w-3.5 h-3.5" aria-hidden="true" />
        Montagem
      </span>
    </div>
  );

  const builderToolbar = !isGrimorio ? (
    <div className="deck-editor-toolbar shrink-0">
      <div className="deck-editor-toolbar__search">{searchField}</div>
      {onDeckNameChange && (
        <label className="deck-editor-toolbar__name">
          <span className="deck-editor-toolbar__label">Nome do deck</span>
          <input
            type="text"
            value={deckName ?? ''}
            onChange={(e) => onDeckNameChange(e.target.value)}
            maxLength={48}
            placeholder="Ex.: Time 7 ofensivo"
            className="deck-editor-toolbar__input"
          />
        </label>
      )}
      <div className="deck-hero-meter deck-editor-toolbar__meter">
        <span className="deck-hero-meter__label">Progresso</span>
        <div
          className="deck-hero-meter__track"
          role="meter"
          aria-valuenow={activeDeckIds.length}
          aria-valuemin={0}
          aria-valuemax={MAX_DECK_SIZE}
        >
          <div
            className={`deck-hero-meter__fill ${activeDeckIds.length >= MAX_DECK_SIZE && !deckCheck.ok ? 'deck-hero-meter__fill--invalid' : ''}`}
            style={{ width: `${deckFillPct}%` }}
          />
        </div>
        <span className="deck-hero-meter__meta">
          {activeDeckIds.length}/{MAX_DECK_SIZE} · Ninjas {distinctNinjasCount}/3
          {deckCheck.ok && activeDeckIds.length >= MAX_DECK_SIZE ? ' · Pronto' : ''}
        </span>
      </div>
    </div>
  ) : null;

  const factionActiveClass = isGrimorio
    ? 'bg-sky-500 text-slate-950 font-semibold'
    : 'bg-emerald-500 text-slate-950 font-semibold';
  const typeActiveClass = isGrimorio
    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/70'
    : 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/70';

  const filterControls = (
    <div className="deck-filter-stack">
      <div className="deck-filter-chips" role="group" aria-label="Filtrar por time">
        {FACTIONS.map((faction) => (
          <button
            key={faction}
            type="button"
            onClick={() => setFactionFilter(faction)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              factionFilter === faction
                ? factionActiveClass
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
            }`}
          >
            {faction}
          </button>
        ))}
      </div>
      <div className="deck-filter-chips deck-filter-chips--types" role="group" aria-label="Filtrar por tipo">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTypeFilter(t.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              typeFilter === t.id
                ? typeActiveClass
                : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );

  const deckRailPanel = (
    <DomainPanel accent="jade" className="deck-workshop-rail deck-workshop-rail--editor">
      <div className="deck-workshop-rail__head">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-display text-emerald-100 tracking-wide">Seu baralho</h2>
          <button
            type="button"
            onClick={() => onUpdateDeck(DECK_PRESETS[0].cardIds)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-300"
            title="Restaurar deck inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Toque em <strong className="text-emerald-200">+</strong> no catálogo ou remova aqui.
        </p>
      </div>

      <details className="deck-workshop-rail__presets">
        <summary className="deck-workshop-rail__presets-summary">Importar modelo pronto</summary>
        <div className="flex flex-col gap-1 mt-2">
          {DECK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onUpdateDeck(preset.cardIds)}
              className="text-left px-2.5 py-2 rounded-md bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-colors"
            >
              <div className="text-xs font-semibold text-white">{preset.name}</div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{preset.subtitle}</div>
            </button>
          ))}
        </div>
      </details>

      <div className="deck-workshop-rail__curve" aria-hidden={activeDeckIds.length === 0}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Curva</span>
        <div className="deck-mana-curve">
          {manaCurve.map((val, idx) => (
            <div key={idx} className="deck-mana-curve__col" title={`${val} cartas`}>
              <div className="deck-mana-curve__bar" style={{ height: `${Math.max(4, (val / maxBucket) * 100)}%` }} />
              <span className="deck-mana-curve__lbl">{idx === 5 ? '6+' : idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="deck-workshop-rail__list">
        {uniqueDeckEntries.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhuma carta no baralho ainda.</p>
        ) : (
          uniqueDeckEntries.map(({ card, count }) => (
            <div
              key={card.id}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-slate-900/90 border border-slate-800/80 text-xs"
            >
              <button
                type="button"
                onClick={() => selectCardForInspect(card)}
                className="flex items-center gap-2 min-w-0 text-left hover:text-emerald-300"
              >
                <span className="sc-deck-thumb relative overflow-hidden rounded border border-slate-700/80 bg-slate-950 shrink-0">
                  <span className="absolute inset-0 origin-top-left" style={{ transform: 'scale(0.179)' }}>
                    <CardFace card={card} size="hand" />
                  </span>
                </span>
                <span className="truncate text-slate-200">{card.name}</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono-num text-emerald-300 font-semibold">x{count}</span>
                <button
                  type="button"
                  onClick={() => removeCardFromDeck(card.id)}
                  className="text-slate-500 hover:text-red-400"
                  aria-label={`Remover ${card.name}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="deck-workshop-rail__foot">
        {activeDeckIds.length >= MAX_DECK_SIZE && !deckCheck.ok && (
          <p className="text-[11px] text-rose-300 leading-snug mb-2">{deckCheck.errors[0]}</p>
        )}
        {onSaveDeck ? (
          <button
            type="button"
            onClick={onSaveDeck}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar deck
          </button>
        ) : (
          <button
            type="button"
            disabled={!deckCheck.ok}
            onClick={onStartMatch}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <span>
              {activeDeckIds.length < MAX_DECK_SIZE
                ? `Complete ${MAX_DECK_SIZE} cartas`
                : deckCheck.ok
                  ? 'Entrar em Batalha'
                  : 'Baralho inválido'}
            </span>
          </button>
        )}
      </div>
    </DomainPanel>
  );

  const catalogBody = (
    <>
            {filterControls}
            {filteredCards.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
                Nenhuma carta encontrada com esses filtros.
              </div>
            ) : (
              <div
                className={`card-collection-grid grid gap-3 sm:gap-4 ${
                  isGrimorio
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5'
                }`}
              >
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
                    onClick={() => selectCardForInspect(card)}
                    onInspect={(c) => selectCardForInspect(c)}
                  />
                  {mode === 'builder' && !isDeckableCard(card) && (
                    <p className="px-1 text-[11px] leading-snug text-rose-300/90">
                      {getNotDeckableReason(card)}
                    </p>
                  )}
                  {mode === 'builder' && isDeckableCard(card) && (
                    <div className="flex items-center justify-between px-1 rounded-md border border-emerald-500/25 bg-emerald-950/30">
                      <span className="text-xs font-mono-num text-slate-300">
                        No deck: <strong className="text-emerald-200">{count}</strong>/{maxCopies}
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
                          className="p-1.5 rounded bg-emerald-500/25 border border-emerald-500/60 hover:bg-emerald-500/35 text-emerald-100 disabled:opacity-35"
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
    </>
  );

  return (
    <DomainPageShell wide dense fill>
      <DomainPageHero domain={shellDomain} compact actions={heroActions} />
      {builderToolbar}
      <div
        className={`domain-split-view flex-1 min-h-0 ${isGrimorio ? '' : 'domain-split-view--editor'}`}
      >
        <div
          className={`domain-split-view__main ${
            isGrimorio ? 'domain-filter-rail catalog-surface' : 'deck-catalog-surface'
          }`}
        >
          {isGrimorio && (
            <div className="text-[11px] text-sky-200/85 leading-snug space-y-1">
              <p>
                {filteredCards.length} resultados · {ALL_CARDS.length} cartas no catálogo
              </p>
              <p className="text-sky-200/60">
                Só <strong className="text-sky-100 font-semibold">Ninjas</strong> promovem (Gennin → Chuunin →
                Jounnin). Unidades, Jutsus e equipamentos não têm patentes. As graduações ficam no painel{' '}
                <strong className="text-sky-100 font-semibold">Detalhe da carta</strong> à direita.
              </p>
            </div>
          )}
          {catalogBody}
        </div>

        {!isGrimorio && (
          <aside className="domain-split-view__aside">{deckRailPanel}</aside>
        )}

        {isGrimorio && (
          <aside className="domain-split-view__aside">
            <DomainPanel accent="sky" className="p-3 flex-1 min-h-0 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/90 mb-1.5 shrink-0">
                Detalhe da carta
              </p>
              <div className="min-h-0 overflow-y-auto">
                <CardInspector
                  card={inspectedCard}
                  previewRank={inspectedCard?.kind === 'ninja' ? inspectorRank : undefined}
                  onPreviewRankChange={
                    inspectedCard?.kind === 'ninja' ? (rank) => setInspectorRank(rank) : undefined
                  }
                />
              </div>
            </DomainPanel>
          </aside>
        )}
      </div>
    </DomainPageShell>
  );
};
