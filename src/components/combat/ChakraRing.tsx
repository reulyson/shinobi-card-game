import React, { useMemo } from 'react';
import { TURN_HUD } from './turnHudLayout';
import './ChakraRing.css';

export type ChakraDotState = 'full' | 'empty' | 'sealed';

export interface ChakraSideStats {
  filled: number;
  unlocked: number;
  reserve: number;
}

export interface ChakraRingProps {
  player: ChakraSideStats;
  rival: ChakraSideStats;
  /** Centro absoluto dentro do pai (default: crop gen_timer). */
  cx?: number;
  cy?: number;
  radius?: number;
  reserveRadius?: number;
  showLabels?: boolean;
  className?: string;
  'data-testid'?: string;
}

const MAX_PIPS = 10;
const MAX_RESERVE = 3;
const INK = '#111';

function clampStats(s: ChakraSideStats): Required<ChakraSideStats> {
  const unlocked = Math.max(0, Math.min(MAX_PIPS, Math.round(s.unlocked)));
  const filled = Math.max(0, Math.min(unlocked, Math.round(s.filled)));
  const reserve = Math.max(0, Math.min(MAX_RESERVE, Math.round(s.reserve)));
  return { filled, unlocked, reserve };
}

function pipState(i: number, filled: number, unlocked: number): ChakraDotState {
  if (i < filled) return 'full';
  if (i < unlocked) return 'empty';
  return 'sealed';
}

function pipPositions(
  cx: number,
  cy: number,
  R: number,
  who: 'rival' | 'player'
): Array<{ x: number; y: number }> {
  const d = (13 * Math.PI) / 180;
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < MAX_PIPS; i++) {
    const th = Math.PI - d - (i * (Math.PI - 2 * d)) / 9;
    const x = cx + R * Math.cos(th);
    const y = who === 'rival' ? cy - R * Math.sin(th) : cy + R * Math.sin(th);
    out.push({ x, y });
  }
  return out;
}

function reservePositions(
  cx: number,
  cy: number,
  R2: number,
  who: 'rival' | 'player'
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let k = 0; k < MAX_RESERVE; k++) {
    const th = ((90 - (k - 1) * 15) * Math.PI) / 180;
    const x = cx + R2 * Math.cos(th);
    const y = who === 'rival' ? cy - R2 * Math.sin(th) : cy + R2 * Math.sin(th);
    out.push({ x, y });
  }
  return out;
}

const ChakraPip: React.FC<{
  x: number;
  y: number;
  state: ChakraDotState;
  tone: 'rival' | 'player';
}> = ({ x, y, state, tone }) => {
  const c1 = tone === 'rival' ? '#FF5A5A' : '#4FB3FF';
  const c2 = tone === 'rival' ? '#B91C1C' : '#1D4ED8';
  const emptyBorder = tone === 'rival' ? '#FF5A5A99' : '#4FB3FF99';
  return (
    <div
      className={`chakra-pip chakra-pip--${state} chakra-pip--${tone}`}
      style={
        {
          left: x - 7,
          top: y - 7,
          ['--pip-c1' as string]: c1,
          ['--pip-c2' as string]: c2,
          ['--pip-empty-border' as string]: emptyBorder,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
};

const ReserveDiamond: React.FC<{ x: number; y: number; on: boolean }> = ({ x, y, on }) => {
  const size = 11;
  return (
    <div
      className={`chakra-diamond${on ? ' chakra-diamond--on' : ''}`}
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderColor: on ? INK : '#D6E6A0',
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Anel de chakra (opção B) — posicionado em coordenadas absolutas do pai 210×500.
 * Não redefine o tamanho do container; só desenha pips, losangos e etiquetas.
 */
export const ChakraRing: React.FC<ChakraRingProps> = ({
  player,
  rival,
  cx = TURN_HUD.cx,
  cy = TURN_HUD.cy,
  radius = TURN_HUD.pipRadius,
  reserveRadius = TURN_HUD.reserveRadius,
  showLabels = true,
  className,
  'data-testid': testId = 'chakra-ring',
}) => {
  const me = clampStats(player);
  const rv = clampStats(rival);

  const layout = useMemo(
    () => ({
      rivalPips: pipPositions(cx, cy, radius, 'rival'),
      playerPips: pipPositions(cx, cy, radius, 'player'),
      rivalRes: reservePositions(cx, cy, reserveRadius, 'rival'),
      playerRes: reservePositions(cx, cy, reserveRadius, 'player'),
    }),
    [cx, cy, radius, reserveRadius]
  );

  return (
    <div
      className={`chakra-ring-layer${className ? ` ${className}` : ''}`}
      data-testid={testId}
      role="group"
      aria-label={`Chakra: você ${me.filled}/${me.unlocked} (reserva ${me.reserve}), rival ${rv.filled}/${rv.unlocked} (reserva ${rv.reserve})`}
    >
      {layout.rivalPips.map((p, i) => (
        <ChakraPip
          key={`rv-${i}`}
          x={p.x}
          y={p.y}
          state={pipState(i, rv.filled, rv.unlocked)}
          tone="rival"
        />
      ))}
      {layout.playerPips.map((p, i) => (
        <ChakraPip
          key={`me-${i}`}
          x={p.x}
          y={p.y}
          state={pipState(i, me.filled, me.unlocked)}
          tone="player"
        />
      ))}

      {layout.rivalRes.map((p, i) => (
        <ReserveDiamond key={`rr-${i}`} x={p.x} y={p.y} on={i < rv.reserve} />
      ))}
      {layout.playerRes.map((p, i) => (
        <ReserveDiamond key={`mr-${i}`} x={p.x} y={p.y} on={i < me.reserve} />
      ))}

      {showLabels ? (
        <>
          <div
            className="chakra-label chakra-label--rival"
            style={{ left: TURN_HUD.labelLeft, top: TURN_HUD.labelRivalTop }}
          >
            <span>
              <i>
                {rv.filled}/{rv.unlocked}
              </i>
            </span>
          </div>
          <div
            className="chakra-label chakra-label--player"
            style={{ left: TURN_HUD.labelLeft, top: TURN_HUD.labelPlayerTop }}
          >
            <span>
              <i>
                {me.filled}/{me.unlocked}
              </i>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ChakraRing;
