import type { CSSProperties } from 'react';
import { formatVitality } from './combatPreview';
import { LINE_Y, ZONES } from './grid';

export interface VitalidadeBandanasProps {
  rival: { current: number; predicted?: number };
  mine: { current: number; predicted?: number };
  round: number;
}

/**
 * Bandanas (hitai-ate) ampliadas — placa metálica rebitada, pano vermelho (rival) / azul (eu).
 * Sem símbolo de vila; vitalidade como atual/previsto; TURNO N entre elas, centrado em y=416.
 */
export function VitalidadeBandanas({ rival, mine, round }: VitalidadeBandanasProps) {
  const z = ZONES.hudLeft;
  const rivalFmt = formatVitality(rival.current, rival.predicted);
  const myFmt = formatVitality(mine.current, mine.predicted);

  return (
    <div
      className="absolute"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 18 }}
      data-hud="vitalidade"
    >
      <Bandana
        cloth="#B91C1C"
        value={rivalFmt}
        style={{
          position: 'absolute',
          left: 8,
          top: LINE_Y - z.y - 118,
          transform: 'scale(1.28)',
          transformOrigin: 'left center',
        }}
      />
      <div
        className="absolute left-1/2 border-2 border-white bg-black px-3 py-1 font-display text-sm tracking-wider text-white"
        style={{
          top: LINE_Y - z.y,
          boxShadow: '0 0 0 2px #0b1030',
          transform: 'translate(-50%, -50%) skewX(-12deg)',
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>TURNO {round}</span>
      </div>
      <Bandana
        cloth="#1D4ED8"
        value={myFmt}
        style={{
          position: 'absolute',
          left: 8,
          top: LINE_Y - z.y + 28,
          transform: 'scale(1.28)',
          transformOrigin: 'left center',
        }}
      />
    </div>
  );
}

function Bandana({
  cloth,
  value,
  style,
}: {
  cloth: string;
  value: { text: string; predictedLower: boolean };
  style?: CSSProperties;
}) {
  const parts = value.text.split('/');
  const current = parts[0] ?? value.text;
  const predicted = parts.length > 1 ? parts[1] : undefined;

  return (
    <div style={style} className="relative" aria-label={`Vitalidade ${value.text}`}>
      <div
        className="absolute"
        style={{
          left: -6,
          top: 18,
          width: 78,
          height: 28,
          background: `linear-gradient(90deg, ${cloth}, ${cloth}cc)`,
          borderRadius: '2px 14px 14px 2px',
          boxShadow: '2px 3px 6px rgba(0,0,0,0.45)',
          transform: 'rotate(-8deg)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: 48,
          top: 22,
          width: 70,
          height: 22,
          background: `linear-gradient(90deg, ${cloth}dd, ${cloth}88)`,
          borderRadius: '2px 16px 16px 2px',
          transform: 'rotate(14deg)',
        }}
      />
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 118,
          height: 64,
          marginLeft: 4,
          background: 'linear-gradient(160deg,#d7dbe3 0%,#9aa3b2 45%,#6b7280 100%)',
          border: '3px solid #1a1a1a',
          borderRadius: 6,
          boxShadow: '0 0 0 2px #e5e7eb, 0 6px 12px rgba(0,0,0,0.5)',
        }}
      >
        {(
          [
            [8, 8],
            [102, 8],
            [8, 48],
            [102, 48],
          ] as const
        ).map(([x, y]) => (
          <span
            key={`${x}-${y}`}
            className="absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: 7,
              height: 7,
              background: 'radial-gradient(circle at 30% 30%,#f3f4f6,#4b5563)',
              border: '1px solid #111',
            }}
          />
        ))}
        <span className="font-bandana text-[28px] leading-none" style={{ color: '#111', textShadow: '0 1px 0 #fff8' }}>
          {current}
          {predicted !== undefined ? (
            <span>
              <span style={{ color: '#333' }}>{'/'}</span>
              <span style={{ color: value.predictedLower ? '#DC2626' : '#111' }}>{predicted}</span>
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
