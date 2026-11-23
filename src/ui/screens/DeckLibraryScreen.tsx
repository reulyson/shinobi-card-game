import React, { useMemo } from 'react';
import { Hammer, Plus, Pencil, Trash2, Play, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { DECK_PRESETS, getCardById, validateDeck } from '../../data/cards';
import { CardFace } from '../card/CardFace';
import { DomainPageHero, DomainPageShell, DomainSection } from '../shell';
import type { SavedDeck } from '../../storage/deckLibrary';

const MAX_DECK_SIZE = 24;

interface DeckLibraryScreenProps {
  decks: SavedDeck[];
  activeDeckId: string;
  onCreateDeck: () => void;
  onEditDeck: (deckId: string) => void;
  onSelectActive: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onDuplicateDeck: (deckId: string) => void;
  onImportPreset: (presetId: string) => void;
  onStartMatch: () => void;
}

function deckPreviewIds(cardIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of cardIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 4) break;
  }
  return out;
}

export const DeckLibraryScreen: React.FC<DeckLibraryScreenProps> = ({
  decks,
  activeDeckId,
  onCreateDeck,
  onEditDeck,
  onSelectActive,
  onDeleteDeck,
  onDuplicateDeck,
  onImportPreset,
  onStartMatch,
}) => {
  const activeDeck = decks.find((d) => d.id === activeDeckId);
  const activeCheck = useMemo(
    () => (activeDeck ? validateDeck(activeDeck.cardIds) : { ok: false, errors: ['Sem baralho'] }),
    [activeDeck]
  );

  return (
    <DomainPageShell wide dense fill>
      <DomainPageHero
        domain="montar-deck"
        compact
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="domain-mode-chip domain-mode-chip--jade">
              <Hammer className="w-3.5 h-3.5" aria-hidden="true" />
              Meus baralhos
            </span>
            <button type="button" onClick={onCreateDeck} className="btn-ember text-sm px-4 py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar deck
            </button>
            {activeDeck && (
              <button
                type="button"
                disabled={!activeCheck.ok}
                onClick={onStartMatch}
                className="btn-ghost text-sm py-2 px-4 flex items-center gap-2 border-emerald-500/40 text-emerald-100 disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-current" />
                Duelar
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-0.5">
      <DomainSection
        accent="jade"
        dense
        title="Baralhos salvos"
        className="deck-catalog-surface"
      >
        {decks.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum deck ainda. Clique em Criar deck.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {decks.map((deck) => {
              const check = validateDeck(deck.cardIds);
              const isActive = deck.id === activeDeckId;
              const preview = deckPreviewIds(deck.cardIds);
              const ninjaCount = new Set(
                deck.cardIds.filter((id) => getCardById(id)?.kind === 'ninja')
              ).size;

              return (
                <li
                  key={deck.id}
                  className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                    isActive
                      ? 'border-emerald-400/70 bg-emerald-950/25 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-white truncate">{deck.name}</h3>
                      <p className="text-xs font-mono-num text-slate-400 mt-0.5">
                        {deck.cardIds.length}/{MAX_DECK_SIZE} cartas · Ninjas {ninjaCount}/3
                      </p>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">
                        Ativo
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    {preview.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Vazio — edite para adicionar cartas</span>
                    ) : (
                      preview.map((id) => {
                        const card = getCardById(id);
                        if (!card) return null;
                        return (
                          <span
                            key={id}
                            className="sc-deck-thumb relative overflow-hidden rounded border border-slate-700/80 bg-slate-950 shrink-0"
                          >
                            <span className="absolute inset-0 origin-top-left" style={{ transform: 'scale(0.179)' }}>
                              <CardFace card={card} size="hand" />
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <DeckStatus check={check} />

                  <div className="flex flex-wrap gap-2 pt-1">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelectActive(deck.id)}
                        className="btn-ghost text-xs py-1.5 px-2.5"
                      >
                        Usar no duelo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditDeck(deck.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-200 hover:text-white py-1.5 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateDeck(deck.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-200"
                      aria-label="Duplicar deck"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {decks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteDeck(deck.id)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 ml-auto"
                        aria-label="Excluir deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DomainSection>

      <DomainSection accent="ember" dense title="Modelos prontos">
        <div className="grid gap-2 sm:grid-cols-2">
          {DECK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onImportPreset(preset.id)}
              className="text-left p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{preset.subtitle}</p>
            </button>
          ))}
        </div>
      </DomainSection>
      </div>
    </DomainPageShell>
  );
};

function DeckStatus({ check }: { check: ReturnType<typeof validateDeck> }) {
  if (check.ok) {
    return (
      <p className="text-xs text-emerald-300/90 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Pronto para duelo
      </p>
    );
  }
  if (check.errors[0]) {
    return (
      <p className="text-xs text-amber-200/90 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        {check.errors[0]}
      </p>
    );
  }
  return null;
}