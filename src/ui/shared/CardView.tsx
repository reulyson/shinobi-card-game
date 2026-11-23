import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Wrench } from 'lucide-react';
import {
  BoardUnit,
  CardDef,
  KeywordBurstId,
} from '../../types/game';
import { getUnitAuras, KEYWORD_BURSTS } from '../../data/keywordVisuals';
import { getCardById } from '../../data/cards';
import { CardBack } from '../card/CardBack';
import { CardFace, CardFaceSize } from '../card/CardFace';
import { StatColorState } from '../card/theme';

interface CardViewProps {
  card?: CardDef;
  unit?: BoardUnit;
  /**
   * hand = mão (156×219); board/field = campo 119×165 (stats na faixa);
   * collection = grid do deck builder; inspector/zoom = detalhe grande.
   */
  size?: 'hand' | 'board' | 'field' | 'collection' | 'inspector' | 'zoom';
  playable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  faceDown?: boolean;
  effectiveCost?: number;
  /** Override de poder (prévia). */
  power?: number;
  /** Override de vitalidade (prévia). */
  vitality?: number;
  /** Cor da plaquinha de poder vs. base. */
  powerState?: StatColorState;
  /** Cor da plaquinha de vitalidade vs. base. */
  vitalityState?: StatColorState;
  triggerGlow?: 'dawn' | 'nightfall' | null;
  fxState?: {
    type: 'lunge-up' | 'lunge-down' | 'hit' | 'heal' | 'jutsu' | 'evolve' | 'dawn' | 'nightfall';
    label?: string;
  };
  onClick?: () => void;
  onInspect?: (card: CardDef, unit?: BoardUnit) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  keywordBursts?: KeywordBurstId[];
  vanishing?: boolean;
  savedRank?: { level: 1 | 2 | 3; progress: number; target: number };
}

function useLocalKeywordBursts(unit?: BoardUnit): Array<{ id: KeywordBurstId; key: string }> {
  const prevRef = useRef<BoardUnit | undefined>(unit);
  const [bursts, setBursts] = useState<Array<{ id: KeywordBurstId; key: string }>>([]);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = unit;
    if (!prev || !unit || prev.uid !== unit.uid) return;
    const found: KeywordBurstId[] = [];
    if (prev.hasBarrier && !unit.hasBarrier) found.push('substituicao');
    if (prev.hasSpellShield && !unit.hasSpellShield) found.push('contra_jutsu');
    if (!prev.stunned && unit.stunned) found.push('paralisia');
    if (!prev.frozen && unit.frozen) found.push('bloqueio_chakra');
    if (!prev.silenced && unit.silenced) found.push('selado');
    if (!prev.keywords.includes('Exposto') && unit.keywords.includes('Exposto')) found.push('exposto');
    if (!prev.immortalUsed && unit.immortalUsed) found.push('segunda_chance');
    if (
      !unit.silenced &&
      unit.keywords.includes('Regenerar') &&
      unit.health > prev.health &&
      unit.health === unit.maxHealth
    ) {
      found.push('cura_natural');
    }
    if (found.length === 0) return;
    const stamp = Date.now();
    setBursts(found.map((id) => ({ id, key: `${id}-${stamp}` })));
    const t = window.setTimeout(() => setBursts([]), 1250);
    return () => window.clearTimeout(t);
  }, [unit]);
  return bursts;
}

function toFaceSize(size: CardViewProps['size']): CardFaceSize {
  switch (size) {
    case 'board':
    case 'field':
      return 'field';
    case 'collection':
      return 'collection';
    case 'inspector':
    case 'zoom':
      return 'zoom';
    case 'hand':
    case undefined:
      return 'hand';
    default: {
      const _never: never = size;
      void _never;
      return 'hand';
    }
  }
}

export const CardView: React.FC<CardViewProps> = ({
  card: propCard,
  unit,
  size = 'hand',
  playable = false,
  selected = false,
  dimmed = false,
  faceDown = false,
  effectiveCost,
  power,
  vitality,
  powerState,
  vitalityState,
  triggerGlow = null,
  fxState,
  onClick,
  onInspect,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  keywordBursts,
  vanishing = false,
  savedRank,
}) => {
  const card = propCard || (unit ? getCardById(unit.cardId) : undefined);
  const localBursts = useLocalKeywordBursts(unit);
  const faceSize = toFaceSize(size);
  const isField = faceSize === 'field';

  if (faceDown) {
    // Mão mantém footprint 100×140 (compatível com BattleScreen); campo 119×165 (v7o).
    const wrap =
      isField
        ? 'w-[119px] h-[165px] shrink-0'
        : size === 'hand'
          ? 'w-[100px] h-[140px] shrink-0'
          : 'w-20 h-28';
    return (
      <div className={wrap}>
        <CardBack field={isField} className="w-full h-full" />
      </div>
    );
  }

  if (!card) return null;

  // Campo / board: só CardFace size="field" (aprovado). Sem badges/auras/chips
  // que alteravam a face vs compare-final-campo. Vanish = mesma face + animação.
  if (isField) {
    const fxClass =
      fxState?.type === 'lunge-up'
        ? 'animate-lunge-up'
        : fxState?.type === 'lunge-down'
          ? 'animate-lunge-down'
          : fxState?.type === 'hit'
            ? 'animate-hit-shake'
            : '';
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onContextMenu={(e) => {
          if (onInspect) {
            e.preventDefault();
            onInspect(card, unit);
          }
        }}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        style={{ zoom: 'var(--board-zoom, 1)' } as React.CSSProperties}
        className={`relative w-[119px] h-[165px] shrink-0 select-none ${fxClass} ${
          onClick ? 'cursor-pointer' : ''
        } ${vanishing ? 'animate-clone-vanish pointer-events-none' : ''} ${
          selected ? '-translate-y-2' : ''
        }`}
        data-card-view="field"
      >
        <CardFace
          card={card}
          unit={unit}
          size="field"
          effectiveCost={effectiveCost}
          power={power}
          vitality={vitality}
          powerState={powerState}
          vitalityState={vitalityState}
          rankLevel={unit?.evolutionLevel ?? savedRank?.level}
          levelProgress={unit?.evolutionProgress ?? savedRank?.progress}
          selected={selected}
          dimmed={dimmed}
          playable={playable}
        />
      </div>
    );
  }

  const keywords =
    card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token'
      ? unit
        ? unit.keywords
        : card.keywords
      : [];
  const auras =
    card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token'
      ? getUnitAuras(unit, keywords)
      : [];
  const allBursts = [
    ...(keywordBursts || []).map((id) => ({ id, key: `fx-${id}` })),
    ...localBursts.filter((b) => !(keywordBursts || []).includes(b.id)),
  ];

  const activeAura: 'dawn' | 'nightfall' | null =
    fxState?.type === 'dawn'
      ? 'dawn'
      : fxState?.type === 'nightfall'
        ? 'nightfall'
        : triggerGlow ?? unit?.activatedTrigger ?? null;

  const liftClass = selected ? '-translate-y-2' : playable ? 'hover:-translate-y-2' : '';

  const fxClass =
    fxState?.type === 'lunge-up'
      ? 'animate-lunge-up'
      : fxState?.type === 'lunge-down'
        ? 'animate-lunge-down'
        : fxState?.type === 'hit'
          ? 'animate-hit-shake'
          : '';

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onInspect) {
      e.preventDefault();
      onInspect(card, unit);
    }
  };

  const wrapStyle: React.CSSProperties | undefined =
    size === 'hand'
      ? ({ zoom: 'var(--hand-zoom, 1)' } as React.CSSProperties)
      : undefined;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => {
        if (size === 'hand') {
          onInspect?.(card, unit);
        }
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={wrapStyle}
      className={`group relative transition-transform duration-150 select-none ${
        size === 'hand' ? 'w-[100px] h-[140px] shrink-0' : 'w-full'
      } ${liftClass} ${fxClass} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : onClick ? 'cursor-pointer' : ''
      } ${vanishing ? 'animate-clone-vanish pointer-events-none' : ''}`}
    >
      {savedRank && savedRank.level > 1 && (
        <div
          data-saved-rank={savedRank.level}
          title={`Patente salva: entra como ${savedRank.level === 3 ? 'Jounnin' : 'Chuunin'}${
            savedRank.level < 3 && savedRank.target ? ` (progresso ${savedRank.progress}/${savedRank.target})` : ''
          }`}
          className={`pointer-events-none absolute right-1 top-1 z-40 rounded-full border px-1.5 py-px text-[9px] font-black uppercase leading-tight tracking-wide shadow-lg ${
            savedRank.level === 3
              ? 'border-orange-300 bg-orange-600/95 text-white'
              : 'border-emerald-300 bg-emerald-700/95 text-white'
          }`}
        >
          ★ {savedRank.level === 3 ? 'Jounnin' : 'Chuunin'}
          {savedRank.level < 3 && savedRank.target ? ` ${savedRank.progress}/${savedRank.target}` : ''}
        </div>
      )}

      {activeAura === 'dawn' && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1.5 z-0 rounded-xl bg-gradient-to-tr from-amber-500/55 via-yellow-300/45 to-orange-400/55 blur-[6px] animate-solar-glow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-0.5 z-0 rounded-[10px] border border-amber-300/80"
          />
        </>
      )}
      {activeAura === 'nightfall' && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1.5 z-0 rounded-xl bg-gradient-to-tr from-indigo-600/55 via-violet-400/40 to-sky-300/45 blur-[6px] animate-lunar-glow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-0.5 z-0 rounded-[10px] border border-indigo-300/80"
          />
        </>
      )}

      {fxState?.type === 'dawn' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2.5 z-20 rounded-xl border-2 border-amber-200/95 shadow-[0_0_28px_rgba(251,191,36,0.95)] animate-solar-burst"
        />
      )}
      {fxState?.type === 'nightfall' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2.5 z-20 rounded-xl border-2 border-indigo-200/95 shadow-[0_0_28px_rgba(129,140,248,0.95)] animate-lunar-burst"
        />
      )}

      {activeAura && !fxState?.label && size === 'hand' && (
        <div
          className={`pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[9px] font-bold shadow-md whitespace-nowrap ${
            activeAura === 'dawn'
              ? 'bg-amber-950/95 border-amber-300 text-amber-200'
              : 'bg-indigo-950/95 border-indigo-300 text-indigo-200'
          }`}
          title={activeAura === 'dawn' ? 'Bônus da 1ª carta da rodada' : 'Bônus por já ter jogado outra carta'}
        >
          {activeAura === 'dawn' ? (
            <>
              <Sun className="w-2.5 h-2.5 text-amber-300" />
              <span>1ª carta</span>
            </>
          ) : (
            <>
              <Moon className="w-2.5 h-2.5 text-indigo-300" />
              <span>Bônus</span>
            </>
          )}
        </div>
      )}

      {fxState?.label && (
        <div className="absolute top-7 inset-x-0 z-[60] pointer-events-none flex justify-center animate-float-num">
          <span
            className={`px-2 py-0.5 rounded font-mono-num text-[11px] font-extrabold shadow-lg border flex items-center gap-1 whitespace-nowrap ${
              fxState.type === 'dawn'
                ? 'bg-amber-950/95 border-amber-300 text-amber-100'
                : fxState.type === 'nightfall'
                  ? 'bg-indigo-950/95 border-indigo-300 text-indigo-100'
                  : fxState.type === 'heal'
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                    : fxState.type === 'hit'
                      ? 'bg-red-950/95 border-red-400 text-red-200'
                      : 'bg-sky-950/95 border-sky-400 text-sky-200'
            }`}
          >
            {fxState.type === 'dawn' && <Sun className="w-3 h-3 text-amber-300 shrink-0" />}
            {fxState.type === 'nightfall' && <Moon className="w-3 h-3 text-indigo-300 shrink-0" />}
            {fxState.label}
          </span>
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        {unit && auras.map((aura) => <div key={aura} className={`kw-aura z-[15] ${aura}`} aria-hidden="true" />)}
        {allBursts.map((b) => (
          <div key={b.key} className={`kw-burst ${KEYWORD_BURSTS[b.id].className}`} aria-hidden="true" />
        ))}
        {allBursts.length > 0 && (
          <div className="absolute inset-x-0 bottom-9 z-40 flex flex-col items-center gap-0.5 pointer-events-none">
            {allBursts.slice(0, 3).map((b) => {
              const Icon = KEYWORD_BURSTS[b.id].icon;
              return (
                <span
                  key={`lbl-${b.key}`}
                  className="kw-burst-label px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-300/70 text-[9px] font-bold text-amber-100 flex items-center gap-0.5 whitespace-nowrap shadow"
                >
                  <Icon className="w-2.5 h-2.5" />
                  {KEYWORD_BURSTS[b.id].label}
                </span>
              );
            })}
          </div>
        )}

        {unit?.equippedCardId && (
          <span
            className={`absolute right-1 top-7 z-20 px-1 py-0.5 rounded bg-slate-900/95 border text-[10px] font-semibold flex items-center ${
              unit.silenced
                ? 'border-slate-600 text-slate-400 opacity-70'
                : 'border-cyan-400/70 text-cyan-300'
            }`}
            title={
              unit.silenced
                ? `Equipado: ${getCardById(unit.equippedCardId)?.name} (desligado enquanto Selado)`
                : `Equipado: ${getCardById(unit.equippedCardId)?.name}`
            }
          >
            <Wrench className="w-2.5 h-2.5" />
          </span>
        )}

        {fxState?.type === 'hit' && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-slash shadow-[0_0_12px_#F59E0B]" />
          </div>
        )}

        {size === 'hand' ? (
          <div
            className="origin-top-left"
            style={{ width: 156, height: 219, transform: 'scale(0.641)' }}
          >
            <CardFace
              card={card}
              unit={unit}
              size="hand"
              effectiveCost={effectiveCost}
              power={power}
              vitality={vitality}
              powerState={powerState}
              vitalityState={vitalityState}
              rankLevel={unit?.evolutionLevel ?? savedRank?.level}
              levelProgress={unit?.evolutionProgress ?? savedRank?.progress}
              selected={selected}
              dimmed={dimmed}
              playable={playable}
            />
          </div>
        ) : (
          <CardFace
            card={card}
            unit={unit}
            size={faceSize}
            effectiveCost={effectiveCost}
            power={power}
            vitality={vitality}
            powerState={powerState}
            vitalityState={vitalityState}
            rankLevel={unit?.evolutionLevel ?? savedRank?.level}
            levelProgress={unit?.evolutionProgress ?? savedRank?.progress}
            selected={selected}
            dimmed={dimmed}
            playable={playable}
          />
        )}
      </div>
    </div>
  );
};

export type { StatColorState };
