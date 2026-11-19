import CardBack from '../../components/CardBack';
import { ZONES } from './grid';

/** Mão do rival: leque de versos 760×108 @ (420,0). Sem banner de turno. */
export function RivalHand({ count }: { count: number }) {
  const z = ZONES.rivalHand;
  const n = Math.max(0, Math.min(9, count));
  const cardW = 87;
  const cardH = 100;
  const step = n <= 1 ? 0 : Math.min(cardW - 18, (z.w - cardW - 24) / (n - 1));

  return (
    <div
      className="absolute overflow-visible"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 15 }}
      data-hand="rival"
      aria-label={`Mão do rival: ${n}`}
    >
      <div className="relative mx-auto h-full" style={{ width: Math.max(cardW, n * step + cardW) }}>
        {Array.from({ length: n }).map((_, i) => {
          const rot = (i - (n - 1) / 2) * 4;
          return (
            <div
              key={i}
              className="absolute bottom-0 origin-bottom"
              style={{
                left: i * step,
                width: cardW,
                height: cardH,
                transform: `rotate(${rot}deg) translateY(8px)`,
              }}
            >
              <CardBack className="h-full w-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
