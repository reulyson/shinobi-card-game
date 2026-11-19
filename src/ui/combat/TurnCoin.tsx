import { LINE_Y, ZONES } from './grid';

/**
 * Slot de montagem Part 4 — moeda de turno + anel de chakra (coluna direita).
 * Part 3 só posiciona o footprint e um placeholder clicável.
 */
export interface TurnCoinProps {
  myTurn: boolean;
  label: string;
  rivalChakra?: { current: number; max: number };
  myChakra?: { current: number; max: number };
  onAction?: () => void;
  disabled?: boolean;
}

export function TurnCoin({
  myTurn,
  label,
  rivalChakra,
  myChakra,
  onAction,
  disabled,
}: TurnCoinProps) {
  const z = ZONES.hudRight;
  const coinSize = 108;
  const coinTop = LINE_Y - coinSize / 2;

  return (
    <div
      data-mount="TurnCoin"
      data-part4-slot="turn-coin"
      className="absolute"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 22 }}
      aria-label="Moeda de turno (placeholder Part 4)"
    >
      {rivalChakra && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded border border-red-400/50 bg-black/70 px-2 py-1 text-center font-mono-num text-[11px] text-red-200"
          style={{ top: 8 }}
        >
          {rivalChakra.current}/{rivalChakra.max}
        </div>
      )}

      {/* Anel de chakra — footprint Part 4 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-dashed border-white/25"
        style={{
          top: coinTop - 18,
          width: coinSize + 36,
          height: coinSize + 36,
        }}
        data-part4-slot="chakra-ring"
        aria-hidden
      />

      <button
        type="button"
        disabled={disabled || !onAction}
        onClick={onAction}
        className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-4 border-black font-brush text-4xl text-white disabled:cursor-default"
        style={{
          top: coinTop,
          width: coinSize,
          height: coinSize,
          background: myTurn
            ? 'radial-gradient(circle at 35% 28%, #FFE55A, #F97316 55%, #C2410C)'
            : 'radial-gradient(circle at 35% 28%, #D1D5DB, #6B7280 55%, #374151)',
          boxShadow: myTurn
            ? '0 0 0 3px #fff, 0 0 0 6px #0b1030, 0 0 24px rgba(249,115,22,0.55)'
            : '0 0 0 3px #fff, 0 0 0 6px #0b1030',
        }}
        aria-label={label}
      >
        <span style={{ transform: 'translate(-0.08em, -0.10em)' }}>{myTurn ? '忍' : '◎'}</span>
      </button>

      <button
        type="button"
        disabled={disabled || !onAction}
        onClick={onAction}
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border-2 border-black px-3 py-1 font-display text-[13px] tracking-wide text-white disabled:opacity-70"
        style={{
          top: coinTop + coinSize + 14,
          background: myTurn
            ? 'linear-gradient(180deg,#FFE55A,#F97316)'
            : 'linear-gradient(180deg,#444,#111)',
          boxShadow: '0 0 0 2px #fff',
          transform: 'skewX(-10deg)',
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>{label}</span>
      </button>

      {myChakra && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded border border-sky-400/50 bg-black/70 px-2 py-1 text-center font-mono-num text-[11px] text-sky-200"
          style={{ bottom: 8 }}
        >
          {myChakra.current}/{myChakra.max}
        </div>
      )}
    </div>
  );
}
