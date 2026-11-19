import type { CSSProperties } from 'react';
import {
  ATT_Y,
  BLK_Y,
  BOARD,
  COL_CX,
  MAX_UNITS_PER_SIDE,
  MY_BACK_Y,
  RIVAL_BACK_Y,
  SLOT_H,
  SLOT_W,
  ZONES,
  colX,
} from './grid';
import { FieldCard } from './FieldCard';
import type { ArenaCardRef } from './types';

function placeByColumn(cards: ArenaCardRef[]): Array<ArenaCardRef | null> {
  const slots: Array<ArenaCardRef | null> = Array.from({ length: MAX_UNITS_PER_SIDE }, () => null);
  const used = new Set<number>();
  for (const c of cards) {
    if (c.column != null && c.column >= 0 && c.column < 5 && !used.has(c.column)) {
      slots[c.column] = c;
      used.add(c.column);
    }
  }
  let cursor = 0;
  for (const c of cards) {
    if (c.column != null && slots[c.column]?.uid === c.uid) continue;
    while (cursor < 5 && slots[cursor]) cursor++;
    if (cursor >= 5) break;
    slots[cursor] = c;
    cursor++;
  }
  return slots;
}

function SlantLabel({
  text,
  sub,
  tone,
  style,
}: {
  text: string;
  sub?: string;
  tone: 'rival' | 'combat' | 'player' | 'previa';
  style: CSSProperties;
}) {
  const bg =
    tone === 'rival'
      ? 'linear-gradient(180deg,#FF7A7A,#C81E1E)'
      : tone === 'player'
        ? 'linear-gradient(180deg,#7DC4FF,#1D5FD6)'
        : tone === 'previa'
          ? 'linear-gradient(180deg,#FFE55A,#F97316)'
          : 'linear-gradient(180deg,#FFE55A,#F0501A)';
  return (
    <div
      className="absolute"
      style={{ ...style, transform: 'skewX(-12deg)', zIndex: 11 }}
    >
      <div
        className="border-2 border-black px-3 py-0.5"
        style={{ background: bg, boxShadow: '0 0 0 2px #fff, 0 3px 6px rgba(0,0,0,0.45)' }}
      >
        <div
          className="font-display text-[13px] tracking-wider text-white"
          style={{ transform: 'skewX(12deg)', WebkitTextStroke: '2.5px #111', paintOrder: 'stroke fill' }}
        >
          {text}
        </div>
        {sub && (
          <div
            className="text-[8px] font-semibold uppercase tracking-wide text-white/85"
            style={{ transform: 'skewX(12deg)' }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export interface CombatBoardProps {
  rivalBackrow: ArenaCardRef[];
  myBackrow: ArenaCardRef[];
  rivalCombat: ArenaCardRef[];
  myCombat: ArenaCardRef[];
  previaLabel?: string;
  onCardClick?: (card: ArenaCardRef) => void;
}

export function CombatBoard({
  rivalBackrow,
  myBackrow,
  rivalCombat,
  myCombat,
  previaLabel = 'PRÉVIA - NADA FOI APLICADO',
  onCardClick,
}: CombatBoardProps) {
  const rb = placeByColumn(rivalBackrow);
  const mb = placeByColumn(myBackrow);
  const rc = placeByColumn(rivalCombat);
  const mc = placeByColumn(myCombat);
  const rivalField = rb.filter(Boolean).length;
  const myField = mb.filter(Boolean).length;

  return (
    <div
      className="absolute overflow-hidden"
      data-combat-board
      style={{
        left: BOARD.x,
        top: BOARD.y,
        width: BOARD.w,
        height: BOARD.h,
        zIndex: 8,
        background: 'linear-gradient(180deg, rgba(14,22,54,0.86), rgba(8,12,34,0.92))',
        border: '5px solid #111',
        boxShadow:
          '0 0 0 3px #fff, 0 0 0 9px #F97316, 0 0 0 12px #111, 0 14px 30px rgba(0,0,0,0.75)',
      }}
    >
      {/* Espiral Uzumaki */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.11]"
        aria-hidden
      >
        <svg width={600} height={600} viewBox="0 0 100 100">
          <path
            d="M50,50 m0,-44 a44,44 0 1,1 -0.1,0"
            fill="none"
            stroke="#F97316"
            strokeWidth={1.2}
            style={{ transformOrigin: '50px 50px', transform: 'scale(1)' }}
          />
          <path
            d="M50 50 Q 70 30 78 50 Q 70 78 50 72 Q 28 64 32 48 Q 38 32 50 36"
            fill="none"
            stroke="#F97316"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Faixas de borda a borda (continuam atrás do Histórico). */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: 5,
          top: RIVAL_BACK_Y - BOARD.y,
          width: BOARD.w - 10,
          height: 144,
          background: '#B91C1C33',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: 5,
          top: ZONES.combat.y - BOARD.y,
          width: BOARD.w - 10,
          height: ZONES.combat.h,
          background: '#FFD23F14',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: 5,
          top: MY_BACK_Y - BOARD.y,
          width: BOARD.w - 10,
          height: 144,
          background: '#1D5FD633',
        }}
      />

      {/* Área info esquerda = footprint do Histórico (214×588), só labels. */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: ZONES.infoLeft.x - BOARD.x,
          top: ZONES.infoLeft.y - BOARD.y,
          width: ZONES.infoLeft.w,
          height: ZONES.infoLeft.h,
        }}
        data-zone="info-left"
      />

      <SlantLabel
        text={`CAMPO ${rivalField}/${MAX_UNITS_PER_SIDE}`}
        tone="rival"
        style={{ left: 18, top: 12 }}
      />
      <SlantLabel text="COMBATE" tone="combat" style={{ left: 18, top: 168 }} />
      <SlantLabel text={previaLabel} tone="previa" style={{ left: 18, top: 210 }} />
      <SlantLabel
        text={`CAMPO ${myField}/${MAX_UNITS_PER_SIDE}`}
        tone="player"
        style={{ left: 18, top: BOARD.h - 48 }}
      />

      <Row cards={rb} y={RIVAL_BACK_Y} onCardClick={onCardClick} />
      <Row cards={rc} y={ATT_Y} onCardClick={onCardClick} />
      <Row cards={mc} y={BLK_Y} onCardClick={onCardClick} />
      <Row cards={mb} y={MY_BACK_Y} onCardClick={onCardClick} />
    </div>
  );
}

function Row({
  cards,
  y,
  onCardClick,
}: {
  cards: Array<ArenaCardRef | null>;
  y: number;
  onCardClick?: (card: ArenaCardRef) => void;
}) {
  return (
    <>
      {cards.map((card, i) => {
        if (!card) return null;
        return (
          <div
            key={card.uid}
            className="absolute"
            style={{
              left: colX(i) - BOARD.x,
              top: y - BOARD.y,
              width: SLOT_W,
              height: SLOT_H,
              zIndex: 10,
            }}
            data-col={i}
            data-col-cx={COL_CX[i]}
          >
            <FieldCard card={card} onClick={() => onCardClick?.(card)} />
          </div>
        );
      })}
    </>
  );
}
