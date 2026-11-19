import React from 'react';
import { UzumakiCrest } from './UzumakiCrest';
import './card-v7o.css';

export interface CardBackProps {
  className?: string;
  /** Variante compacta de campo (119×165). */
  field?: boolean;
  /** hand | field | zoom — aplica footprint v7o via scale. */
  size?: 'hand' | 'field' | 'zoom';
  /** @deprecated use size; quando true sem size → hand/field. */
  sized?: boolean;
}

function BackInner({ field }: { field?: boolean }) {
  return (
    <div className={`card6 back${field ? ' field' : ''}`}>
      <div className="bk">
        <svg
          className="sw"
          viewBox="0 0 312 438"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M250 60c20 30 40 70 20 100M40 200c-10 40 20 70 50 60M270 230c30 20 40 60 10 80M0 150c40-30 80 30 130 0s80-30 120 0M30 330c40-30 80 30 130 0s80-30 120 0"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <UzumakiCrest className="bsp" />
      </div>
    </div>
  );
}

/**
 * Verso universal v7o: fundo preto, moldura prata + filete laranja, espiral Uzumaki.
 */
export const CardBack: React.FC<CardBackProps> = ({
  className = '',
  field = false,
  size,
  sized = false,
}) => {
  const resolved: 'hand' | 'field' | 'zoom' =
    size ?? (sized ? (field ? 'field' : 'hand') : field ? 'field' : 'hand');
  const scaleClass =
    resolved === 'field'
      ? 'sc-v7o-scale--field'
      : resolved === 'zoom'
        ? 'sc-v7o-scale--zoom'
        : 'sc-v7o-scale--hand';

  // Pai define tamanho (ex.: CardView faceDown fill) — preenche o container.
  if (!sized && !size) {
    return (
      <div aria-hidden="true" className={`w-full h-full ${className}`}>
        <div
          className={`card6 back${field ? ' field' : ''}`}
          style={{ width: '100%', height: '100%', transform: 'none', borderRadius: field ? 12 : 16 }}
        >
          <div className="bk">
            <svg className="sw" viewBox="0 0 312 438" preserveAspectRatio="none" fill="none" aria-hidden="true">
              <path
                d="M250 60c20 30 40 70 20 100M40 200c-10 40 20 70 50 60M270 230c30 20 40 60 10 80M0 150c40-30 80 30 130 0s80-30 120 0M30 330c40-30 80 30 130 0s80-30 120 0"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <UzumakiCrest className="bsp" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`sc-v7o-scale ${scaleClass} ${className}`}>
      <BackInner field={resolved === 'field'} />
    </div>
  );
};

export default CardBack;
