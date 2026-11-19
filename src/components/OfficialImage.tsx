import React, { useEffect, useState } from 'react';
import { VILLAGE_SYMBOLS, VillageKey } from '../data/officialArt';

/**
 * Imagem oficial da Narutopedia: sem Referer e com uma nova tentativa ("nr=1")
 * para escapar de um 404 antigo em cache. Se ainda falhar, some (o fundo continua legível).
 */
export const OfficialImage: React.FC<
  { src: string; alt?: string; className?: string; style?: React.CSSProperties; draggable?: boolean }
> = ({ src, alt = '', className = '', style, draggable = false }) => {
  const [url, setUrl] = useState(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setUrl(src);
    setFailed(false);
  }, [src]);
  if (failed) return null;
  return (
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      draggable={draggable}
      loading="lazy"
      decoding="async"
      className={className}
      style={style}
      onError={() => {
        if (!url.includes('nr=1')) setUrl(url + (url.includes('?') ? '&' : '?') + 'nr=1');
        else setFailed(true);
      }}
    />
  );
};

/** Símbolo oficial de vila (SVG preto da Narutopedia) tingido por CSS. */
export const VillageSymbol: React.FC<{
  village: VillageKey;
  tone?: 'orange' | 'white' | 'red' | 'dark';
  className?: string;
}> = ({ village, tone = 'orange', className = '' }) => (
  <OfficialImage
    src={VILLAGE_SYMBOLS[village]}
    alt=""
    className={`village-symbol village-${tone} pointer-events-none select-none ${className}`}
  />
);
