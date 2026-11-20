import React, { forwardRef, useMemo } from 'react';
import { ChakraRing, type ChakraSideStats } from './ChakraRing';
import {
  TurnCoin,
  TurnCoinButton,
  type TurnCoinHandle,
  type TurnCoinProps,
} from './TurnCoin';
import { TURN_HUD } from './turnHudLayout';
import './TurnChakraHud.css';

export interface TurnChakraHudProps extends Omit<TurnCoinProps, 'hideButton' | 'className'> {
  player: ChakraSideStats;
  rival: ChakraSideStats;
  className?: string;
}

/**
 * HUD do turno no crop 210×500 de gen_timer (CXX=1525, CY=416 → crop 1390,190).
 * Moeda CR=52 em (135,226), anel R=68 / R2=88, plaquinhas e botão nas mesmas distâncias.
 * `size` escala o canvas inteiro (default 104 = 1:1 com a ref).
 */
export const TurnChakraHud = forwardRef<TurnCoinHandle, TurnChakraHudProps>(function TurnChakraHud(
  {
    player,
    rival,
    side,
    confirmLabel = 'CONFIRMAR ATAQUE',
    disabled,
    onConfirm,
    size = TURN_HUD.coinSize,
    className,
    ...coinProps
  },
  ref
) {
  const isPlayer = side === 'player';
  const label = useMemo(
    () => (isPlayer ? confirmLabel : 'AGUARDE O RIVAL'),
    [confirmLabel, isPlayer]
  );

  const scale = size / TURN_HUD.coinSize;
  const coinPx = TURN_HUD.coinSize;

  return (
    <div
      className={`turn-chakra-hud${className ? ` ${className}` : ''}`}
      data-testid="turn-chakra-hud"
      style={{
        width: TURN_HUD.width * scale,
        height: TURN_HUD.height * scale,
      }}
    >
      <div
        className="turn-chakra-hud__canvas"
        style={{
          width: TURN_HUD.width,
          height: TURN_HUD.height,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <ChakraRing player={player} rival={rival} />

        <div
          className="turn-chakra-hud__coin"
          style={{
            left: TURN_HUD.cx - TURN_HUD.coinRadius,
            top: TURN_HUD.cy - TURN_HUD.coinRadius,
            width: coinPx,
            height: coinPx,
          }}
        >
          <TurnCoin
            ref={ref}
            {...coinProps}
            side={side}
            confirmLabel={confirmLabel}
            disabled={disabled}
            onConfirm={onConfirm}
            size={coinPx}
            hideButton
          />
        </div>

        <div
          className="turn-chakra-hud__confirm"
          style={{
            left: TURN_HUD.buttonLeft,
            top: TURN_HUD.buttonTop,
          }}
        >
          <TurnCoinButton
            active={isPlayer && !disabled}
            disabled={disabled}
            label={label}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
});

export default TurnChakraHud;
