import React, { useEffect, useState } from 'react';
import { Sparkles, X, Wrench, EyeOff } from 'lucide-react';
import {
  BoardUnit,
  CardDef,
  getKeywordLabel,
  isOcultoJutsu,
  Keyword,
  SPEED_DISPLAY_NAME,
  SPEED_FULL_LABEL,
} from '../types/game';
import { KEYWORD_SHORT_HELP, STATUS_SHORT_HELP, getTriggerHelp, splitAbilityText } from '../data/keywordHelp';
import { getRecurringAbilitiesForCard, mergeRecurringAbilityLines } from '../engine/recurringAbilities';
import { KEYWORD_VISUALS } from '../data/keywordVisuals';
import { getCardById, getNinjaDuplicateCardId, getNotDeckableReason } from '../data/cards';
import { getUnitHealth, getUnitPower } from '../engine/battleEngine';
import { CardFace } from './card/CardFace';

interface CardInspectorProps {
  card: CardDef | null;
  unit?: BoardUnit;
  onClose?: () => void;
  /** Memória de patente do dono (Ninja na mão): patente/progresso salvos e custo para jogar. */
  savedRank?: { level: 1 | 2 | 3; progress: number; target: number; cost: number };
}

export const CardInspector: React.FC<CardInspectorProps> = ({ card, unit, onClose, savedRank }) => {
  const startRank = (unit?.evolutionLevel ?? savedRank?.level ?? 1) as 1 | 2 | 3;
  const [previewRank, setPreviewRank] = useState<1 | 2 | 3>(startRank);

  useEffect(() => {
    setPreviewRank(startRank);
  }, [card?.id, startRank]);

  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
        <p className="text-xs leading-relaxed">
          Passe o cursor ou clique com o botão direito em qualquer carta para inspecionar atributos, palavras-chave, equipamentos e evolução.
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

  const equippedCard = unit?.equippedCardId ? getCardById(unit.equippedCardId) : undefined;
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

  // ── Blocos de leitura ──
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
  const chips: { key: string; label: string; help: string; icon?: React.ComponentType<{ className?: string }>; cls: string }[] = [];
  if (card.kind === 'jutsu') {
    const isOculta = card.speed === 'Oculta';
    chips.push({
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
    if (card.family) {
      chips.push({
        key: 'family',
        label: card.family,
        help: `Família ${card.family}.`,
        cls: 'border-slate-500/50 bg-slate-900/60 text-slate-200',
      });
    }
  }
  if (card.kind === 'equipamento') {
    chips.push({
      key: 'equip',
      label: `+${card.bonusAttack}/+${card.bonusHealth}`,
      icon: Wrench,
      help: 'Volta à mão quando o portador sai. Desligado se ele estiver Selado.',
      cls: 'border-cyan-500/50 bg-cyan-950/50 text-cyan-200',
    });
  }
  const kwList: Keyword[] = card.kind === 'equipamento' ? card.grantedKeywords : rankKeywords;
  for (const kw of kwList) {
    const vis = KEYWORD_VISUALS[kw];
    chips.push({
      key: `kw-${kw}`,
      label: getKeywordLabel(kw),
      help: KEYWORD_SHORT_HELP[kw] ?? '',
      icon: vis?.icon,
      cls: `border-slate-600 bg-slate-900 ${vis?.color ?? 'text-amber-200'}`,
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
    ];
    for (const [on, k] of st) {
      if (!on) continue;
      chips.push({
        key: `st-${k}`,
        label: k === 'poison' ? `${STATUS_SHORT_HELP[k].label} (${unit.poison})` : STATUS_SHORT_HELP[k].label,
        help: STATUS_SHORT_HELP[k].help,
        cls: 'border-rose-500/50 bg-rose-950/50 text-rose-200',
      });
    }
  }
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
  // Habilidades recorrentes (Grupo 4) dos dados que o texto ainda não descreve.
  const recurringAbilities = isCharacter
    ? unit?.silenced
      ? []
      : getRecurringAbilitiesForCard(card.id, activeRank, unit?.equippedCardId)
    : card.kind === 'equipamento'
      ? card.recurring ?? []
      : [];
  const abilityLines = mergeRecurringAbilityLines(splitAbilityText(abilityText), recurringAbilities);
  const flavor =
    card.kind === 'jutsu' || card.kind === 'equipamento' ? card.flavorText : undefined;

  return (
    <div className="flex flex-col gap-3 text-slate-100">
      <div className="flex items-start justify-between gap-2 h-[50px] shrink-0">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 truncate">
            {card.faction} · {subtitleLabel}
          </div>
          <h3 className="text-sm font-bold text-white leading-tight truncate">{card.name}</h3>
          {isCharacter && (
            <div className="text-[11px] text-amber-300/90 truncate">
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
            <div className="text-[11px] text-slate-500 truncate">
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
      <div className="relative flex justify-center shrink-0 py-2 overflow-visible">
        <div className="origin-top" style={{ transform: 'scale(0.72)', height: 315 }}>
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

      {card.kind === 'ninja' && (
        <div className={`grid ${(card.maxRank ?? 3) === 3 ? 'grid-cols-3' : (card.maxRank ?? 3) === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 text-[11px] font-semibold`}>
          {([
            { rank: 1 as const, label: 'Gennin' },
            { rank: 2 as const, label: 'Chuunin' },
            { rank: 3 as const, label: 'Jounnin' },
          ]).filter((tier) => tier.rank <= (card.maxRank ?? 3)).map((tier) => {
            const isActive = previewRank === tier.rank;
            return (
              <button
                key={tier.rank}
                type="button"
                onClick={() => setPreviewRank(tier.rank)}
                className={`py-1 px-2 rounded-md border transition-colors ${
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

      {/* (1) Palavras-chave / tipo: chips com explicação de 1 linha */}
      {chips.length > 0 && (
        <ul className="space-y-1" aria-label="Palavras-chave">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <li key={chip.key} className="flex items-start gap-2 text-[11px] leading-snug">
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

      {/* (2) Habilidade: gatilho em negrito + frases curtas */}
      <div className="rounded-md bg-slate-900/80 border border-slate-800 px-2.5 py-2 text-xs">
        {abilityLines.length > 0 ? (
          <ul className="space-y-1">
            {abilityLines.map((line, i) => (
              <li key={i} className="text-slate-100 leading-snug" title={getTriggerHelp(line.trigger)}>
                {line.trigger && <strong className="text-amber-200 font-bold">{line.trigger}: </strong>}
                {line.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-[11px]">Sem habilidade além das palavras-chave.</p>
        )}
        {equippedCard && equippedCard.kind === 'equipamento' && (
          <p className={`mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] ${unit?.silenced ? 'text-slate-500' : 'text-cyan-200'}`}>
            <Wrench className="inline w-3 h-3 mr-1" />
            Equipado: {equippedCard.name} (+{equippedCard.bonusAttack}/+{equippedCard.bonusHealth})
            {unit?.silenced ? ' — desligado enquanto Selado' : ''}
          </p>
        )}
      </div>

      {/* (4) Promoção recolhível (Ninjas) */}
      {card.kind === 'ninja' && (
        <div className="space-y-1.5 text-[11px]">
          {([
            { from: 1, to: 'Chuunin', cond: card.levelUpCondition, cls: 'border-amber-500/40 text-amber-200' },
            { from: 2, to: 'Jounnin', cond: card.chuuninLevelUpCondition, cls: 'border-orange-500/40 text-orange-200' },
          ] as const).filter((step) => step.from < (card.maxRank ?? 3)).map((step) => {
            const current = unit?.evolutionLevel === step.from;
            const done = (unit?.evolutionLevel ?? 1) > step.from;
            return (
              <details key={step.to} className={`rounded-md border bg-slate-900/60 ${step.cls}`} open={current}>
                <summary className="cursor-pointer select-none px-2.5 py-1.5 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Promoção → {step.to}
                  </span>
                  <span className="font-mono-num text-slate-300">
                    {done
                      ? 'concluída'
                      : current && unit
                        ? `${Math.min(unit.evolutionProgress, unit.evolutionTarget)}/${unit.evolutionTarget}`
                        : ''}
                  </span>
                </summary>
                <p className="px-2.5 pb-2 text-slate-200 leading-snug">{step.cond}</p>
              </details>
            );
          })}
          {(card.maxRank ?? 3) < 3 && (
            <p className="px-1 text-slate-400 leading-snug">
              Patente máxima: {(card.maxRank ?? 3) === 1 ? 'Gennin (não é promovido)' : 'Chuunin'}.
            </p>
          )}
          {savedRank && savedRank.level > 1 && (
            <div data-saved-rank-info="1" className="rounded-md border border-emerald-400/50 bg-emerald-950/40 px-2.5 py-1.5 text-emerald-100 leading-snug">
              <strong className="text-emerald-300">★ Patente salva: {savedRank.level === 3 ? 'Jounnin' : 'Chuunin'}</strong>
              {savedRank.level < 3 && savedRank.target ? ` (progresso ${savedRank.progress}/${savedRank.target})` : ''}. A próxima
              cópia entra já nessa patente, pagando <strong>{savedRank.cost}</strong> de Chakra principal.
            </div>
          )}
          <details className="rounded-md border border-rose-500/30 bg-rose-950/20 text-rose-100/90">
            <summary className="cursor-pointer select-none px-2.5 py-1.5 font-semibold text-rose-300">
              Ninja Único
            </summary>
            <p className="px-2.5 pb-2 leading-snug">
              Só 1 {card.name} em campo; a outra cópia só pode ser jogada depois que ele morrer (enquanto ele está em campo, a cópia vira o Exclusivo). Custa só Chakra principal e entra como Gennin, ou na patente salva (pagando o custo daquela patente). {card.signatureJutsuId ? (
                <>
                  Ao entrar, cria{' '}
                  <strong className="text-amber-200">{getCardById(card.signatureJutsuId)?.name || 'o Jutsu Exclusivo'}</strong>{' '}
                  na sua mão.
                </>
              ) : (
                <>Não tem Jutsu Exclusivo.</>
              )}{' '}
              Cópias repetidas viram{' '}
              <strong className="text-amber-200">
                {getCardById(getNinjaDuplicateCardId(card))?.name || 'o Jutsu Exclusivo'}
              </strong>
              .
            </p>
          </details>
        </div>
      )}

      {getNotDeckableReason(card) && (
        <p className="text-[11px] text-rose-300/90 leading-snug">{getNotDeckableReason(card)}</p>
      )}

      {/* (3) Flavor: itálico menor, separado */}
      {flavor && (
        <p className="pt-2 border-t border-slate-800 text-[10.5px] italic text-slate-400 leading-snug">{flavor}</p>
      )}
    </div>
  );
};
