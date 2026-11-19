import React, { useEffect, useRef, useState } from 'react';
import {
  Swords,
  Heart,
  Sparkles,
  Zap,
  Hourglass,
  EyeOff,
  Wrench,
  Sun,
  Moon,
} from 'lucide-react';
import {
  BoardUnit,
  CardDef,
  formatKeywords,
  getKeywordLabel,
  JutsuSpeed,
  KeywordBurstId,
  SPEED_DISPLAY_NAME,
} from '../types/game';
import { getUnitAuras, getUnitBadges, KEYWORD_BURSTS } from '../data/keywordVisuals';
import { getCardById } from '../data/cards';
import { getUnitHealth, getUnitPower } from '../engine/battleEngine';
import { AnimePortrait } from './AnimePortrait';
import CardBack from './CardBack';
import { VillageSymbol } from './OfficialImage';
import { villageOfFaction } from '../data/officialArt';

interface CardViewProps {
  card?: CardDef;
  unit?: BoardUnit;
  size?: 'hand' | 'board' | 'collection' | 'inspector';
  playable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  faceDown?: boolean;
  effectiveCost?: number;
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
  /** Disparos de palavras-chave vindos do combate (animação curta + nome). */
  keywordBursts?: KeywordBurstId[];
  /** Carta desaparecendo (Clone). */
  vanishing?: boolean;
  /** Memória de patente: Ninja na mão que vai entrar já promovido (indicador pequeno). */
  savedRank?: { level: 1 | 2 | 3; progress: number; target: number };
}

/** Detecta mudanças de estado da unidade e gera disparos locais (Substituição estourou, Paralisia aplicada...). */
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
    if (!prev.keywords.includes('Vulnerável') && unit.keywords.includes('Vulnerável')) found.push('exposto');
    if (!prev.immortalUsed && unit.immortalUsed) found.push('segunda_chance');
    if (
      !unit.silenced &&
      unit.keywords.includes('Regeneração') &&
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

const SPEED_META: Record<JutsuSpeed, { label: string; icon: React.ReactNode; color: string }> = {
  Rapida: { label: SPEED_DISPLAY_NAME.Rapida, icon: <Zap className="w-3 h-3" />, color: 'text-sky-300' },
  Lenta: { label: SPEED_DISPLAY_NAME.Lenta, icon: <Hourglass className="w-3 h-3" />, color: 'text-amber-300' },
  Imediata: { label: SPEED_DISPLAY_NAME.Imediata, icon: <Sparkles className="w-3 h-3" />, color: 'text-emerald-300' },
  Focada: { label: SPEED_DISPLAY_NAME.Focada, icon: <Sparkles className="w-3 h-3" />, color: 'text-teal-300' },
};

export const CardView: React.FC<CardViewProps> = ({
  card: propCard,
  unit,
  size = 'hand',
  playable = false,
  selected = false,
  dimmed = false,
  faceDown = false,
  effectiveCost,
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

  if (faceDown) {
    return <CardBack className={size === 'board' ? 'w-[84px] h-[116px]' : 'w-20 h-28'} />;
  }

  if (!card) return null;

  const evolutionLevel = unit?.evolutionLevel ?? 1;
  const isEvolved = unit ? evolutionLevel >= 2 : false;
  const cost = effectiveCost ?? card.cost;
  const isCharacter =
    card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token';

  const displayAttack = isCharacter
    ? unit
      ? getUnitPower(unit)
      : card.attack
    : 0;
  const displayHealth = isCharacter
    ? unit
      ? getUnitHealth(unit)
      : card.health
    : 0;
  const keywords = isCharacter ? (unit ? unit.keywords : card.keywords) : [];
  const badges = isCharacter ? getUnitBadges(unit, keywords) : [];
  const auras = isCharacter ? getUnitAuras(unit, keywords) : [];
  // No campo cabem 2 ícones acima do nome (o "+N" conta como um deles); o resto fica no tooltip.
  const maxBadges = size === 'board' ? 2 : 4;
  const shownBadges = badges.length > maxBadges ? maxBadges - 1 : maxBadges;
  const allBursts = [
    ...(keywordBursts || []).map((id) => ({ id, key: `fx-${id}` })),
    ...localBursts.filter((b) => !(keywordBursts || []).includes(b.id)),
  ];

  const sizeClasses =
    size === 'board'
      ? 'w-[84px] h-[116px] shrink-0'
      : size === 'hand'
        ? 'w-[100px] h-[140px] shrink-0'
        : size === 'collection'
          ? 'w-full h-72'
          : 'w-full h-96';

  const activeAura: 'dawn' | 'nightfall' | null =
    fxState?.type === 'dawn'
      ? 'dawn'
      : fxState?.type === 'nightfall'
        ? 'nightfall'
        : triggerGlow ?? unit?.activatedTrigger ?? null;

  const liftClass = selected
    ? '-translate-y-2'
    : playable
      ? 'hover:-translate-y-2'
      : '';

  const borderClass = selected
    ? 'border-amber-400 ring-2 ring-amber-400/70'
    : activeAura === 'dawn'
      ? 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.65)]'
      : activeAura === 'nightfall'
        ? 'border-indigo-300 shadow-[0_0_20px_rgba(129,140,248,0.65)]'
        : evolutionLevel === 3
          ? 'border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.38)]'
          : evolutionLevel === 2
            ? 'border-amber-400/90 shadow-[0_0_14px_rgba(245,158,11,0.28)]'
            : playable
              ? 'border-sky-400/90 hover:border-amber-300'
              : card.kind === 'equipamento'
                ? 'border-cyan-600/70'
                : card.kind === 'armadilha'
                  ? 'border-purple-500/80'
                  : card.kind === 'jutsu'
                    ? 'border-sky-500/75'
                    : card.kind === 'ninja'
                      ? 'border-orange-500/80'
                      : 'border-[#a0703f]/90';

  // Nome em fonte de título (Bangers, só maiúsculas e mais larga): no tabuleiro fica mais justo para não truncar mais que antes
  const nameClass = `${size === 'board' ? 'text-[11px] tracking-normal' : 'text-xs tracking-wide'} font-display text-white leading-tight truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]`;

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
        if (size === 'hand' || size === 'board') {
          onInspect?.(card, unit);
        }
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={
        size === 'board'
          ? ({ zoom: 'var(--board-zoom, 1)' } as React.CSSProperties)
          : size === 'hand'
            ? ({ zoom: 'var(--hand-zoom, 1)' } as React.CSSProperties)
            : undefined
      }
      className={`group relative transition-transform duration-150 select-none ${sizeClasses} ${liftClass} ${fxClass} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : onClick ? 'cursor-pointer' : ''
      } ${dimmed ? 'brightness-[0.62] saturate-50' : ''} ${vanishing ? 'animate-clone-vanish pointer-events-none' : ''}`}
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
      {/* Outer Solar (Amanhecer) & Lunar (Anoitecer) Glow Halos */}
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

      {/* Expanding Burst Halo on Correct-Moment Play */}
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

      {/* Top Crest Icon for Dawn / Nightfall (non-hue-only signal) */}
      {activeAura && !fxState?.label && (size === 'hand' || size === 'board') && (
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

      {/* Floating Feedback Label */}
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

      {/* Inner Clipped Card Surface */}
      <div
        className={`relative z-10 w-full h-full rounded-lg overflow-hidden border bg-[#131C2A] ${borderClass}`}
      >
        {/* Portrait Area */}
        <div className="absolute inset-0">
          <AnimePortrait card={card} evolved={isEvolved} evolutionLevel={evolutionLevel} />
          {/* Degradê só na base: a arte oficial fica visível na maior parte da carta */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-[#090D16] to-transparent ${
              size === 'board' || size === 'hand' ? 'via-[#090D16]/35 via-25% to-50%' : 'via-[#090D16]/45'
            }`}
          />
        </div>
        {/* Moldura de pergaminho (filete interno) */}
        <div className="card-frame-inner" aria-hidden="true" />

        {/* Combat Slash */}
        {fxState?.type === 'hit' && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-slash shadow-[0_0_12px_#F59E0B]" />
          </div>
        )}

        {/* Palavras-chave: auras persistentes em campo */}
        {unit && auras.map((aura) => <div key={aura} className={`kw-aura z-[15] ${aura}`} aria-hidden="true" />)}

        {/* Palavras-chave: disparos curtos */}
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

        {/* Ícones de todas as palavras-chave e estados */}
        {badges.length > 0 && (
          <div className={`absolute left-1 z-20 flex flex-col pointer-events-auto ${size === 'board' ? 'top-7 gap-px' : 'top-8 gap-0.5'}`}>
            {badges.slice(0, shownBadges).map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.key}
                  title={b.label}
                  aria-label={b.label}
                  className={`w-4 h-4 rounded-full bg-slate-950/85 border border-slate-500/70 flex items-center justify-center ${b.color}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
              );
            })}
            {badges.length > maxBadges && (
              <span
                title={badges.slice(shownBadges).map((b) => b.label).join(' · ')}
                className="w-4 h-4 rounded-full bg-slate-950/85 border border-slate-500/70 text-[8px] font-bold text-slate-200 flex items-center justify-center"
              >
                +{badges.length - shownBadges}
              </span>
            )}
          </div>
        )}

      {/* Top Row: Mana Cost + Status */}
      <div className="relative z-10 flex items-start justify-between p-1.5">
        <div
          className={`chakra-orb w-6 h-6 rounded-full flex items-center justify-center font-mono-num text-xs font-bold border ${
            cost < card.cost
              ? 'cost-down bg-emerald-950/90 border-emerald-400 text-emerald-300'
              : cost > card.cost
                ? 'cost-up bg-purple-950/90 border-purple-400 text-purple-200'
                : 'bg-slate-950/90 border-sky-500/70 text-sky-200'
          }`}
          title="Custo de Chakra"
        >
          {cost}
        </div>

        <div className="flex items-center gap-0.5 flex-wrap justify-end max-w-[72px]">
          {unit?.equippedCardId && (
            <span
              className={`px-1 py-0.5 rounded bg-slate-900/95 border text-[10px] font-semibold flex items-center ${
                unit.silenced
                  ? 'border-slate-600 text-slate-400 opacity-70'
                  : 'border-cyan-400/70 text-cyan-300'
              }`}
              title={
                unit.silenced
                  ? `Equipado: ${getCardById(unit.equippedCardId)?.name} (bônus e palavras-chave desligados enquanto Selado)`
                  : `Equipado: ${getCardById(unit.equippedCardId)?.name}`
              }
            >
              <Wrench className="w-2.5 h-2.5" />
            </span>
          )}
          {card.kind === 'ninja' && unit && (
            <span
              className={`px-1 py-0.5 rounded border text-[9px] font-bold flex items-center gap-0.5 ${
                evolutionLevel === 3
                  ? 'bg-orange-500/25 border-orange-400 text-orange-200'
                  : evolutionLevel === 2
                    ? 'bg-amber-500/20 border-amber-400/80 text-amber-200'
                    : 'bg-slate-900/90 border-slate-600/80 text-slate-300'
              }`}
              title={
                evolutionLevel === 3
                  ? 'Nível 3 · Jounnin'
                  : evolutionLevel === 2
                    ? 'Nível 2 · Chuunin'
                    : 'Nível 1 · Gennin'
              }
            >
              {evolutionLevel >= 2 && <Sparkles className="w-2.5 h-2.5" />}
              {evolutionLevel === 3 ? 'Jounnin' : evolutionLevel === 2 ? 'Chuunin' : 'Gennin'}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Overlay Content */}
      <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col ${size === 'board' ? 'p-1.5 gap-0.5' : 'p-2 gap-1'}`}>
        {card.kind === 'jutsu' && (
          <>
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${SPEED_META[card.speed].color}`}>
              {SPEED_META[card.speed].icon}
              <span>{SPEED_META[card.speed].label} · {card.category}</span>
            </div>
            <div className={nameClass}>{card.name}</div>
            {(size === 'collection' || size === 'inspector') && (
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-3 mt-0.5">
                {card.effectText}
              </p>
            )}
            {size === 'hand' && (
              <p className="text-[9.5px] text-slate-100 leading-snug line-clamp-2 bg-slate-950/80 rounded px-1 py-0.5">
                {card.effectText}
              </p>
            )}
          </>
        )}

        {card.kind === 'armadilha' && (
          <>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-300">
              <EyeOff className="w-3 h-3" />
              <span>Armadilha Oculta</span>
            </div>
            <div className={nameClass}>{card.name}</div>
            {(size === 'collection' || size === 'inspector') && (
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-3 mt-0.5">
                {card.effectText}
              </p>
            )}
            {size === 'hand' && (
              <p className="text-[9.5px] text-slate-100 leading-snug line-clamp-2 bg-slate-950/80 rounded px-1 py-0.5">
                {card.effectText}
              </p>
            )}
          </>
        )}

        {card.kind === 'equipamento' && (
          <>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
              <Wrench className="w-3 h-3" />
              <span>Equipamento · +{card.bonusAttack}/+{card.bonusHealth}</span>
            </div>
            <div className={nameClass}>{card.name}</div>
            {(size === 'collection' || size === 'inspector') && (
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-3 mt-0.5">
                {card.effectText}
              </p>
            )}
            {size === 'hand' && (
              <p className="text-[9.5px] text-slate-100 leading-snug line-clamp-2 bg-slate-950/80 rounded px-1 py-0.5">
                {card.effectText}
              </p>
            )}
          </>
        )}

        {isCharacter && (
          <>
            {size !== 'board' && (
              <div className="text-[10px] text-slate-300/90 leading-none truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                {card.faction} · {card.kind === 'ninja' ? 'Ninja' : card.kind === 'token' ? 'Token' : 'Unidade'}
              </div>
            )}
            <div className={nameClass}>
              {card.name}
            </div>

            {size === 'collection' && (
              <>
                <div className="text-[11px] text-amber-300/90 font-medium truncate">
                  {keywords.length > 0 ? formatKeywords(keywords) : 'Shinobi Versátil'}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {card.abilityText}
                </p>
                {card.kind === 'ninja' ? (
                  <div className="text-[10px] text-sky-300/90 truncate border-t border-slate-700/70 pt-1">
                    Gennin → Chuunin → Jounnin
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 truncate border-t border-slate-700/70 pt-1">
                    {card.role} · Sem Promoção
                  </div>
                )}
              </>
            )}

            {/* Evolution progress bar on board (Levels 1->2 and 2->3) */}
            {unit && card.kind === 'ninja' && evolutionLevel < (card.maxRank ?? 3) && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-200 ${
                    evolutionLevel === 2 ? 'bg-orange-400' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (unit.evolutionProgress / unit.evolutionTarget) * 100)}%`,
                  }}
                />
              </div>
            )}

            {/* Attack & Health Stats */}
            <div className="flex items-center justify-between pt-0.5">
              <div
                title="Poder"
                className={`stat-gem flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border font-mono-num text-[13px] leading-none font-bold ${
                  unit?.frozen
                    ? 'bg-sky-950/90 border-sky-400 text-sky-200'
                    : 'bg-red-950/90 border-red-500/60 text-red-200'
                }`}
              >
                <Swords className="w-3 h-3 text-red-400" />
                <span>{displayAttack}</span>
              </div>

              {size !== 'collection' && size !== 'board' && size !== 'hand' && (keywords.length > 0 || unit?.silenced) && (
                <span className="text-[9px] text-amber-200/90 font-medium truncate max-w-[54px]">
                  {unit?.silenced ? 'Selado' : getKeywordLabel(keywords[0])}
                </span>
              )}

              {size === 'hand' && (
                <VillageSymbol
                  village={villageOfFaction(card.faction)}
                  tone="white"
                  className="w-3.5 h-3.5 opacity-60"
                />
              )}

              <div
                title="Vida"
                className={`stat-gem flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border font-mono-num text-[13px] leading-none font-bold ${
                  unit && unit.health < unit.maxHealth
                    ? 'bg-amber-950/90 border-amber-500/70 text-amber-200'
                    : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                }`}
              >
                <Heart className="w-3 h-3 text-emerald-400" />
                <span>{displayHealth}</span>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};
