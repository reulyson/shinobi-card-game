import React, { useEffect, useState } from 'react';
import { X, EyeOff } from 'lucide-react';
import {
  BoardUnit,
  CardDef,
  getKeywordLabel,
  isOcultoJutsu,
  Keyword,
  SPEED_DISPLAY_NAME,
  SPEED_FULL_LABEL,
} from '../../types/game';
import {
  extractCardTextTerms,
  KEYWORD_SHORT_HELP,
  STATUS_SHORT_HELP,
  TermCategory,
} from '../../data/keywordHelp';
import { KEYWORD_VISUALS } from '../../data/keywordVisuals';
import { getUnitHealth, getUnitPower } from '../../engine/battleEngine';
import { CardFace } from '../card/CardFace';
import { CardIcon } from '../card/CardIcon';
import { CardIconId, keywordIconId } from '../card/theme';

interface CardInspectorProps {
  card: CardDef | null;
  unit?: BoardUnit;
  onClose?: () => void;
  /** Memória de patente do dono (Ninja na mão): patente/progresso salvos e custo para jogar. */
  savedRank?: { level: 1 | 2 | 3; progress: number; target: number; cost: number };
  /** Modo compacto para o painel lateral esquerdo (214×588) durante a batalha. */
  compact?: boolean;
}

interface TermChip {
  key: string;
  label: string;
  help: string;
  iconId?: CardIconId | null;
  lucideIcon?: React.ComponentType<{ className?: string }>;
}

const GROUP_META: Record<
  TermCategory,
  { title: string; badgeCls: string; headerCls: string }
> = {
  keyword: {
    title: 'Palavra-chave',
    badgeCls: 'border-amber-500/45 bg-amber-950/60 text-amber-200',
    headerCls: 'text-amber-300',
  },
  status: {
    title: 'Status',
    badgeCls: 'border-violet-500/45 bg-violet-950/60 text-violet-200',
    headerCls: 'text-violet-300',
  },
  trigger: {
    title: 'Gatilho',
    badgeCls: 'border-emerald-500/45 bg-emerald-950/60 text-emerald-200',
    headerCls: 'text-emerald-300',
  },
  action: {
    title: 'Ação',
    badgeCls: 'border-orange-500/45 bg-orange-950/60 text-orange-200',
    headerCls: 'text-orange-300',
  },
};

export const CardInspector: React.FC<CardInspectorProps> = ({
  card,
  unit,
  onClose,
  savedRank,
  compact = false,
}) => {
  const startRank = (unit?.evolutionLevel ?? savedRank?.level ?? 1) as 1 | 2 | 3;
  const [previewRank, setPreviewRank] = useState<1 | 2 | 3>(startRank);

  useEffect(() => {
    setPreviewRank(startRank);
  }, [card?.id, startRank]);

  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
        <p className="text-xs leading-relaxed">
          Clique em qualquer carta no Grimório/Deck ou passe o cursor em batalha para ver os detalhes e os termos usados nela.
        </p>
      </div>
    );
  }

  const isCharacter =
    card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token';
  const activeRank: 1 | 2 | 3 = card.kind === 'ninja' ? previewRank : 1;
  const subtitleLabel =
    card.kind === 'ninja'
      ? `Ninja · ${card.role}`
      : card.kind === 'unidade'
        ? `Unidade · ${card.role}`
        : card.kind === 'token'
          ? `Token · ${card.role}`
          : card.kind === 'jutsu'
            ? `Jutsu · ${SPEED_DISPLAY_NAME[card.speed]}${card.family ? ` · ${card.family}` : ''} · ${card.category}`
            : 'Equipamento Ninja';

  const previewAttack =
    card.kind === 'ninja'
      ? unit && previewRank === unit.evolutionLevel
        ? getUnitPower(unit)
        : activeRank === 3
          ? card.jounninAttack
          : activeRank === 2
            ? card.chuuninAttack
            : card.attack
      : isCharacter
        ? unit
          ? getUnitPower(unit)
          : card.attack
        : 0;
  const previewHealth =
    card.kind === 'ninja'
      ? unit && previewRank === unit.evolutionLevel
        ? getUnitHealth(unit)
        : activeRank === 3
          ? card.jounninHealth
          : activeRank === 2
            ? card.chuuninHealth
            : card.health
      : isCharacter
        ? unit
          ? getUnitHealth(unit)
          : card.health
        : 0;

  const rankKeywords: Keyword[] = !isCharacter
    ? []
    : unit && (card.kind !== 'ninja' || previewRank === unit.evolutionLevel)
      ? unit.keywords
      : card.kind === 'ninja'
        ? activeRank === 3
          ? card.jounninKeywords
          : activeRank === 2
            ? card.chuuninKeywords
            : card.keywords
        : card.keywords;

  const abilityText =
    card.kind === 'ninja'
      ? activeRank === 3
        ? card.jounninAbilityText
        : activeRank === 2
          ? card.chuuninAbilityText
          : card.abilityText
      : 'effectText' in card
        ? card.effectText
        : card.abilityText;

  const visibleAbilityText = abilityText
    .trim()
    .replace(/^(Sem baixada|Sem entrada)\.\s*/i, '')
    .replace(/^Passiva:\s*nenhuma\b.*$/i, '')
    .trim();

  const visibleLevelUpText =
    card.kind === 'ninja' && activeRank < (card.maxRank ?? 3)
      ? activeRank === 1
        ? card.levelUpCondition
        : card.chuuninLevelUpCondition
      : '';

  // Termo de velocidade exibido na carta (apenas Jutsu)
  const metaChips: { key: string; label: string; help: string; icon?: React.ComponentType<{ className?: string }>; cls: string }[] = [];
  if (card.kind === 'jutsu') {
    const isOculta = card.speed === 'Oculta';
    metaChips.push({
      key: 'speed',
      label: SPEED_DISPLAY_NAME[card.speed],
      icon: isOculta ? EyeOff : undefined,
      help: (() => {
        if (isOculta && card.triggerType) {
          return 'Jogada virada para baixo; ativa no gatilho. Máx. 3 em jogo.';
        }
        const h = SPEED_FULL_LABEL[card.speed].split('—')[1]?.trim() ?? '';
        return h ? h.charAt(0).toUpperCase() + h.slice(1) + '.' : '';
      })(),
      cls: isOculta
        ? 'border-purple-500/50 bg-purple-950/50 text-purple-200'
        : 'border-sky-500/50 bg-sky-950/50 text-sky-200',
    });
  }

  // 4 grupos coloridos: Palavra-chave, Status, Gatilho, Ação
  const kwList: Keyword[] = card.kind === 'equipamento' ? card.grantedKeywords : rankKeywords;
  const grouped: Record<TermCategory, TermChip[]> = {
    keyword: [],
    status: [],
    trigger: [],
    action: [],
  };
  const seenByGroup: Record<TermCategory, Set<string>> = {
    keyword: new Set(),
    status: new Set(),
    trigger: new Set(),
    action: new Set(),
  };

  const pushTerm = (cat: TermCategory, chip: TermChip) => {
    const dedupKey = chip.label.toLowerCase();
    if (seenByGroup[cat].has(dedupKey)) return;
    seenByGroup[cat].add(dedupKey);
    grouped[cat].push(chip);
  };

  for (const kw of kwList) {
    const vis = KEYWORD_VISUALS[kw];
    pushTerm('keyword', {
      key: `kw-${kw}`,
      label: getKeywordLabel(kw),
      help: KEYWORD_SHORT_HELP[kw] ?? '',
      iconId: keywordIconId(kw),
      lucideIcon: vis?.icon,
    });
  }

  if (unit) {
    const st: [boolean, keyof typeof STATUS_SHORT_HELP][] = [
      [unit.stunned, 'stunned'],
      [unit.frozen, 'frozen'],
      [unit.silenced, 'silenced'],
      [unit.hasBarrier, 'barrier'],
      [unit.hasSpellShield, 'spellShield'],
      [(unit.genjutsu ?? 0) > 0, 'genjutsu'],
      [(unit.poison ?? 0) > 0, 'poison'],
      [Boolean(unit.formationActive), 'formation'],
      [Boolean(unit.partnerOfUid), 'partner'],
      [(unit.gloomStacks ?? 0) > 0, 'exhausted'],
    ];
    for (const [on, k] of st) {
      if (!on) continue;
      const base = STATUS_SHORT_HELP[k];
      const label =
        k === 'poison'
          ? `${base.label} (${unit.poison})`
          : k === 'exhausted'
            ? `${base.label} (-${unit.gloomStacks}/-${unit.gloomStacks})`
            : base.label;
      pushTerm('status', {
        key: `st-${k}`,
        label,
        help: base.help,
      });
    }
    if (unit.tempAttackBonus !== 0 || unit.tempHealthBonus !== 0) {
      const a = unit.tempAttackBonus;
      const h = unit.tempHealthBonus;
      pushTerm('status', {
        key: 'st-temp',
        label: `${a >= 0 ? `+${a}` : a}/${h >= 0 ? `+${h}` : h} na rodada`,
        help: 'Modificador temporário aplicado até o fim da rodada.',
      });
    }
  }

  const extracted = extractCardTextTerms({
    text: visibleAbilityText,
    levelUpText: visibleLevelUpText,
    existingKeywords: kwList,
    ocultoTrigger: card.kind === 'jutsu' ? card.triggerType : undefined,
  });
  for (const item of extracted) {
    const vis = item.keyword ? KEYWORD_VISUALS[item.keyword] : undefined;
    pushTerm(item.category, {
      key: item.key,
      label: item.label,
      help: item.help,
      iconId: item.keyword ? keywordIconId(item.keyword) : null,
      lucideIcon: vis?.icon,
    });
  }

  const scaleFactor = compact ? 0.72 : 0.86;
  const scaledWidth = Math.round(312 * scaleFactor);
  const scaledHeight = Math.round(438 * scaleFactor);

  return (
    <div className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3.5'} text-slate-100`}>
      <div className={`flex items-start justify-between gap-2 ${compact ? 'min-h-[40px]' : 'min-h-[52px]'} shrink-0`}>
        <div className="min-w-0">
          <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-slate-400 truncate`}>
            {card.faction} · {subtitleLabel}
          </div>
          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white leading-tight truncate`}>
            {card.name}
          </h3>
          {isCharacter && (
            <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-amber-300/90 truncate`}>
              {card.kind === 'ninja'
                ? activeRank === 3
                  ? card.jounninTitle
                  : activeRank === 2
                    ? card.chuuninTitle
                    : card.title
                : card.title}
            </div>
          )}
          {!isCharacter && (
            <div className={`${compact ? 'text-[11px]' : 'text-xs'} text-slate-500 truncate`}>
              {card.kind === 'jutsu'
                ? isOcultoJutsu(card)
                  ? 'Jutsu · Oculto'
                  : 'Jutsu'
                : 'Equipamento'}
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Fechar inspetor"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Carta v7o (zoom/detalhe) */}
      <div className={`relative flex justify-center shrink-0 ${compact ? 'pt-1 pb-1' : 'py-1'} overflow-visible`}>
        <div className="relative overflow-visible" style={{ width: scaledWidth, height: scaledHeight }}>
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${scaleFactor})`,
              width: 312,
              height: 438,
            }}
          >
            <CardFace
              card={card}
              unit={unit}
              size="zoom"
              rankLevel={activeRank}
              effectiveCost={savedRank && savedRank.level > 1 ? savedRank.cost : card.cost}
              power={isCharacter ? previewAttack : undefined}
              vitality={isCharacter ? previewHealth : undefined}
              levelProgress={
                unit && previewRank === unit.evolutionLevel
                  ? unit.evolutionProgress
                  : savedRank && savedRank.level === previewRank
                    ? savedRank.progress
                    : 0
              }
            />
          </div>
        </div>
      </div>

      {card.kind === 'ninja' && (
        <div
          className={`grid ${(card.maxRank ?? 3) === 3 ? 'grid-cols-3' : (card.maxRank ?? 3) === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 ${compact ? 'text-[11px]' : 'text-xs'} font-semibold`}
        >
          {([
            { rank: 1 as const, label: 'Gennin' },
            { rank: 2 as const, label: 'Chuunin' },
            { rank: 3 as const, label: 'Jounnin' },
          ])
            .filter((tier) => tier.rank <= (card.maxRank ?? 3))
            .map((tier) => {
              const isActive = previewRank === tier.rank;
              return (
                <button
                  key={tier.rank}
                  type="button"
                  onClick={() => setPreviewRank(tier.rank)}
                  className={`${compact ? 'py-1 px-1.5' : 'py-1.5 px-2'} rounded-md border transition-colors ${
                    isActive
                      ? tier.rank === 3
                        ? 'bg-orange-950/60 border-orange-400 text-orange-200'
                        : tier.rank === 2
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-sky-950/60 border-sky-400 text-sky-200'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier.label}
                </button>
              );
            })}
        </div>
      )}

      {/* Termo de velocidade do Jutsu */}
      {metaChips.length > 0 && (
        <ul className="space-y-1.5" aria-label="Velocidade do Jutsu">
          {metaChips.map((chip) => {
            const Icon = chip.icon;
            return (
              <li key={chip.key} className={`flex items-start gap-1.5 ${compact ? 'text-[11px]' : 'text-xs'} leading-snug`}>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-semibold whitespace-nowrap ${chip.cls}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {chip.label}
                </span>
                <span className="text-slate-300 pt-0.5">{chip.help}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* 4 grupos coloridos: Palavra-chave, Status, Gatilho, Ação */}
      {(['keyword', 'status', 'trigger', 'action'] as const).map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        const meta = GROUP_META[cat];
        return (
          <div key={cat} className="space-y-1.5">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${meta.headerCls}`}>
              {meta.title}
            </div>
            <ul className="space-y-1.5" aria-label={meta.title}>
              {list.map((chip) => {
                const LucideIcon = chip.lucideIcon;
                return (
                  <li
                    key={chip.key}
                    className={`flex items-start gap-1.5 ${compact ? 'text-[11px]' : 'text-xs'} leading-snug`}
                  >
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-semibold whitespace-nowrap ${meta.badgeCls}`}
                    >
                      {chip.iconId ? (
                        <CardIcon id={chip.iconId} size={12} />
                      ) : LucideIcon ? (
                        <LucideIcon className="w-3 h-3" />
                      ) : null}
                      {chip.label}
                    </span>
                    <span className="text-slate-300 pt-0.5">{chip.help}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
