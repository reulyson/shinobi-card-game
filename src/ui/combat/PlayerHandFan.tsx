import { MAX_HAND, ZONES } from './grid';
import { FieldCard } from './FieldCard';
import { TabLabel } from './TabLabel';

export interface HandCardModel {
  cardId: string;
  name: string;
  artUrl?: string;
  cost?: number;
  playable?: boolean;
}

/** Sua mão — gen_combate.fan(hand, 800, 726, 0.56, spread/drop/gap). */
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
  const zoom = 0.56;
  const cardW = 312 * zoom;
  const cardH = 438 * zoom;
  const [spread, drop, gap] = n <= 6 ? [7, 6, 92] : [5, 4, 84];
  const cx = 800;
  const base = 726;

  return (
    <div
      className="absolute overflow-visible"
      style={{ left: 0, top: 0, width: 1600, height: 900, zIndex: 24 }}
      data-hand="player"
      aria-label={`Mão ${n}/${MAX_HAND}`}
    >
      <div className="absolute" style={{ left: 1236, top: 724 }}>
        <TabLabel tone="o" size={13}>
          MÃO {n}/{MAX_HAND}
        </TabLabel>
      </div>
      {list.map((c, i) => {
        const o = i - (n - 1) / 2;
        const left = cx + o * gap - cardW / 2;
        const top = base + Math.abs(o) ** 2 * drop;
        const rot = o * spread;
        return (
          <div
            key={`${c.cardId}-${i}`}
            className="absolute origin-bottom transition-transform hover:-translate-y-3"
            style={{
              left,
              top,
              width: cardW,
              height: cardH,
              transform: `rotate(${rot}deg)`,
              transformOrigin: '50% 130%',
              filter: 'drop-shadow(0 6px 10px #000b)',
              zIndex: i,
            }}
          >
            <FieldCard
                  variant="compact"
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
        );
      })}
      {/* footprint da zona (debug/layout) */}
      <div
        className="pointer-events-none absolute"
        style={{ left: z.x, top: z.y, width: z.w, height: z.h }}
        aria-hidden
      />
    </div>
  );
}
