import type { CSSProperties } from 'react';
import { assetUrl } from './assetUrl';
import { statTone } from './combatPreview';
import { SLOT_H, SLOT_W } from './grid';
import type { ArenaCardRef, FieldCardPreview, StatTone } from './types';
import { UzumakiCardBack } from './UzumakiCardBack';
import './fieldCard.css';

/**
 * Carta de campo B4 — footprint 95×132 = card6.field 238×330 @ zoom 0.4
 * (gen_v7o + plaquinhas gen_b4grid). Part 2 pode trocar o miolo por CardFace.
 */
export interface FieldCardProps {
  card: ArenaCardRef;
  preview?: FieldCardPreview;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  /** `field` = slot de combate; `compact` = mão (sem scale/plaquinhas penduradas). */
  variant?: 'field' | 'compact';
}

const POWER_ICON = assetUrl('art/icons/poder.svg');
const VITA_ICON = assetUrl('art/icons/vida.svg');

const TONE_CLASS: Record<StatTone, string> = {
  base: '',
  above: 'fc-plaque--up',
  below: 'fc-plaque--down',
};

function rankClass(rank?: ArenaCardRef['rank']): string {
  if (rank === 'gennin') return 'fc-card--gennin';
  if (rank === 'chuunin') return 'fc-card--chuunin';
  if (rank === 'jounnin') return 'fc-card--jounnin';
  return '';
}

/** Tamanhos @2× (lógicos 14/17 → 28/34). */
function nameFontSize(name: string): number {
  return name.length > 16 ? 28 : 34;
}

function bandClass(band?: ArenaCardRef['band']): string {
  if (band === 'UNIDADE') return 'fc-band--unidade';
  if (band === 'TOKEN') return 'fc-band--token';
  return '';
}

function bandLabel(band?: ArenaCardRef['band']): string {
  if (band === 'TOKEN' || band === 'UNIDADE') return 'UNIDADE';
  return 'NINJA';
}

function Plaque({
  side,
  value,
  base,
  kind,
}: {
  side: 'l' | 'r';
  value: number;
  base: number;
  kind: 'power' | 'vitality';
}) {
  const tone = statTone(value, base);
  return (
    <div
      className={`fc-plaque fc-plaque--${side} ${TONE_CLASS[tone]}`}
      data-stat={kind}
      data-state={tone}
    >
      <img src={kind === 'power' ? POWER_ICON : VITA_ICON} alt="" />
      <b>{value}</b>
    </div>
  );
}

function CostOrb({ cost }: { cost: number }) {
  return (
    <div className="fc-cost" aria-hidden>
      <img
        className="fc-cost__orb"
        src={assetUrl('art/icons/orbe-chakra.svg')}
        alt=""
        style={{ width: '100%', height: '100%', borderRadius: 0, border: 0, background: 'transparent' }}
      />
      <b>{cost}</b>
    </div>
  );
}

/**
 * Regra v7o: 1 palavra-chave → pílula ícone+nome; 2+ → só ícones.
 */
function KeywordRow({
  keywords,
}: {
  keywords: NonNullable<ArenaCardRef['keywords']>;
}) {
  if (keywords.length === 0) return null;

  if (keywords.length === 1) {
    const kw = keywords[0]!;
    return (
      <div className="fc-pill" data-kw-count="1">
        {kw.id ? <img src={assetUrl(`art/icons/${kw.id}.svg`)} alt="" /> : null}
        <span>{kw.label}</span>
      </div>
    );
  }

  return (
    <div className="fc-tiles" data-kw-count={keywords.length}>
      {keywords.map((kw, i) =>
        kw.id ? (
          <div key={`${kw.id}-${i}`} className="fc-tile" title={kw.label}>
            <img src={assetUrl(`art/icons/${kw.id}.svg`)} alt="" />
          </div>
        ) : (
          <div key={`txt-${i}`} className="fc-pill" title={kw.label}>
            <span>{kw.label}</span>
          </div>
        )
      )}
    </div>
  );
}

export function FieldCard({
  card,
  preview,
  onClick,
  style,
  className = '',
  variant = 'field',
}: FieldCardProps) {
  const pv = preview ?? card.preview;
  const dying = Boolean(pv?.dying || (pv && pv.vitality <= 0));
  const artPos = card.artPos ?? '50% 25%';
  const keywords = card.keywords ?? [];

  if (card.faceDown) {
    return (
      <div
        className={`relative overflow-hidden rounded-md ${className}`}
        style={{ width: SLOT_W, height: SLOT_H, ...style }}
        data-field-card={card.uid}
        data-uid={card.uid}
        data-face-down
      >
        <UzumakiCardBack className="h-full w-full" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        data-field-card={card.uid}
        data-uid={card.uid}
        data-card-id={card.cardId}
        className={`relative block overflow-hidden rounded-[10px] border-0 p-0 text-left ${className}`}
        style={{
          width: SLOT_W,
          height: SLOT_H,
          boxShadow: '0 4px 10px #000a',
          background:
            'linear-gradient(#0b1020,#0b1020) padding-box, linear-gradient(135deg,#F0C08A,#A0612B 28%,#F6CFA0 48%,#7A431C 72%,#D99A5C) border-box',
          border: '4px solid transparent',
          ...style,
        }}
      >
        {card.artUrl ? (
          <img
            src={card.artUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: artPos }}
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1 pb-1 pt-6">
          <div className="truncate text-center font-display text-[11px] text-white drop-shadow">
            {card.name}
          </div>
        </div>
        {typeof card.cost === 'number' && (
          <div className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 font-display text-[12px] text-white">
            {card.cost}
          </div>
        )}
      </button>
    );
  }

  const face = (
    <div className={`fc-card ${rankClass(card.rank)}`}>
      <div className="fc-clip">
        <div
          className="fc-art"
          style={{
            backgroundImage: card.artUrl ? `url(${card.artUrl})` : undefined,
            backgroundPosition: artPos,
            backgroundColor: '#152038',
          }}
        />
        <div className="fc-shade" />
        <div className={`fc-band ${bandClass(card.band)}`}>{bandLabel(card.band)}</div>
        <div className="fc-flow">
          <div className="fc-box">
            <i className="fc-rv fc-rv--a" aria-hidden />
            <i className="fc-rv fc-rv--b" aria-hidden />
            <i className="fc-rv fc-rv--c" aria-hidden />
            <i className="fc-rv fc-rv--d" aria-hidden />
            <div className="fc-name" style={{ fontSize: nameFontSize(card.name) }}>
              {card.name}
            </div>
            <div className="fc-rule" />
            <KeywordRow keywords={keywords} />
          </div>
        </div>
      </div>

      {typeof card.cost === 'number' && <CostOrb cost={card.cost} />}
      <div className="fc-seal" aria-hidden>
        <div className="fc-seal__burst">
          <span>忍</span>
        </div>
      </div>

      {pv && (
        <>
          <Plaque side="l" value={pv.power} base={pv.basePower} kind="power" />
          <Plaque side="r" value={pv.vitality} base={pv.baseVitality} kind="vitality" />
        </>
      )}
    </div>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      data-field-card={card.uid}
      data-uid={card.uid}
      data-card-id={card.cardId}
      data-dying={dying ? 'true' : undefined}
      className={`fc-root ${card.selected ? 'ring-2 ring-amber-300' : ''} ${className}`}
      style={style}
      aria-label={card.name}
    >
      <div className="fc-scale">{face}</div>

      {dying && (
        <>
          <svg className="fc-crack" viewBox="0 0 95 132" preserveAspectRatio="none" aria-hidden>
            <path
              d="M60 0L48 30 62 44 40 74 54 92 36 132"
              fill="none"
              stroke="#000"
              strokeWidth="3.5"
            />
            <path
              d="M60 0L48 30 62 44 40 74 54 92 36 132"
              fill="none"
              stroke="#fff"
              strokeWidth="1.2"
              opacity="0.8"
            />
          </svg>
          <div className="fc-skull" aria-label="Unidade morre na prévia">
            <svg width="38" height="42" viewBox="0 0 38 42" aria-hidden>
              <path
                d="M19 2C9 2 3 9 3 18c0 6 3 9 6 11v7h20v-7c3-2 6-5 6-11C35 9 29 2 19 2z"
                fill="#F3F4F6"
                stroke="#111"
                strokeWidth="2.5"
              />
              <circle cx="12.5" cy="18" r="4.5" fill="#111" />
              <circle cx="25.5" cy="18" r="4.5" fill="#111" />
              <path d="M19 24l-2.5 5h5z" fill="#111" />
              <path d="M13 36v-5M19 36v-5M25 36v-5" stroke="#111" strokeWidth="2" />
            </svg>
          </div>
        </>
      )}
    </button>
  );
}
