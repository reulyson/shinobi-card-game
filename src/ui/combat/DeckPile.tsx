import CardBack from '../../components/CardBack';
import { ZONES } from './grid';

export interface DeckPileProps {
  side: 'player' | 'enemy';
  remaining: number;
  total: number;
}

export function DeckPile({ side, remaining, total }: DeckPileProps) {
  const z = side === 'player' ? ZONES.myDeck : ZONES.rivalDeck;
  return (
    <div
      className="absolute flex flex-col items-center justify-center gap-1"
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 16 }}
      data-deck={side}
      aria-label={`Deck ${side === 'player' ? 'seu' : 'rival'}: ${remaining}/${total}`}
    >
      <div className="relative" style={{ width: 92, height: 128 }}>
        <div
          className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-md bg-black/50"
          aria-hidden
        />
        <div
          className="absolute inset-0 translate-x-[1.5px] translate-y-[1.5px] rounded-md bg-black/40"
          aria-hidden
        />
        <CardBack className="relative h-full w-full" />
      </div>
      <div className="rounded border border-white/30 bg-black/75 px-2 py-0.5 text-center">
        <div className="font-mono-num text-sm font-bold text-white">
          {remaining}/{total}
        </div>
        <div className="font-display text-[10px] tracking-wider text-orange-200">DECK</div>
      </div>
    </div>
  );
}
