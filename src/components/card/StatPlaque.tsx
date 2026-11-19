import React from 'react';
import { CardIcon } from './CardIcon';
import { StatColorState } from './theme';

export interface StatPlaqueProps {
  kind: 'power' | 'vitality';
  value: number;
  /** Cor relativa à base: vermelho abaixo, verde acima, branco igual. */
  colorState?: StatColorState;
  /** Variante de campo (plaquinhas grandes penduradas). */
  field?: boolean;
  className?: string;
}

const STATE_CLASS: Record<StatColorState, string> = {
  base: 'sc-stat--base',
  up: 'sc-stat--up',
  down: 'sc-stat--down',
};

/**
 * Plaquinha de Poder (esquerda) ou Vitalidade (direita).
 * Aceita `colorState` para prévia de combate (Parte 3).
 */
export const StatPlaque: React.FC<StatPlaqueProps> = ({
  kind,
  value,
  colorState = 'base',
  field = false,
  className = '',
}) => (
  <div
    className={`sc-stat sc-stat--${kind} ${STATE_CLASS[colorState]} ${field ? 'sc-stat--field' : ''} ${className}`}
    title={kind === 'power' ? 'Poder' : 'Vitalidade'}
    data-stat={kind}
    data-state={colorState}
  >
    <CardIcon id={kind === 'power' ? 'poder' : 'vida'} size={field ? 18 : 14} />
    <b>{value}</b>
  </div>
);

export default StatPlaque;
