import type { CSSProperties } from 'react';
import { STAT_COLORS, statTone } from './combatPreview';
import { SLOT_H, SLOT_W } from './grid';
import type { ArenaCardRef, FieldCardPreview } from './types';
import CardBack from '../../components/CardBack';

/**
 * Única porta de renderização de carta de campo na Arena B4.
 * Part 2 pode trocar o miolo; Part 3 só depende o footprint 95×132 + plaquinhas de prévia.
 */
export interface FieldCardProps {
  card: ArenaCardRef;
  /** Sobrescreve preview embutido. */
  preview?: FieldCardPreview;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

function Plaque({
  value,
  base,
  icon,
}: {
  value: number;
  base: number;
  icon: 'power' | 'vitality';
}) {
  const tone = statTone(value, base);
  const colors = STAT_COLORS[tone];
  return (
    <div
      className="flex items-center gap-0.5 rounded-md px-1 py-[2px] font-display leading-none"
      style={{
        background: 'rgba(8,10,18,0.92)',
        border: `2px solid ${colors.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.55)',
        color: colors.text,
        fontSize: 15,
        minWidth: 28,
        justifyContent: 'center',
      }}
    >
      <span aria-hidden style={{ fontSize: 10, opacity: 0.9 }}>
        {icon === 'power' ? '✴' : '♥'}
      </span>
      <span>{value}</span>
    </div>
  );
}

export function FieldCard({ card, preview, onClick, style, className = '' }: FieldCardProps) {
  const pv = preview ?? card.preview;
  const dying = Boolean(pv?.dying || (pv && pv.vitality <= 0));

  if (card.faceDown) {
    return (
      <div
        className={`relative overflow-hidden rounded-md ${className}`}
        style={{ width: SLOT_W, height: SLOT_H, ...style }}
        data-field-card={card.uid}
        data-uid={card.uid}
        data-face-down
      >
        <CardBack className="h-full w-full" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-field-card={card.uid}
      data-uid={card.uid}
      data-card-id={card.cardId}
      className={`relative block overflow-visible rounded-md border-0 p-0 text-left ${
        dying ? 'arena-b4-dying' : ''
      } ${card.selected ? 'ring-2 ring-amber-300' : ''} ${card.dimmed ? 'opacity-55' : ''} ${className}`}
      style={{
        width: SLOT_W,
        height: SLOT_H,
        filter: dying ? 'grayscale(1) brightness(0.5)' : undefined,
        ...style,
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-md border-2 border-black"
        style={{
          boxShadow: '0 0 0 1px #fff, 0 4px 10px rgba(0,0,0,0.55)',
          background:
            card.owner === 'enemy'
              ? 'linear-gradient(180deg,#3f1218,#1a0a0e)'
              : 'linear-gradient(180deg,#12304a,#0a1524)',
        }}
      >
        {card.artUrl ? (
          <img src={card.artUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#152038]">
            <span className="px-1 text-center font-display text-[11px] leading-tight text-white/90">
              {card.name}
            </span>
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/90 via-black/55 to-transparent"
          aria-hidden
        />
        {typeof card.cost === 'number' && (
          <div
            className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-sky-200/80 bg-sky-600 font-display text-[11px] text-white"
            style={{ boxShadow: '0 0 0 1px #0b1030' }}
          >
            {card.cost}
          </div>
        )}
        <div className="absolute inset-x-1 bottom-7 truncate text-center font-display text-[10px] text-white drop-shadow">
          {card.name}
        </div>
      </div>

      {pv && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-between gap-1 px-0.5"
          style={{ bottom: -10, zIndex: 3 }}
        >
          <Plaque value={pv.power} base={pv.basePower} icon="power" />
          <Plaque value={pv.vitality} base={pv.baseVitality} icon="vitality" />
        </div>
      )}

      {dying && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-label="Unidade morre na prévia"
        >
          <span className="text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]" aria-hidden>
            ☠
          </span>
        </div>
      )}

      {pv?.keywordChips && pv.keywordChips.length > 0 && (
        <div
          className="pointer-events-none absolute left-1/2 z-10 flex max-w-[130px] -translate-x-1/2 flex-col items-center gap-0.5"
          style={{ top: SLOT_H + 12 }}
        >
          {pv.keywordChips.slice(0, 2).map((chip) => (
            <span
              key={chip}
              className="whitespace-nowrap rounded-sm bg-black/85 px-1 py-px font-display text-[8px] tracking-wide text-amber-200"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
