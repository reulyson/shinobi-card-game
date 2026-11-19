import React from 'react';
import { getCardById } from '../../data/cards';
import { CardBack } from './CardBack';
import { CardFace } from './CardFace';
import { compareStat } from './theme';

const HAND_IDS = [
  'naruto_uzumaki',
  'sasuke_uchiha',
  'zabuza_momochi',
  'unit_anbu_konoha',
  'jutsu_chidori',
  'jutsu_rasengan',
  'jutsu_magen_kurenai',
  'jutsu_omote_renge',
  'equip_kubikiribocho',
] as const;

/**
 * Galeria de verificação visual (frente v7o, verso-v3, campo com estados de cor).
 * Abra com ?gallery=cartas
 */
export const CardGallery: React.FC = () => {
  const hands = HAND_IDS.map((id) => getCardById(id)).filter(Boolean);
  const anbu = getCardById('unit_anbu_konoha');
  const naruto = getCardById('naruto_uzumaki');
  const zabuza = getCardById('zabuza_momochi');
  const sasuke = getCardById('sasuke_uchiha');

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100 p-10 space-y-14" data-gallery="cartas">
      <header>
        <h1 className="font-display text-3xl tracking-wider text-orange-400">
          Shinobi Chronicles — Cartas v7o
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Mão 156×219 · Zoom 312×438 · Campo 95×132 · Verso v3
        </p>
      </header>

      <section data-section="frente-mao">
        <h2 className="text-orange-300 font-semibold mb-6">Frente · mão 156×219</h2>
        <div className="flex flex-wrap gap-10 items-start">
          {hands.map((card) =>
            card ? (
              <div key={card.id} className="flex flex-col gap-2 items-center">
                <CardFace card={card} size="hand" />
                <span className="text-xs text-slate-400">{card.name}</span>
              </div>
            ) : null,
          )}
        </div>
      </section>

      <section data-section="frente-zoom">
        <h2 className="text-orange-300 font-semibold mb-6">Frente · zoom 312×438</h2>
        <div className="flex flex-wrap gap-12 items-start">
          {['naruto_uzumaki', 'unit_anbu_konoha', 'jutsu_chidori', 'equip_kubikiribocho'].map((id) => {
            const card = getCardById(id);
            if (!card) return null;
            return (
              <div key={id} className="flex flex-col gap-2 items-center">
                <CardFace card={card} size="zoom" />
                <span className="text-xs text-slate-400">{card.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section data-section="verso">
        <h2 className="text-orange-300 font-semibold mb-6">Verso universal · v3</h2>
        <div className="flex gap-8 items-end">
          <div className="flex flex-col gap-2 items-center">
            <CardBack sized />
            <span className="text-xs text-slate-400">mão</span>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <CardBack field sized />
            <span className="text-xs text-slate-400">campo</span>
          </div>
        </div>
      </section>

      <section data-section="campo">
        <h2 className="text-orange-300 font-semibold mb-6">
          Campo 95×132 · plaquinhas (branco / verde / vermelho)
        </h2>
        <div className="flex flex-wrap gap-14 items-end">
          {anbu && (
            <div className="sc-gallery-field-wrap">
              <CardFace card={anbu} size="field" power={2} vitality={2} />
              <span className="text-[11px] text-slate-400 text-center">
                Anbu · 2/2 branco (base)
              </span>
            </div>
          )}
          {naruto && (
            <div className="sc-gallery-field-wrap">
              <CardFace
                card={naruto}
                size="field"
                power={4}
                vitality={3}
                powerState={compareStat(4, 3)}
                vitalityState={compareStat(3, 3)}
              />
              <span className="text-[11px] text-slate-400 text-center">
                Naruto · poder 4 verde · vida 3 branca
              </span>
            </div>
          )}
          {zabuza && (
            <div className="sc-gallery-field-wrap">
              <CardFace
                card={zabuza}
                size="field"
                power={5}
                vitality={3}
                powerState={compareStat(5, 5)}
                vitalityState={compareStat(3, 5)}
              />
              <span className="text-[11px] text-slate-400 text-center">
                Zabuza · poder 5 branco · vida 3 vermelha
              </span>
            </div>
          )}
          {sasuke && (
            <div className="sc-gallery-field-wrap">
              <CardFace
                card={sasuke}
                size="field"
                power={3}
                vitality={4}
                powerState={compareStat(3, 3)}
                vitalityState={compareStat(4, 2)}
              />
              <span className="text-[11px] text-slate-400 text-center">
                Sasuke · poder 3 branco · vida 4 verde
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CardGallery;
