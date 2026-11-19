import React from 'react';
import { BoardUnit, CardDef } from '../../types/game';
import { getSignatureOwner, SIGNATURE_JUTSU_IDS } from '../../data/cards';
import { NINJA_CREATED_ONLY_IDS } from '../../data/ninjaExtras';
import { getUnitHealth, getUnitPower } from '../../engine/battleEngine';
import { AnimePortrait } from '../AnimePortrait';
import { CardIcon } from './CardIcon';
import { StatPlaque } from './StatPlaque';
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
import './card-v7o.css';

export type CardFaceSize = 'hand' | 'field' | 'zoom' | 'collection' | 'inspector';

export interface CardFaceProps {
  card: CardDef;
  unit?: BoardUnit;
  size?: CardFaceSize;
  /** Custo efetivo (descontos). */
  effectiveCost?: number;
  /** Override de poder exibido (prévia de combate). */
  power?: number;
  /** Override de vitalidade exibida (prévia de combate). */
  vitality?: number;
  /** Estado de cor do poder; se omitido, compara com a base. */
  powerState?: StatColorState;
  /** Estado de cor da vitalidade; se omitido, compara com a base. */
  vitalityState?: StatColorState;
  /** Patente visual (ninja); padrão = unit.evolutionLevel ou 1. */
  rankLevel?: 1 | 2 | 3;
  /** Contador de level-up atual. */
  levelProgress?: number;
  selected?: boolean;
  dimmed?: boolean;
  playable?: boolean;
  className?: string;
  /** Força faixa dourada de Jutsu Exclusivo. */
  exclusive?: boolean;
  /** Força faixa verde “criada por carta”. */
  createdByCard?: boolean;
}

function abilityTextFor(card: CardDef, rank: 1 | 2 | 3): string {
  switch (card.kind) {
    case 'ninja':
      if (rank === 3) return card.jounninAbilityText;
      if (rank === 2) return card.chuuninAbilityText;
      return card.abilityText;
    case 'unidade':
    case 'token':
      return card.abilityText;
    case 'jutsu':
    case 'armadilha':
    case 'equipamento':
      return card.effectText;
    default: {
      const _never: never = card;
      void _never;
      return '';
    }
  }
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

/** Destaca gatilhos já presentes no texto; não inventa conteúdo. */
function formatRulesHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /\b(Entrada|Passiva|Último Desejo|Teimosia|Início da rodada|Sharingan|Selo Amaldiçoado|Ao abater|Quando|Enquanto|Remova|Cause|Aplique|O portador ganha)\b/g,
      '<em>$1</em>',
    );
}

function FamilySeal({ family }: { family: ReturnType<typeof jutsuFamilyOf> }) {
  const labels: Record<typeof family, [string, string]> = {
    'selo-ninjutsu': ['忍', '術'],
    'selo-genjutsu': ['幻', '術'],
    'selo-taijutsu': ['体', '術'],
  };
  const [a, b] = labels[family];
  return (
    <div className="sc-seal-family" title={family}>
      <span>{a}</span>
      <span>{b}</span>
      <i className="sc-hanko" />
    </div>
  );
}

function ShinobiSeal() {
  return (
    <div className="sc-seal-starburst" title="Shinobi">
      <span className="sc-kanji">忍</span>
    </div>
  );
}

function EquipSeal() {
  return (
    <div className="sc-seal-starburst" title="Equipamento" style={{ background: 'radial-gradient(circle at 35% 30%, #E5E7EB, #4B5563)', borderColor: '#1F2937' }}>
      <span className="sc-kanji" style={{ color: '#111827' }}>武</span>
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
  if (field || pills.length === 0) return null;
  if (pills.length === 1) {
    const p = pills[0];
    return (
      <div className="sc-pill">
        {p.id && <CardIcon id={p.id} size={14} />}
        <span>{p.label}</span>
      </div>
    );
  }
  return (
    <div className="sc-tiles">
      {pills.map((p, i) =>
        p.id ? (
          <div key={`${p.label}-${i}`} className="sc-tile" title={p.label}>
            <CardIcon id={p.id} size={14} />
          </div>
        ) : (
          <div key={`${p.label}-${i}`} className="sc-pill">
            <span>{p.label}</span>
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Face frontal v7o (LoR-champion para Ninja; pergaminho para Jutsu; compacta no campo).
 * Renderiza apenas textos já presentes em `CardDef` / `BoardUnit`.
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
  const rank = (rankLevel ?? unit?.evolutionLevel ?? 1) as 1 | 2 | 3;
  const frame: CardRankFrame = rankFrameOf(rank, card.kind);
  const cost = effectiveCost ?? card.cost;

  const isExclusiveJutsu =
    exclusive || (card.kind === 'jutsu' && SIGNATURE_JUTSU_IDS.has(card.id));
  const signatureOwner = isExclusiveJutsu && card.kind === 'jutsu' ? getSignatureOwner(card.id) : undefined;
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
  const pState = powerState ?? (shownPower != null ? compareStat(shownPower, basePower) : 'base');
  const vState =
    vitalityState ?? (shownVitality != null ? compareStat(shownVitality, baseVitality) : 'base');

  const kws = keywordsFor(card, unit, rank);
  const pills = keywordPills(kws);
  const rules = abilityTextFor(card, rank);
  const lvlCounter = levelUpCounter(
    card,
    rank,
    levelProgress ?? unit?.evolutionProgress,
  );
  const family = card.kind === 'jutsu' ? jutsuFamilyOf(card) : null;

  const sizeClass =
    size === 'field'
      ? 'sc-card--size-field'
      : size === 'zoom' || size === 'inspector'
        ? 'sc-card--size-zoom'
        : size === 'collection'
          ? 'sc-card--size-collection'
          : 'sc-card--size-hand';

  const kindClass =
    card.kind === 'ninja'
      ? 'sc-card--lor'
      : card.kind === 'jutsu' || card.kind === 'armadilha'
        ? 'sc-card--jutsu'
        : card.kind === 'equipamento'
          ? 'sc-card--equip'
          : 'sc-card--unit';

  const famClass =
    family === 'selo-ninjutsu'
      ? 'sc-card--fam-ninjutsu'
      : family === 'selo-genjutsu'
        ? 'sc-card--fam-genjutsu'
        : family === 'selo-taijutsu'
          ? 'sc-card--fam-taijutsu'
          : '';

  const rankClass =
    frame === 'gennin'
      ? 'sc-card--rank-gennin'
      : frame === 'chuunin'
        ? 'sc-card--rank-chuunin'
        : frame === 'jounnin'
          ? 'sc-card--rank-jounnin'
          : '';

  const costMod =
    cost < card.cost ? 'sc-card__cost--down' : cost > card.cost ? 'sc-card__cost--up' : '';

  const nameFontSize =
    card.name.length > 16
      ? field
        ? 9
        : 12
      : field
        ? 10
        : size === 'zoom' || size === 'inspector'
          ? 22
          : 15;

  return (
    <div
      className={[
        'sc-card',
        sizeClass,
        kindClass,
        famClass,
        rankClass,
        isExclusiveJutsu && 'sc-card--exclusive',
        field && 'sc-card--field',
        selected && 'sc-card--selected',
        dimmed && 'sc-card--dimmed',
        playable && 'sc-card--playable',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-card-id={card.id}
      data-card-kind={card.kind}
      data-card-size={size}
    >
      <div className="sc-card__clip">
        <div className="sc-card__art">
          <AnimePortrait
            card={card}
            evolved={rank >= 2}
            evolutionLevel={rank}
            className="sc-card__art-fill"
          />
        </div>
        <div className="sc-card__shade" />

        <div className="sc-card__flow">
          <div className="sc-card__box">
            <div className="sc-card__name" style={{ fontSize: nameFontSize }}>
              {card.name}
            </div>

            {!field && card.kind === 'ninja' && (
              <div className="sc-card__traits">{patenteLabel(rank)}</div>
            )}

            {!field && (card.kind === 'unidade' || card.kind === 'token') && (
              <>
                <div className="sc-card__rule" />
                {card.title ? (
                  <div className="sc-card__traits">{card.title.toUpperCase()}</div>
                ) : null}
              </>
            )}

            {!field && card.kind === 'equipamento' && (
              <>
                <div className="sc-card__rule" />
                <div className="sc-card__traits">
                  EQUIPAMENTO · +{card.bonusAttack}/+{card.bonusHealth}
                </div>
              </>
            )}

            {card.kind === 'jutsu' && !field && (
              <>
                <div className="sc-card__rule" />
                <div className="sc-pill-row">
                  <div className="sc-pill">
                    <CardIcon id={speedPill(card.speed).id} size={14} />
                    <span>{speedPill(card.speed).label}</span>
                  </div>
                </div>
              </>
            )}

            {card.kind === 'armadilha' && !field && (
              <>
                <div className="sc-card__rule" />
                <div className="sc-pill">
                  <CardIcon id="oculto" size={14} />
                  <span>OCULTO</span>
                </div>
              </>
            )}

            {(card.kind === 'ninja' ||
              card.kind === 'unidade' ||
              card.kind === 'token' ||
              card.kind === 'equipamento') && (
              <KeywordRow pills={pills} field={field} />
            )}

            {!field && rules ? (
              <div
                className="sc-card__rules"
                dangerouslySetInnerHTML={{ __html: formatRulesHtml(rules) }}
              />
            ) : null}

            {!field && signatureOwner && (
              <div className="sc-card__cap">Jutsu Exclusivo de {signatureOwner.name}</div>
            )}

            {!field && card.kind === 'ninja' && lvlCounter && (
              <>
                <div className="sc-lvlbar">
                  <i />
                  <b>SUBIR DE NÍVEL</b>
                  <i />
                </div>
                <div className="sc-card__req">{lvlCounter}</div>
              </>
            )}

            {isCharacter && shownPower != null && shownVitality != null && !field && (
              <div className="sc-inline-stats">
                <StatPlaque kind="power" value={shownPower} colorState={pState} />
                <StatPlaque kind="vitality" value={shownVitality} colorState={vState} />
              </div>
            )}
          </div>
        </div>

        <div
          className={`sc-card__band ${band.gold ? 'sc-card__band--gold' : ''}`}
          style={band.gold ? undefined : { background: band.color }}
        >
          {band.gold && <CardIcon id="coroa" size={12} />}
          <span>{band.label}</span>
        </div>
      </div>

      <div className={`sc-card__cost ${costMod}`} title="Custo de Chakra">
        <CardIcon id="orbe-chakra" size={field ? 32 : 48} />
        <b>{cost}</b>
      </div>

      <div className="sc-card__seal">
        {card.kind === 'equipamento' ? (
          <EquipSeal />
        ) : family ? (
          <FamilySeal family={family} />
        ) : (
          <ShinobiSeal />
        )}
      </div>

      {field && isCharacter && shownPower != null && shownVitality != null && (
        <>
          <StatPlaque kind="power" value={shownPower} colorState={pState} field />
          <StatPlaque kind="vitality" value={shownVitality} colorState={vState} field />
        </>
      )}
    </div>
  );
};

export default CardFace;
