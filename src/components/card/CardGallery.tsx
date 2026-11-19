import React from 'react';
import { getCardById } from '../../data/cards';
import { CardBack } from './CardBack';
import { CardFace } from './CardFace';
import { compareStat } from './theme';

const SAMPLE_IDS = [
  'naruto_uzumaki',
  'sasuke_uchiha',
  'zabuza_momochi',
  'unit_anbu_konoha',
  'jutsu_chidori',
  'jutsu_rasengan',
  'equip_kubikiribocho',
] as const;

/**
 * Galeria de verificação visual (frente v7o, verso-v3, campo com estados de cor).
 * Abra com ?gallery=cartas no lobby (só em desenvolvimento / handoff).
 */
export const CardGallery: React.FC = () => {
  const cards = SAMPLE_IDS.map((id) => getCardById(id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100 p-8 space-y-10">
      <header>
        <h1 className="font-display text-3xl tracking-wider text-orange-400">
          Shinobi Chronicles — Cartas v7o
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Frente (mão), verso universal e variante de campo 95×132
        </p>
      </header>

      <section>
        <h2 className="text-orange-300 font-semibold mb-4">Frente · mão / zoom</h2>
        <div className="flex flex-wrap gap-8 items-start">
          {cards.map((card) =>
            card ? (
              <div key={card.id} className="flex flex-col gap-2 items-center">
                <CardFace card={card} size="hand" />
                <span className="text-xs text-slate-400">{card.name}</span>
              </div>
            ) : null,
          )}
        </div>
      </section>

      <section>
        <h2 className="text-orange-300 font-semibold mb-4">Verso universal · v3</h2>
        <div className="flex gap-6 items-end">
          <CardBack sized />
          <CardBack field sized />
        </div>
      </section>

      <section>
        <h2 className="text-orange-300 font-semibold mb-4">
          Campo 95×132 · plaquinhas (branco / verde / vermelho)
        </h2>
        <div className="flex flex-wrap gap-10 items-end pb-8">
          {(() => {
            const anbu = getCardById('unit_anbu_konoha');
            const naruto = getCardById('naruto_uzumaki');
            const zabuza = getCardById('zabuza_momochi');
            const sasuke = getCardById('sasuke_uchiha');
            if (!anbu || !naruto || !zabuza || !sasuke) return null;
            return (
              <>
                <CardFace card={anbu} size="field" power={2} vitality={2} />
                <CardFace
                  card={naruto}
                  size="field"
                  power={4}
                  vitality={3}
                  powerState={compareStat(4, 3)}
                  vitalityState={compareStat(3, 3)}
                />
                <CardFace
                  card={zabuza}
                  size="field"
                  power={5}
                  vitality={3}
                  powerState={compareStat(5, 5)}
                  vitalityState={compareStat(3, 5)}
                />
                <CardFace
                  card={sasuke}
                  size="field"
                  power={3}
                  vitality={4}
                  powerState={compareStat(3, 3)}
                  vitalityState={compareStat(4, 2)}
                />
              </>
            );
          })()}
        </div>
      </section>
    </div>
  );
};

export default CardGallery;
