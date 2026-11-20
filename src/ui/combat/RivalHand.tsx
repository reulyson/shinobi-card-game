import { UzumakiCardBack } from './UzumakiCardBack';
import { ZONES } from './grid';

/** Mão do rival — gen_combate.rfan(n, 800, -32, 0.28, 4, 54). */
export function RivalHand({ count }: { count: number }) {
  const z = ZONES.rivalHand;
  const n = Math.max(0, Math.min(9, count));
  const zoom = 0.28;
  const cardW = 312 * zoom;
  const cardH = 438 * zoom;
  const gap = 54;
  const spread = 4;
  const cx = 800;

  return (
    <div
      className="absolute overflow-visible"
      style={{ left: 0, top: 0, width: 1600, height: z.h + 40, zIndex: 15 }}
      data-hand="rival"
      aria-label={`Mão do rival: ${n}`}
    >
      {Array.from({ length: n }).map((_, i) => {
        const o = i - (n - 1) / 2;
        const left = cx + o * gap - cardW / 2;
        const top = -32 + Math.abs(o) ** 2 * 3;
        const rot = -o * spread;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left,
              top,
              width: cardW,
              height: cardH,
              transform: `rotate(${rot}deg)`,
              transformOrigin: '50% 130%',
              filter: 'drop-shadow(0 6px 10px #000b)',
            }}
          >
            <UzumakiCardBack className="h-full w-full" />
          </div>
        );
      })}
    </div>
  );
}
