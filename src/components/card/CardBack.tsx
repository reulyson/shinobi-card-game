import React from 'react';
import { UzumakiCrest } from './UzumakiCrest';

export interface CardBackProps {
  className?: string;
  /** Variante compacta de campo (95×132). */
  field?: boolean;
  /** Largura/altura explícitas via style do pai; se omitido, usa mão 156×219 ou campo 95×132. */
  sized?: boolean;
}

/**
 * Verso universal v3: fundo preto, moldura prata + filete laranja, espiral Uzumaki.
 * Usado em mão do rival, decks, ocultos e faceDown.
 */
export const CardBack: React.FC<CardBackProps> = ({
  className = '',
  field = false,
  /** Quando true, aplica 156×219 (mão) ou 95×132 (campo). Deixe false se o pai define o tamanho via className. */
  sized = false,
}) => (
  <div
    aria-hidden="true"
    className={`sc-card sc-card--back ${field ? 'sc-card--field' : ''} ${sized ? (field ? 'sc-card--size-field' : 'sc-card--size-hand') : 'w-full h-full'} ${className}`}
  >
    <div className="sc-back-inner">
      <svg className="sc-back-swirls" viewBox="0 0 312 438" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d="M250 60c20 30 40 70 20 100M40 200c-10 40 20 70 50 60M270 230c30 20 40 60 10 80M0 150c40-30 80 30 130 0s80-30 120 0M30 330c40-30 80 30 130 0s80-30 120 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".28" />
      </svg>
      <UzumakiCrest className="sc-back-crest" />
    </div>
  </div>
);

export default CardBack;
