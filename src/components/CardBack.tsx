import React from 'react';
import { VillageSymbol } from './OfficialImage';

/**
 * Verso de carta: base desenhada em CSS (nunca quebra, tamanho fixo definido pelo pai)
 * com o símbolo oficial de Konoha (Narutopedia) no selo central. Se o símbolo não
 * carregar, o anel do selo continua visível.
 */
const CardBack: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`card-back relative rounded-md overflow-hidden border border-orange-600/80 shadow ${className}`}
  >
    <div className="absolute inset-[3px] rounded-[3px] border border-[#f3e3c3]/30" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[62%] aspect-square rounded-full border-2 border-orange-400/75 bg-black/35 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.35)]">
        <VillageSymbol village="konoha" tone="orange" className="w-[70%] h-[70%]" />
      </div>
    </div>
  </div>
);

export default CardBack;
