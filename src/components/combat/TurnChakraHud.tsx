import React, { forwardRef, useMemo } from 'react';
import { ChakraRing, type ChakraSideStats } from './ChakraRing';
import { TurnCoin, TurnCoinButton, type TurnCoinHandle, type TurnCoinProps } from './TurnCoin';

export interface TurnChakraHudProps extends Omit<TurnCoinProps, 'hideButton' | 'className'> {
  player: ChakraSideStats;
  rival: ChakraSideStats;
  className?: string;
}

/**
 * Coluna HUD: anel de chakra (opção B) + moeda central + botão CONFIRMAR / AGUARDE.
 * API limpa para a Parte 3 montar em (1452,171) / coluna direita.
 */
export const TurnChakraHud = forwardRef<TurnCoinHandle, TurnChakraHudProps>(function TurnChakraHud(
  { player, rival, side, confirmLabel = 'CONFIRMAR ATAQUE', disabled, onConfirm, className, ...coinProps },
  ref
) {
  const coinSize = coinProps.size ?? 104;
  const isPlayer = side === 'player';
  const label = useMemo(
    () => (isPlayer ? confirmLabel : 'AGUARDE O RIVAL'),
    [confirmLabel, isPlayer]
  );

  // Botão a ~142px abaixo do centro da moeda (gen_b4prev B) → gap após o anel
  return (
    <div
      className={`turn-chakra-hud${className ? ` ${className}` : ''}`}
      data-testid="turn-chakra-hud"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        width: 210,
      }}
    >
      <ChakraRing player={player} rival={rival} coinSize={coinSize}>
        <TurnCoin
          ref={ref}
          {...coinProps}
          side={side}
          confirmLabel={confirmLabel}
          disabled={disabled}
          onConfirm={onConfirm}
          size={coinSize}
          hideButton
        />
      </ChakraRing>
      {/* cy+142 a partir do centro da moeda ≈ logo abaixo do anel (gen_b4prev B) */}
      <div style={{ marginTop: -28, position: 'relative', zIndex: 5 }}>
        <TurnCoinButton
          active={isPlayer && !disabled}
          disabled={disabled}
          label={label}
          onClick={onConfirm}
        />
      </div>
    </div>
  );
});

export default TurnChakraHud;
