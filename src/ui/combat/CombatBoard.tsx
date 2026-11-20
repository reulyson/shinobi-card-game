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
import { ArenaFieldCard } from './ArenaFieldCard';
import { TabLabel, type TabTone } from './TabLabel';
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
  tone,
  style,
  size = 12,
}: {
  text: string;
  tone: 'rival' | 'combat' | 'player' | 'previa';
  style: CSSProperties;
  size?: number;
}) {
  const tabTone: TabTone =
    tone === 'rival' ? 'r' : tone === 'player' ? 'b' : tone === 'previa' ? 'o' : 'o';
  return (
    <div className="absolute" style={{ ...style, zIndex: 11 }}>
      <TabLabel tone={tabTone} size={size}>
        {text}
      </TabLabel>
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
      className="absolute"
      data-combat-board
      style={{
        left: BOARD.x,
        top: BOARD.y,
        width: BOARD.w,
        height: BOARD.h,
        zIndex: 8,
        background: 'linear-gradient(180deg, #0E1636dd, #080C22e8)',
        border: '5px solid #111',
        boxShadow:
          '0 0 0 3px #fff, 0 0 0 9px #F97316, 0 0 0 12px #111, 0 14px 30px rgba(0,0,0,0.75)',
        overflow: 'hidden',
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

      {/* Faixas zone_bg: x=BOARD+5, w=BOARD-10 — atrás das cartas (gen_b4grid). */}
      <div
        className="pointer-events-none absolute"
        data-band="rival"
        style={{
          left: 5,
          top: ZONES.rivalBack.y - BOARD.y,
          width: BOARD.w - 10,
          height: ZONES.rivalBack.h,
          background: '#B91C1C33',
          borderTop: '2px solid #fff3',
          borderBottom: '2px solid #fff3',
          boxSizing: 'border-box',
        }}
      />
      <div
        className="pointer-events-none absolute"
        data-band="combat"
        style={{
          left: 5,
          top: ZONES.combat.y - BOARD.y,
          width: BOARD.w - 10,
          height: ZONES.combat.h,
          background: '#FFD23F14',
          borderTop: '2px solid #fff3',
          borderBottom: '2px solid #fff3',
          boxSizing: 'border-box',
        }}
      />
      <div
        className="pointer-events-none absolute"
        data-band="player"
        style={{
          left: 5,
          top: ZONES.myBack.y - BOARD.y,
          width: BOARD.w - 10,
          height: ZONES.myBack.h,
          background: '#1D5FD633',
          borderTop: '2px solid #fff3',
          borderBottom: '2px solid #fff3',
          boxSizing: 'border-box',
        }}
      />

      {/* zone_bg: tab + desc em (zone.x+18, zone.y+12); counters CAMPO em y+66. */}
      <div
        className="pointer-events-none absolute text-[10px] font-bold leading-snug tracking-wide text-white/75"
        style={{ left: 18, top: ZONES.rivalBack.y + 12 - BOARD.y, width: 200, zIndex: 11 }}
      >
        retaguarda · unidades em campo
      </div>
      <SlantLabel
        text={`CAMPO ${rivalField}/${MAX_UNITS_PER_SIDE}`}
        tone="rival"
        style={{ left: 18, top: ZONES.rivalBack.y + 66 - BOARD.y }}
      />
      <SlantLabel
        text="COMBATE"
        tone="combat"
        style={{ left: 18, top: ZONES.combat.y + 12 - BOARD.y }}
      />
      <SlantLabel
        text={previaLabel}
        tone="previa"
        style={{ left: 22, top: 352 - BOARD.y }}
      />
      <div
        className="pointer-events-none absolute text-[10px] font-bold leading-snug tracking-wide text-white/75"
        style={{ left: 18, top: ZONES.myBack.y + 12 - BOARD.y, width: 200, zIndex: 11 }}
      >
        retaguarda · unidades em campo
      </div>
      <SlantLabel
        text={`CAMPO ${myField}/${MAX_UNITS_PER_SIDE}`}
        tone="player"
        style={{ left: 18, top: ZONES.myBack.y + 66 - BOARD.y }}
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
            className="absolute overflow-visible"
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
            <ArenaFieldCard card={card} onClick={() => onCardClick?.(card)} />
          </div>
        );
      })}
    </>
  );
}
