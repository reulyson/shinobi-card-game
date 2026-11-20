import React from 'react';
import { BoardUnit, CardDef } from '../../types/game';
import { getSignatureOwner, SIGNATURE_JUTSU_IDS } from '../../data/cards';
import { NINJA_CREATED_ONLY_IDS } from '../../data/ninjaExtras';
import { getNinjaPatenteCost, getUnitHealth, getUnitPower } from '../../engine/battleEngine';
import { AnimePortrait } from '../AnimePortrait';
import { CardIcon } from './CardIcon';
import {
  CardIconId,
  CardRankFrame,
  compareStat,
  jutsuFamilyOf,
  keywordPills,
  patenteLabel,
  rankFrameOf,
  speedPill,
  StatColorState,
  typeBandFor,
} from './theme';
import { useFitCardPanel } from './useFitCardPanel';
import './card-v7o.css';

export type CardFaceSize = 'hand' | 'field' | 'zoom' | 'collection' | 'inspector';

export interface CardFaceProps {
  card: CardDef;
  unit?: BoardUnit;
  size?: CardFaceSize;
  effectiveCost?: number;
  power?: number;
  vitality?: number;
  powerState?: StatColorState;
  vitalityState?: StatColorState;
  rankLevel?: 1 | 2 | 3;
  levelProgress?: number;
  selected?: boolean;
  dimmed?: boolean;
  playable?: boolean;
  className?: string;
  exclusive?: boolean;
  createdByCard?: boolean;
}

/** Omite placeholders de “sem habilidade ao baixar”; mostra só texto real. */
function sanitizeRulesText(text: string): string {
  let t = text.trim();
  t = t.replace(/^(Sem baixada|Sem entrada)\.\s*/i, '');
  if (/^Passiva:\s*nenhuma\b/i.test(t)) return '';
  return t.trim();
}

function abilityTextFor(card: CardDef, rank: 1 | 2 | 3): string {
  let raw = '';
  switch (card.kind) {
    case 'ninja':
      if (rank === 3) raw = card.jounninAbilityText;
      else if (rank === 2) raw = card.chuuninAbilityText;
      else raw = card.abilityText;
      break;
    case 'unidade':
    case 'token':
      raw = card.abilityText;
      break;
    case 'jutsu':
    case 'equipamento':
      raw = card.effectText;
      break;
    default: {
      const _never: never = card;
      void _never;
      return '';
    }
  }
  return sanitizeRulesText(raw);
}

function baseStats(card: CardDef, rank: 1 | 2 | 3): { attack: number; health: number } | null {
  if (card.kind === 'ninja') {
    if (rank === 3) return { attack: card.jounninAttack, health: card.jounninHealth };
    if (rank === 2) return { attack: card.chuuninAttack, health: card.chuuninHealth };
    return { attack: card.attack, health: card.health };
  }
  if (card.kind === 'unidade' || card.kind === 'token') {
    return { attack: card.attack, health: card.health };
  }
  return null;
}

function keywordsFor(card: CardDef, unit: BoardUnit | undefined, rank: 1 | 2 | 3) {
  if (unit && (card.kind !== 'ninja' || unit.evolutionLevel === rank)) {
    return unit.keywords;
  }
  if (card.kind === 'ninja') {
    if (rank === 3) return card.jounninKeywords;
    if (rank === 2) return card.chuuninKeywords;
    return card.keywords;
  }
  if (card.kind === 'unidade' || card.kind === 'token') return card.keywords;
  if (card.kind === 'equipamento') return card.grantedKeywords;
  return [];
}

function levelUpCounter(
  card: CardDef,
  rank: 1 | 2 | 3,
  progress: number | undefined,
): string | null {
  if (card.kind !== 'ninja') return null;
  const max = card.maxRank ?? 3;
  if (rank >= max) return null;
  if (rank === 1) {
    const target = card.levelUpTarget;
    const cur = Math.min(progress ?? 0, target);
    return `${card.levelUpCondition} (${cur}/${target})`;
  }
  const target = card.chuuninLevelUpTarget;
  const cur = Math.min(progress ?? 0, target);
  return `${card.chuuninLevelUpCondition} (${cur}/${target})`;
}

/** Destaca termos como no gen_v7o (em nos mocks: nomes, N de dano, −N/−N, Entrada:). */
function formatRulesHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Espelha os <em> do gen_v7o — não destaca +N/+N (ex.: Sasuke deixa (+1/+1) sem em).
  const patterns: RegExp[] = [
    /\bEntrada:/gi,
    /-\d+\/-?\d+/g,
    /\d+\s+de\s+dano/gi,
    /\bSede de Batalha\b/gi,
    /\bClone das Sombras\b/gi,
    /\bAtaque em Área\b/gi,
    /\bAtaque Individual\b/gi,
    /\bGolpe Veloz\b/gi,
    /\bKubikiribōchō\b/gi,
    /\bSelo Amaldiçoado\b/gi,
    /\bSubstituição\b/gi,
    /\bPerfurante\b/gi,
    /\bFormação\b/gi,
    /\bVeneno\b/gi,
    /\bGenjutsu\b/gi,
    /\bSelado\b/gi,
    /\bFurtivo\b/gi,
    /\bPreparado\b/gi,
    /\bSharingan\b/gi,
    /\bParceiro\b/gi,
  ];

  type Span = { start: number; end: number };
  const spans: Span[] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(escaped)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (spans.some((s) => start < s.end && end > s.start)) continue;
      spans.push({ start, end });
    }
  }
  spans.sort((a, b) => a.start - b.start);

  let out = '';
  let cursor = 0;
  for (const s of spans) {
    out += escaped.slice(cursor, s.start);
    out += `<em>${escaped.slice(s.start, s.end)}</em>`;
    cursor = s.end;
  }
  out += escaped.slice(cursor);
  return out;
}

function shortTraits(card: CardDef, rank: 1 | 2 | 3): string | null {
  switch (card.kind) {
    case 'ninja':
      return patenteLabel(rank);
    case 'unidade':
    case 'token':
      return card.role.toUpperCase();
    case 'equipamento':
      return card.faction
        ? `EQUIPAMENTO · ${card.faction.toUpperCase()}`
        : 'EQUIPAMENTO';
    case 'jutsu':
      return null;
    default: {
      const _never: never = card;
      void _never;
      return null;
    }
  }
}

function nameFontSize(name: string, field: boolean): number {
  const ln = name.length;
  if (field) return ln > 16 ? 14 : 17;
  return ln > 16 ? 15 : 21;
}

const STAR_BURST_PATH =
  'M32.00 1.00L36.49 9.44L43.86 3.36L44.78 12.88L53.92 10.08L51.12 19.22L60.64 20.14L54.56 27.51L63.00 32.00L54.56 36.49L60.64 43.86L51.12 44.78L53.92 53.92L44.78 51.12L43.86 60.64L36.49 54.56L32.00 63.00L27.51 54.56L20.14 60.64L19.22 51.12L10.08 53.92L12.88 44.78L3.36 43.86L9.44 36.49L1.00 32.00L9.44 27.51L3.36 20.14L12.88 19.22L10.08 10.08L19.22 12.88L20.14 3.36L27.51 9.44Z';

function ShinobiSeal({ field }: { field?: boolean }) {
  const sz = field ? 44 : 62;
  return (
    <div className={`seal6${field ? ' f' : ''}`}>
      <div className="sb" style={{ width: sz, height: sz }}>
        <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <defs>
            <radialGradient id="sc-sg" cx=".4" cy=".35">
              <stop stopColor="#FFF3B0" />
              <stop offset=".6" stopColor="#F5C542" />
              <stop offset="1" stopColor="#B9791A" />
            </radialGradient>
          </defs>
          <path
            d={STAR_BURST_PATH}
            fill="url(#sc-sg)"
            stroke="#7C4A0A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="19" fill="none" stroke="#7C4A0A" strokeWidth="1" opacity=".5" />
        </svg>
        <span className="sb-in">
          <i className="k">忍</i>
        </span>
      </div>
    </div>
  );
}

function FamilySeal({
  family,
  field,
}: {
  family: 'selo-ninjutsu' | 'selo-genjutsu' | 'selo-taijutsu';
  field?: boolean;
}) {
  const labels: Record<typeof family, [string, string]> = {
    'selo-ninjutsu': ['忍', '術'],
    'selo-genjutsu': ['幻', '術'],
    'selo-taijutsu': ['体', '術'],
  };
  const [a, b] = labels[family];
  const sz = field ? 44 : 62;
  const fs = sz * 0.4;
  return (
    <div className={`seal6${field ? ' f' : ''}`}>
      <div className="ksl" style={{ width: sz, height: sz }}>
        <svg viewBox="0 0 64 64" className="ens" aria-hidden="true">
          <path
            d="M32 5C17 4 5 15 6 32C7 49 19 60 34 58C48 56 59 45 58 30C57.5 22 54 15 49 11"
            fill="none"
            stroke="#14110C"
            strokeWidth="3.6"
            strokeLinecap="round"
            opacity=".85"
          />
        </svg>
        <span style={{ fontSize: fs }}>{a}</span>
        <span style={{ fontSize: fs }}>{b}</span>
        <i className="hk" />
      </div>
    </div>
  );
}

function EquipSeal({ field }: { field?: boolean }) {
  const sz = field ? 44 : 58;
  return (
    <div className={`seal6${field ? ' f' : ''}`}>
      <div className="stamp steel" style={{ width: sz, height: sz, fontSize: Math.round(sz * 0.62) }}>
        武
      </div>
    </div>
  );
}

function KeywordRow({
  pills,
  field,
}: {
  pills: Array<{ id: CardIconId | null; label: string }>;
  field?: boolean;
}) {
  if (pills.length === 0) return null;
  // 1 keyword → pílula ícone+nome; 2+ → só ícones lado a lado (todos os tamanhos)
  if (pills.length === 1) {
    const p = pills[0];
    return (
      <div className="pill" title={p.label}>
        {p.id && <CardIcon id={p.id} size={field ? 14 : 18} />}
        <span>{p.label}</span>
      </div>
    );
  }
  const tile = field ? 24 : 30;
  return (
    <div className="tiles">
      {pills.map((p, i) =>
        p.id ? (
          <div
            key={`${p.label}-${i}`}
            className="tile"
            style={{ width: tile, height: tile }}
            title={p.label}
          >
            <CardIcon id={p.id} size={tile - 6} />
          </div>
        ) : (
          <div key={`${p.label}-${i}`} className="pill" title={p.label}>
            <span>{p.label}</span>
          </div>
        ),
      )}
    </div>
  );
}

const SHUR_GEM = (
  <svg className="gem" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      d="M12 1L15.6 8.4L23 12L15.6 15.6L12 23L8.4 15.6L1 12L8.4 8.4Z M12 10A2 2 0 1 0 12 14A2 2 0 1 0 12 10Z"
      fill="#D1D5DB"
      stroke="#1F2937"
      strokeWidth="1.2"
      strokeLinejoin="round"
      fillRule="evenodd"
    />
  </svg>
);

/**
 * Face frontal v7o — DOM/CSS espelham gen_v7o.py (card6).
 * Mão 156×219 e campo 119×165 via scale 0.5 sobre 312×438 / 238×330.
 */
export const CardFace: React.FC<CardFaceProps> = ({
  card,
  unit,
  size = 'hand',
  effectiveCost,
  power,
  vitality,
  powerState,
  vitalityState,
  rankLevel,
  levelProgress,
  selected = false,
  dimmed = false,
  playable = false,
  className = '',
  exclusive = false,
  createdByCard = false,
}) => {
  const field = size === 'field';
  const fitEnabled = size === 'hand' || size === 'zoom' || size === 'collection' || size === 'inspector';
  const rank = (rankLevel ?? unit?.evolutionLevel ?? 1) as 1 | 2 | 3;
  const frame: CardRankFrame = rankFrameOf(rank, card.kind);
  const cost =
    effectiveCost ??
    (card.kind === 'ninja' ? getNinjaPatenteCost(card, rank) : card.cost);

  const isExclusiveJutsu =
    exclusive || (card.kind === 'jutsu' && SIGNATURE_JUTSU_IDS.has(card.id));
  const signatureOwner =
    isExclusiveJutsu && card.kind === 'jutsu' ? getSignatureOwner(card.id) : undefined;
  const isCreated =
    createdByCard || card.kind === 'token' || NINJA_CREATED_ONLY_IDS.has(card.id);

  const band = typeBandFor(card, { exclusive: isExclusiveJutsu, created: isCreated });
  const stats = baseStats(card, rank);
  const isCharacter = Boolean(stats);

  const shownPower =
    power ?? (unit && isCharacter ? getUnitPower(unit) : stats?.attack);
  const shownVitality =
    vitality ?? (unit && isCharacter ? getUnitHealth(unit) : stats?.health);
  const basePower = stats?.attack ?? 0;
  const baseVitality = stats?.health ?? 0;
  const pState =
    powerState ?? (shownPower != null ? compareStat(shownPower, basePower) : 'base');
  const vState =
    vitalityState ??
    (shownVitality != null ? compareStat(shownVitality, baseVitality) : 'base');

  const kws = keywordsFor(card, unit, rank);
  const pills = keywordPills(kws);
  const rules = abilityTextFor(card, rank);
  const lvlCounter = levelUpCounter(
    card,
    rank,
    levelProgress ??
      (unit && unit.evolutionLevel === rank ? unit.evolutionProgress : undefined),
  );
  const family = card.kind === 'jutsu' ? jutsuFamilyOf(card) : null;
  const traits = shortTraits(card, rank);

  const isJutsuFace = card.kind === 'jutsu' && !field;
  const isLor = card.kind === 'ninja';
  const isEquip = card.kind === 'equipamento';
  const isUnitPlate =
    card.kind === 'unidade' || card.kind === 'token' || card.kind === 'ninja';

  const showBandStats =
    (isCharacter && shownPower != null && shownVitality != null) || isEquip;
  const iconSz = field ? 15 : 19;

  const boxRef = useFitCardPanel(fitEnabled && !field, [
    card.id,
    rank,
    rules,
    traits,
    lvlCounter,
    pills.length,
    size,
  ]);

  const scaleClass =
    size === 'field'
      ? 'sc-v7o-scale--field'
      : size === 'zoom' || size === 'inspector'
        ? 'sc-v7o-scale--zoom'
        : size === 'collection'
          ? 'sc-v7o-scale--collection'
          : 'sc-v7o-scale--hand';

  const cardClasses = [
    'card6',
    field && 'field',
    isExclusiveJutsu && 'ex',
    isJutsuFace && 'jut',
    isJutsuFace && family === 'selo-ninjutsu' && 'fam-ninjutsu',
    isJutsuFace && family === 'selo-genjutsu' && 'fam-genjutsu',
    isJutsuFace && family === 'selo-taijutsu' && 'fam-taijutsu',
    isEquip && 'equip',
    isLor && 'lor',
    frame === 'gennin' && 'rank-gennin',
    frame === 'chuunin' && 'rank-chuunin',
    frame === 'jounnin' && 'rank-jounnin',
  ]
    .filter(Boolean)
    .join(' ');

  const bandClass = [
    'band',
    field && 'f',
    band.gold && 'gold',
    !band.gold && card.kind === 'token' && 'b-TOKEN',
    !band.gold && card.kind === 'ninja' && 'b-NINJA',
    !band.gold && card.kind === 'unidade' && 'b-UNIDADE',
    !band.gold && card.kind === 'jutsu' && 'b-JUTSU',
    !band.gold && card.kind === 'equipamento' && 'b-EQUIP',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={[
        'sc-v7o-scale',
        scaleClass,
        selected && 'is-selected',
        dimmed && 'is-dimmed',
        playable && 'is-playable',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-card-id={card.id}
      data-card-kind={card.kind}
      data-card-size={size}
    >
      <div className={cardClasses}>
        <div className="clip">
          <div className="art">
            <AnimePortrait
              card={card}
              evolved={rank >= 2}
              evolutionLevel={rank}
              className="sc-card__art-fill"
            />
          </div>
          <div className="shade" />

          <div
            className={bandClass}
            style={band.gold ? undefined : { background: band.color }}
          >
            {showBandStats && isEquip && (
              <>
                <div className="bst l">
                  <CardIcon id="poder" size={iconSz} />
                  <b>+{card.bonusAttack}</b>
                </div>
                <div className="bst r">
                  <b>+{card.bonusHealth}</b>
                  <CardIcon id="vida" size={iconSz} />
                </div>
              </>
            )}
            {showBandStats && isCharacter && shownPower != null && shownVitality != null && (
              <>
                <div className="bst l">
                  <CardIcon id="poder" size={iconSz} />
                  <b className={`sc-stat-${pState}`}>{shownPower}</b>
                </div>
                <div className="bst r">
                  <b className={`sc-stat-${vState}`}>{shownVitality}</b>
                  <CardIcon id="vida" size={iconSz} />
                </div>
              </>
            )}
            {band.gold && <CardIcon id="coroa" size={16} />}
            <span>{band.label}</span>
          </div>

          <div className="flow6">
            <div className="box" ref={boxRef}>
              {isUnitPlate && !isJutsuFace && !isEquip && (
                <>
                  <i className="rv a" />
                  <i className="rv b" />
                  <i className="rv c" />
                  <i className="rv d" />
                </>
              )}

              <div className="nm" style={{ fontSize: nameFontSize(card.name, field) }}>
                {card.name}
              </div>
              {/* Linha sob o nome (cor da família no jutsu; LoR esconde via CSS) */}
              <div className="rule" />

              {!field &&
                card.kind !== 'unidade' &&
                card.kind !== 'token' &&
                card.kind !== 'jutsu' &&
                traits && <div className="traits">{traits}</div>}

              {isJutsuFace && card.kind === 'jutsu' && (
                <div className="pill">
                  <CardIcon id={speedPill(card.speed).id} size={18} />
                  <span>{speedPill(card.speed).label}</span>
                </div>
              )}

              {(card.kind === 'ninja' ||
                card.kind === 'unidade' ||
                card.kind === 'token') && (
                <KeywordRow pills={pills} field={field} />
              )}

              {!field && rules ? (
                <div
                  className="rules"
                  dangerouslySetInnerHTML={{ __html: formatRulesHtml(rules) }}
                />
              ) : null}

              {!field && signatureOwner && (
                <div className="cap">Jutsu Exclusivo de {signatureOwner.name}</div>
              )}

              {!field && card.kind === 'ninja' && lvlCounter && (
                <>
                  <div className="lvlbar">
                    <i />
                    <b>SUBIR DE NÍVEL</b>
                    <i />
                  </div>
                  <div className="req">{lvlCounter}</div>
                </>
              )}
            </div>
          </div>

          {isJutsuFace && <div className="gemabs">{SHUR_GEM}</div>}
        </div>

        <div className="cost" title="Custo de Chakra">
          <CardIcon id="orbe-chakra" size={field ? 44 : 64} className="orb" />
          <b>{cost}</b>
        </div>

        {isEquip ? (
          <EquipSeal field={field} />
        ) : family && isJutsuFace ? (
          <FamilySeal family={family} field={field} />
        ) : (
          <ShinobiSeal field={field} />
        )}
      </div>
    </div>
  );
};

export default CardFace;
