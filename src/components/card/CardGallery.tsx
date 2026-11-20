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
  'jutsu_bola_de_fogo',
  'jutsu_magen_kurenai',
  'jutsu_fuma_shuriken',
  'trap_selo_explosivo',
  'equip_kubikiribocho',
] as const;

/** Pares para compare-final (id → rótulo do artifact). Alinhados às cartas do v7o.html. */
const COMPARE_IDS = [
  { id: 'sasuke_uchiha', label: 'Ninja Gennin', rank: 1 as const, key: 'ninja-gennin' },
  { id: 'sasuke_uchiha', label: 'Ninja Chuunin', rank: 2 as const, key: 'ninja-chuunin' },
  { id: 'sasuke_uchiha', label: 'Ninja Jounnin', rank: 3 as const, key: 'ninja-jounnin' },
  { id: 'zabuza_momochi', label: 'Ninja 2+ KW', rank: 1 as const, key: 'ninja-2kw' },
  { id: 'unit_anbu_konoha', label: 'Unidade Anbu', rank: 1 as const, key: 'unidade-anbu' },
  { id: 'jutsu_bola_de_fogo', label: 'Ninjutsu', rank: 1 as const, key: 'ninjutsu' },
  { id: 'jutsu_magen_kurenai', label: 'Genjutsu', rank: 1 as const, key: 'genjutsu' },
  { id: 'jutsu_fuma_shuriken', label: 'Taijutsu', rank: 1 as const, key: 'taijutsu' },
  { id: 'jutsu_chidori', label: 'Exclusivo Chidori', rank: 1 as const, key: 'exclusivo-chidori' },
  { id: 'trap_selo_explosivo', label: 'Oculto', rank: 1 as const, key: 'oculto' },
  { id: 'equip_kubikiribocho', label: 'Equipamento', rank: 1 as const, key: 'equipamento' },
] as const;

/** Cartas com os textos mais longos (por tipo) — stress do auto-fit. */
const LONGEST_TEXT = [
  { id: 'sasuke_uchiha', rank: 2 as const, label: 'Ninja Chuunin (texto longo)' },
  { id: 'unit_anko_mitarashi', rank: 1 as const, label: 'Unidade (texto longo)' },
  { id: 'shino_aburame', rank: 3 as const, label: 'Ninja Jounnin (texto longo)' },
  { id: 'hinata_hyuga', rank: 3 as const, label: 'Ninja Jounnin 2 (texto longo)' },
  { id: 'itachi_uchiha', rank: 3 as const, label: 'Ninja Jounnin 3 (texto longo)' },
] as const;

/**
 * Galeria de verificação visual v7o.
 * Abra com ?gallery=cartas
 */
export const CardGallery: React.FC = () => {
  const hands = HAND_IDS.map((id) => getCardById(id)).filter(Boolean);
  const anbu = getCardById('unit_anbu_konoha');
  const naruto = getCardById('naruto_uzumaki');
  const zabuza = getCardById('zabuza_momochi');
  const sasuke = getCardById('sasuke_uchiha');
  const longest = LONGEST_TEXT.map((row) => ({ ...row, card: getCardById(row.id) })).filter(
    (r) => r.card,
  );

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100 p-10 space-y-14" data-gallery="cartas">
      <header>
        <h1 className="font-display text-3xl tracking-wider text-orange-400">
          Shinobi Chronicles — Cartas v7o
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Mão 156×219 · Zoom 312×438 · Campo 119×165 · Verso v7o · CSS verbatim gen_v7o
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Referência HTML:{' '}
          <a className="text-sky-400 underline" href="/v7o-ref/v7o.html" target="_blank" rel="noreferrer">
            /v7o-ref/v7o.html
          </a>
        </p>
      </header>

      <section data-section="compare-zoom">
        <h2 className="text-orange-300 font-semibold mb-2">
          Comparação · zoom 312×438 (todas as variantes)
        </h2>
        <div className="flex flex-wrap gap-12 items-start">
          {COMPARE_IDS.map(({ id, label, rank, key }) => {
            const card = getCardById(id);
            if (!card) return null;
            return (
              <div
                key={key}
                className="flex flex-col gap-2 items-center"
                data-compare={key}
                data-card-id={id}
              >
                <CardFace card={card} size="zoom" rankLevel={rank} />
                <span className="text-xs text-slate-400">
                  {label} · {card.name}
                </span>
              </div>
            );
          })}
          <div className="flex flex-col gap-2 items-center" data-compare="verso">
            <CardBack size="zoom" />
            <span className="text-xs text-slate-400">Verso</span>
          </div>
        </div>
      </section>

      <section data-section="texto-longo">
        <h2 className="text-orange-300 font-semibold mb-2">
          Stress · textos mais longos (mão · zoom · campo)
        </h2>
        <div className="flex flex-wrap gap-10 items-start" data-longest-row="all">
          {longest.map(({ id, rank, label, card }) =>
            card ? (
              <div
                key={`long-${id}-${rank}`}
                className="flex flex-col gap-3 items-center"
                data-longest={id}
                data-rank={rank}
              >
                <div className="flex gap-4 items-end">
                  <CardFace card={card} size="hand" rankLevel={rank} />
                  <CardFace card={card} size="zoom" rankLevel={rank} />
                  <CardFace card={card} size="field" rankLevel={rank} />
                </div>
                <span className="text-xs text-slate-400 text-center max-w-[320px]">
                  {label} · {card.name}
                </span>
              </div>
            ) : null,
          )}
        </div>
      </section>

      <section data-section="frente-mao">
        <h2 className="text-orange-300 font-semibold mb-6">Frente · mão 156×219</h2>
        <div className="flex flex-wrap gap-10 items-start">
          {hands.map((card) =>
            card ? (
              <div
                key={card.id}
                className="flex flex-col gap-2 items-center"
                data-card-id={card.id}
              >
                <CardFace card={card} size="hand" />
                <span className="text-xs text-slate-400">{card.name}</span>
              </div>
            ) : null,
          )}
        </div>
      </section>

      <section data-section="verso">
        <h2 className="text-orange-300 font-semibold mb-6">Verso universal · v7o</h2>
        <div className="flex gap-8 items-end">
          <div className="flex flex-col gap-2 items-center">
            <CardBack sized />
            <span className="text-xs text-slate-400">mão 156×219</span>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <CardBack field sized />
            <span className="text-xs text-slate-400">campo 119×165</span>
          </div>
        </div>
      </section>

      <section data-section="campo">
        <h2 className="text-orange-300 font-semibold mb-6">
          Campo 119×165 · stats na faixa (branco / verde / vermelho)
        </h2>
        <div className="flex flex-wrap gap-14 items-end">
          {anbu && (
            <div className="sc-gallery-field-wrap" data-compare="campo-anbu" data-card-id="unit_anbu_konoha">
              <CardFace card={anbu} size="field" power={2} vitality={2} />
              <span className="text-[11px] text-slate-400 text-center">
                1 KW · pílula ícone+nome · stats base
              </span>
            </div>
          )}
          {naruto && (
            <div className="sc-gallery-field-wrap" data-compare="campo-naruto">
              <CardFace
                card={naruto}
                size="field"
                power={4}
                vitality={3}
                powerState={compareStat(4, 3)}
                vitalityState={compareStat(3, 3)}
              />
              <span className="text-[11px] text-slate-400 text-center">
                1 KW · pílula · poder acima (verde)
              </span>
            </div>
          )}
          {zabuza && (
            <div className="sc-gallery-field-wrap" data-compare="campo-zabuza">
              <CardFace
                card={zabuza}
                size="field"
                power={5}
                vitality={3}
                powerState={compareStat(5, 5)}
                vitalityState={compareStat(3, 5)}
              />
              <span className="text-[11px] text-slate-400 text-center">
                2+ KW · só ícones · vida abaixo (vermelho)
              </span>
            </div>
          )}
          {sasuke && (
            <div className="sc-gallery-field-wrap" data-compare="campo-sasuke" data-card-id="sasuke_uchiha">
              <CardFace
                card={sasuke}
                size="field"
                power={3}
                vitality={4}
                powerState={compareStat(3, 3)}
                vitalityState={compareStat(4, 2)}
                keywordsOverride={['Ataque Rápido']}
              />
              <span className="text-[11px] text-slate-400 text-center">
                Sasuke · 1 KW pílula GOLPE VELOZ · vida verde
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CardGallery;
