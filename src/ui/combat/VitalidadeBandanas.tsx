import type { CSSProperties } from 'react';
import { formatVitality } from './combatPreview';
import { LINE_Y, ZONES } from './grid';

export interface VitalidadeBandanasProps {
  rival: { current: number; predicted?: number };
  mine: { current: number; predicted?: number };
  round: number;
}

/**
 * Hitai-ate ampliadas (×1.28): faixa de pano com dobras + placa metálica rebitada + caudas.
 * Vermelho = rival (cima); azul = eu (baixo). Sem símbolo de vila. TURNO N em y=416.
 */
export function VitalidadeBandanas({ rival, mine, round }: VitalidadeBandanasProps) {
  const z = ZONES.hudLeft;
  const rivalFmt = formatVitality(rival.current, rival.predicted);
  const myFmt = formatVitality(mine.current, mine.predicted);

  return (
    <div
      className="absolute"
      style={{ left: 6, top: z.y, width: z.w + 8, height: z.h, zIndex: 18 }}
      data-hud="vitalidade"
    >
      <HitaiAte
        variant="rival"
        value={rivalFmt}
        style={{
          position: 'absolute',
          left: 4,
          top: LINE_Y - z.y - 108,
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
      <HitaiAte
        variant="player"
        value={myFmt}
        style={{
          position: 'absolute',
          left: 4,
          top: LINE_Y - z.y + 22,
        }}
      />
    </div>
  );
}

function HitaiAte({
  variant,
  value,
  style,
}: {
  variant: 'rival' | 'player';
  value: { text: string; predictedLower: boolean };
  style?: CSSProperties;
}) {
  const rival = variant === 'rival';
  const c1 = rival ? '#A81818' : '#1B3A94';
  const c2 = rival ? '#DC2626' : '#2F5FD0';
  const c3 = rival ? '#5E0F0F' : '#0E224F';
  const parts = value.text.split('/');
  const current = parts[0] ?? value.text;
  const predicted = parts.length > 1 ? parts[1] : undefined;

  const fold =
    'repeating-linear-gradient(98deg,transparent 0 13px,#00000030 13px 16px,#ffffff1c 16px 19px)';

  return (
    <div
      style={{
        ...style,
        width: 128,
        height: 62,
        transform: 'scale(1.28)',
        transformOrigin: 'left center',
      }}
      className="relative"
      aria-label={`Vitalidade ${value.text}`}
      data-hitai-ate={variant}
    >
      {/* caudas de nó */}
      <div
        className="absolute"
        style={{
          left: 100,
          top: 34,
          width: 20,
          height: 44,
          background: `linear-gradient(100deg,${c1},${c2})`,
          clipPath: 'polygon(0 0,100% 0,80% 100%,28% 86%)',
          transform: 'rotate(-8deg)',
          borderRadius: '0 0 4px 4px',
          filter: 'drop-shadow(0 3px 2px #0009)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: 110,
          top: 34,
          width: 20,
          height: 34,
          background: `linear-gradient(100deg,${c2},${c1})`,
          clipPath: 'polygon(0 0,100% 0,100% 70%,40% 100%)',
          transform: 'rotate(10deg)',
          filter: 'drop-shadow(0 3px 2px #0009)',
        }}
      />

      {/* faixa de pano com dobras */}
      <div
        className="absolute"
        style={{
          left: -6,
          width: 148,
          top: 12,
          height: 40,
          background: `${fold},linear-gradient(180deg,${c2},${c1} 35%,${c1} 70%,${c3})`,
          borderTop: `2px solid ${c3}`,
          borderBottom: `2px solid ${c3}`,
          boxShadow: '0 4px 8px #000a, inset 0 6px 8px #ffffff25, inset 0 -8px 8px #0006',
        }}
      />
      <div
        className="absolute box-border"
        style={{
          left: -6,
          width: 148,
          top: 16,
          height: 32,
          borderTop: '1.5px dashed #ffffff44',
          borderBottom: '1.5px dashed #ffffff44',
        }}
      />

      {/* placa metálica */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: 10,
          top: 7,
          width: 108,
          height: 48,
          borderRadius: 7,
          background: 'linear-gradient(165deg,#F6F7F9,#B7BEC8 40%,#7C8591 85%,#5E6672)',
          border: '2px solid #2B323C',
          boxShadow: '0 4px 8px #000b, inset 0 0 0 2px #FFFFFF70, inset 0 -5px 8px #0004',
        }}
      >
        {([13, 102] as const).flatMap((l) =>
          ([9, 19, 29, 39] as const).map((tp) => (
            <span
              key={`${l}-${tp}`}
              className="absolute rounded-full"
              style={{
                left: l - 10,
                top: tp - 7,
                width: 5,
                height: 5,
                background: 'radial-gradient(circle at 35% 30%,#fff,#9CA3AF 55%,#4B5563)',
                boxShadow: '0 1px 1px #000a',
              }}
            />
          ))
        )}
        <span
          className="font-bandana leading-none"
          style={{
            fontSize: 36,
            color: '#111',
            textShadow: '0 1px 0 #fff, 0 0 3px #fff9',
          }}
        >
          {current}
          {predicted !== undefined ? (
            <span>
              <span style={{ color: '#333' }}>{'/'}</span>
              <span
                style={{
                  color: value.predictedLower ? '#DC2626' : '#111',
                  WebkitTextStroke: value.predictedLower ? '0.6px #7F1D1D' : undefined,
                }}
              >
                {predicted}
              </span>
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
