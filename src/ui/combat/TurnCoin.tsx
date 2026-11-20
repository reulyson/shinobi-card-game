import type { CSSProperties } from 'react';
import { LINE_Y } from './grid';
import { TabLabel } from './TabLabel';

/**
 * Moeda de turno + anel de chakra (gen_b4prev.chakra_ring, modo B).
 * Centro em (1525, LINE_Y); Part 4 anima poof/timer — Part 3 só o footprint visual.
 */
export interface TurnCoinProps {
  myTurn: boolean;
  label: string;
  rivalChakra?: { current: number; max: number; reserve?: number };
  myChakra?: { current: number; max: number; reserve?: number };
  onAction?: () => void;
  disabled?: boolean;
}

const CX = 1525;
const CR = 52;
const R = 68;
const R2 = 88;
const INK = '#111';

function Dot({
  x,
  y,
  state,
  col,
}: {
  x: number;
  y: number;
  state: 'full' | 'empty' | 'sealed';
  col: [string, string];
}) {
  const [c1, c2] = col;
  let st: CSSProperties;
  if (state === 'full') {
    st = {
      background: `radial-gradient(circle at 35% 30%,#fff,${c1} 40%,${c2})`,
      border: '2px solid #fff',
      boxShadow: `0 0 8px ${c1},0 0 0 1.5px ${INK}`,
    };
  } else if (state === 'empty') {
    st = {
      background: '#0B1230',
      border: `2.5px solid ${c1}99`,
      boxShadow: `inset 0 0 4px #000,0 0 0 1.5px ${INK}`,
    };
  } else {
    st = {
      background: '#2A2F3A',
      border: '2px solid #4B5563',
      opacity: 0.7,
      boxShadow: '0 0 0 1.5px #000',
      backgroundImage:
        'linear-gradient(45deg,transparent 42%,#6B7280 42% 58%,transparent 58%),linear-gradient(-45deg,transparent 42%,#6B7280 42% 58%,transparent 58%)',
    };
  }
  return (
    <div
      className="absolute box-border rounded-full"
      style={{ left: x - 7, top: y - 7, width: 14, height: 14, ...st }}
    />
  );
}

function Dia({ on, x, y, sz = 11 }: { on: boolean; x: number; y: number; sz?: number }) {
  return (
    <div
      className="absolute box-border"
      style={{
        left: x - sz / 2,
        top: y - sz / 2,
        width: sz,
        height: sz,
        transform: 'rotate(45deg)',
        border: `1.5px solid ${on ? INK : '#D6E6A0'}`,
        background: on ? 'linear-gradient(135deg,#B6E04A,#F59E0B)' : '#2E3D18',
        boxShadow: on ? '0 0 6px #C7D93B' : 'none',
      }}
    />
  );
}

export function TurnCoin({
  myTurn,
  label,
  rivalChakra,
  myChakra,
  onAction,
  disabled,
}: TurnCoinProps) {
  const cy = LINE_Y;
  const rv = rivalChakra ?? { current: 6, max: 8, reserve: 1 };
  const me = myChakra ?? { current: 7, max: 9, reserve: 2 };
  const rvFilled = Math.min(10, rv.current);
  const rvUnlocked = Math.min(10, rv.max);
  const meFilled = Math.min(10, me.current);
  const meUnlocked = Math.min(10, me.max);
  const rvRes = Math.min(3, rv.reserve ?? 0);
  const meRes = Math.min(3, me.reserve ?? 0);
  const c = myTurn
    ? (['#FFE55A', '#F97316', '#C2410C'] as const)
    : (['#D1D5DB', '#6B7280', '#374151'] as const);
  const d = (13 * Math.PI) / 180;

  const dots: Array<{ x: number; y: number; state: 'full' | 'empty' | 'sealed'; col: [string, string] }> =
    [];
  for (const [who, col, fl, un] of [
    ['rv', ['#FF5A5A', '#B91C1C'] as [string, string], rvFilled, rvUnlocked],
    ['me', ['#4FB3FF', '#1D4ED8'] as [string, string], meFilled, meUnlocked],
  ] as const) {
    for (let i = 0; i < 10; i++) {
      const th = Math.PI - d - (i * (Math.PI - 2 * d)) / 9;
      const x = CX + R * Math.cos(th);
      const y = who === 'rv' ? cy - R * Math.sin(th) : cy + R * Math.sin(th);
      const state = i < fl ? 'full' : i < un ? 'empty' : 'sealed';
      dots.push({ x, y, state, col });
    }
  }

  const dias: Array<{ on: boolean; x: number; y: number }> = [];
  for (let k = 0; k < 3; k++) {
    const th = ((90 - (k - 1) * 15) * Math.PI) / 180;
    dias.push({ on: k < rvRes, x: CX + R2 * Math.cos(th), y: cy - R2 * Math.sin(th) });
    dias.push({ on: k < meRes, x: CX + R2 * Math.cos(th), y: cy + R2 * Math.sin(th) });
  }

  return (
    <div
      data-mount="TurnCoin"
      data-part4-slot="turn-coin"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 22 }}
      aria-label="Moeda de turno (placeholder Part 4)"
    >
      <div data-part4-slot="chakra-ring" className="absolute inset-0" aria-hidden>
        {dots.map((dot, i) => (
          <Dot key={i} {...dot} />
        ))}
        {dias.map((dia, i) => (
          <Dia key={`d-${i}`} {...dia} />
        ))}
      </div>

      <TabLabel tone="r" size={12} style={{ position: 'absolute', left: CX - 72, top: cy - 152 }}>
        {rv.current}/{rv.max}
      </TabLabel>
      <TabLabel tone="b" size={12} style={{ position: 'absolute', left: CX - 72, top: cy + 110 }}>
        {me.current}/{me.max}
      </TabLabel>

      <button
        type="button"
        disabled={disabled || !onAction}
        onClick={onAction}
        className="pointer-events-auto absolute flex items-center justify-center rounded-full border-4 border-black disabled:cursor-default"
        style={{
          left: CX - CR,
          top: cy - CR,
          width: CR * 2,
          height: CR * 2,
          background: `radial-gradient(circle at 35% 28%,${c[0]},${c[1]} 55%,${c[2]})`,
          boxShadow: myTurn
            ? '0 0 0 3px #fff, 0 0 0 6px #111, 0 6px 14px #000b, 0 0 24px #F97316aa'
            : '0 0 0 3px #fff, 0 0 0 6px #111, 0 6px 14px #000b',
        }}
        aria-label={label}
      >
        {myTurn && (
          <svg
            className="pointer-events-none absolute opacity-45"
            width={CR * 2 - 12}
            height={CR * 2 - 12}
            viewBox="0 0 100 100"
            style={{ left: 6, top: 6 }}
            aria-hidden
          >
            <path
              d="M50 50 m0 -40 a40 40 0 1 1 -0.1 0"
              fill="none"
              stroke="#fff"
              strokeWidth={7}
              strokeLinecap="round"
            />
            <path
              d="M50 50 Q 72 28 80 50 Q 72 78 50 70 Q 28 62 32 48 Q 38 32 50 36"
              fill="none"
              stroke="#fff"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </svg>
        )}
        <span
          className="relative font-brush text-white"
          style={{
            fontFamily: "'Yuji Boku','Noto Serif CJK JP',serif",
            fontSize: 50,
            fontWeight: 900,
            transform: 'translate(-4px, -5px)',
            textShadow: '3px 3px 0 #0B1030',
          }}
        >
          {myTurn ? '忍' : '◎'}
        </span>
      </button>

      <div
        className="pointer-events-auto absolute"
        style={{ left: CX - 82, top: cy + 142, whiteSpace: 'nowrap' }}
      >
        <button type="button" disabled={disabled || !onAction} onClick={onAction}>
          <TabLabel tone={myTurn ? 'o' : 'k'} size={13}>
            {label}
          </TabLabel>
        </button>
      </div>
    </div>
  );
}
