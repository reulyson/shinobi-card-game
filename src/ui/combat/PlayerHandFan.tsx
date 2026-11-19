import { MAX_HAND, ZONES } from './grid';
import { FieldCard } from './FieldCard';

export interface HandCardModel {
  cardId: string;
  name: string;
  artUrl?: string;
  cost?: number;
  playable?: boolean;
}

/** Sua mão: até 9 cartas em leque, zona 940×176 @ (330,724). */
export function PlayerHandFan({
  cards,
  onCardClick,
}: {
  cards: HandCardModel[];
  onCardClick?: (cardId: string, index: number) => void;
}) {
  const z = ZONES.hand;
  const list = cards.slice(0, MAX_HAND);
  const n = list.length;
  const cardW = 100;
  const cardH = 140;
  const step = n <= 1 ? 0 : Math.min(cardW + 4, (z.w - cardW - 40) / Math.max(1, n - 1));

  return (
    <div
      className="absolute overflow-visible"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 24 }}
      data-hand="player"
      aria-label={`Mão ${n}/${MAX_HAND}`}
    >
      <div
        className="absolute right-2 top-1 rounded bg-black/70 px-2 py-0.5 font-display text-[11px] tracking-wide text-amber-200"
        style={{ border: '1px solid rgba(255,255,255,0.25)' }}
      >
        MÃO {n}/{MAX_HAND}
      </div>
      <div
        className="relative mx-auto"
        style={{
          width: Math.max(cardW, n * step + cardW),
          height: z.h,
        }}
      >
        {list.map((c, i) => {
          const rot = (i - (n - 1) / 2) * 3.2;
          return (
            <div
              key={`${c.cardId}-${i}`}
              className="absolute bottom-2 origin-bottom transition-transform hover:-translate-y-3"
              style={{
                left: i * step,
                width: cardW,
                height: cardH,
                transform: `rotate(${rot}deg)`,
                zIndex: i,
              }}
            >
              {/* Placeholder da mão: FieldCard reescalado (Part 2 troca o componente interno). */}
              <div style={{ transform: 'scale(1.05)', transformOrigin: 'bottom center' }}>
                <FieldCard
                  card={{
                    uid: `hand-${i}`,
                    cardId: c.cardId,
                    name: c.name,
                    owner: 'player',
                    artUrl: c.artUrl,
                    cost: c.cost,
                    preview: undefined,
                  }}
                  onClick={() => onCardClick?.(c.cardId, i)}
                  className={!c.playable && c.playable !== undefined ? 'opacity-70' : ''}
                  style={{ width: cardW, height: cardH }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
