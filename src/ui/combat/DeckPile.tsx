import { UzumakiCardBack } from './UzumakiCardBack';
import { ZONES } from './grid';

export interface DeckPileProps {
  side: 'player' | 'enemy';
  remaining: number;
  total: number;
}

/** Deck 200×168 — mockup deckbox: pile + contador n/n DECK à direita. */
export function DeckPile({ side, remaining, total }: DeckPileProps) {
  const z = side === 'player' ? ZONES.myDeck : ZONES.rivalDeck;
  const mine = side === 'player';
  const col = mine ? '#FFD23F' : '#FCA5A5';

  return (
    <div
      className="absolute"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 16 }}
      data-deck={side}
      aria-label={`Deck ${mine ? 'seu' : 'rival'}: ${remaining}/${total}`}
    >
      <div className="absolute" style={{ left: 14, top: Math.floor((z.h - 137) / 2) + 4 }}>
        <div className="relative" style={{ width: 100, height: 137 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: i * 2, top: -i * 2, width: 94, height: 131 }}
            >
              <UzumakiCardBack className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute text-center"
        style={{ left: 104, top: 50, width: 72 }}
      >
        <div
          className="font-display leading-none"
          style={{
            fontSize: 30,
            letterSpacing: '0.04em',
            color: col,
            textShadow: '0 2px 0 #000, 0 0 6px #000',
          }}
        >
          {remaining}
          <span style={{ fontSize: 18, color: '#fff', opacity: 0.85 }}>/{total}</span>
        </div>
        <div
          className="mt-1 text-[10px] font-extrabold tracking-[0.12em] text-white/80"
          style={{ textShadow: '0 1px 2px #000' }}
        >
          DECK
        </div>
      </div>
    </div>
  );
}
