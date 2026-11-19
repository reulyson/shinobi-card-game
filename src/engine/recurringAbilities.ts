/**
 * Habilidades recorrentes (Parte 5 · Grupo 4).
 *
 * Motor genérico de gatilhos que disparam várias vezes na partida:
 * Início da rodada · Fim da rodada · Investida (ao atacar) · Ao bloquear · Ao golpear ·
 * Ao conjurar · Vingança (aliado morre) · Repouso (não agiu) · Último Desejo (ao morrer).
 *
 * As habilidades ficam nos dados das cartas (`recurring` por patente no Ninja, lista na
 * Unidade/Token e no Equipamento, para o portador). Os alvos são automáticos.
 * Unidades Seladas não disparam. Efeitos negativos de alvo único ou em área contra
 * inimigos são anulados por Contra-Jutsu (consome o escudo).
 * Este módulo não processa mortes: quem chama roda `processBoardDeaths` depois.
 */
import { getCardById, TOKEN_CARDS } from '../data/cards';
import {
  ArenaId,
  BattleLogEntry,
  BoardUnit,
  CombatVisualFX,
  KEYWORD_DISPLAY_NAME,
  NinjaCardDef,
  PlayerState,
  RECURRING_TRIGGER_LABEL,
  RecurringAbility,
  RecurringCondition,
  RecurringEffect,
  RecurringTarget,
  RecurringTrigger,
} from '../types/game';
import {
  applyDamageToUnit,
  createBoardUnit,
  drawCards,
  evolveUnitIfReady,
  getUnitHealth,
  getUnitPower,
  healUnit,
  nextUid,
} from './battleEngine';

export const RECURRING_TRIGGERS: readonly RecurringTrigger[] = [
  'inicio_rodada',
  'fim_rodada',
  'ao_atacar',
  'ao_bloquear',
  'ao_golpear',
  'ao_conjurar',
  'vinganca',
  'repouso',
  'ultimo_desejo',
];

const MAX_BOARD = 5;
const MAX_HAND = 9;
const MAX_RESERVE = 3;

/** Habilidades recorrentes ativas da unidade (patente atual + Equipamento). Selado = nenhuma. */
export function getRecurringAbilities(unit: BoardUnit): RecurringAbility[] {
  if (unit.silenced) return [];
  return getRecurringAbilitiesForCard(unit.cardId, unit.evolutionLevel, unit.equippedCardId);
}

/** Habilidades recorrentes de uma carta numa patente (sem estado de campo). */
export function getRecurringAbilitiesForCard(
  cardId: string,
  level: 1 | 2 | 3 = 1,
  equippedCardId?: string | null
): RecurringAbility[] {
  const out: RecurringAbility[] = [];
  const def = getCardById(cardId);
  if (def?.kind === 'ninja') out.push(...(def.recurring?.[level] ?? []));
  else if (def && (def.kind === 'unidade' || def.kind === 'token')) out.push(...(def.recurring ?? []));
  if (equippedCardId) {
    const eq = getCardById(equippedCardId);
    if (eq?.kind === 'equipamento') out.push(...(eq.recurring ?? []));
  }
  return out;
}

export function hasRecurringTrigger(unit: BoardUnit, trigger: RecurringTrigger): boolean {
  return getRecurringAbilities(unit).some((a) => a.trigger === trigger);
}

// ---------------------------------------------------------------------------
// Texto (pt-BR)
// ---------------------------------------------------------------------------

const TARGET_TEXT: Record<RecurringTarget, string> = {
  self: 'esta unidade',
  combat_enemy: 'o inimigo em combate',
  strongest_enemy: 'o inimigo mais forte',
  weakest_enemy: 'o inimigo mais fraco',
  random_enemy: 'um inimigo aleatório',
  all_enemies: 'todos os inimigos',
  most_injured_ally: 'o aliado mais ferido',
  weakest_ally: 'o aliado mais fraco',
  all_allies: 'todos os aliados',
  other_allies: 'os outros aliados',
};

/** Contrações do português: a+o=ao, de+o=do, em+o=no (e plurais). */
function prep(p: 'a' | 'de' | 'em', target: RecurringTarget): string {
  const t = TARGET_TEXT[target];
  if (t.startsWith('esta ')) return `${p === 'a' ? 'a ' : p === 'de' ? 'd' : 'n'}${t}`;
  const m = t.match(/^(os|o) (.*)$/);
  if (!m) return `${p} ${t}`;
  const art = m[1];
  const joined = p === 'a' ? `a${art}` : p === 'de' ? `d${art}` : `n${art}`;
  return `${joined} ${m[2]}`;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function describeRecurringEffect(e: RecurringEffect): string {
  switch (e.type) {
    case 'buff':
      return `${TARGET_TEXT[e.target]} ${e.target === 'all_allies' || e.target === 'all_enemies' || e.target === 'other_allies' ? 'ganham' : 'ganha'} ${signed(e.attack)}/${signed(e.health)}${
        e.permanent ? '' : ' nesta rodada'
      }`;
    case 'damage':
      return `cause ${e.amount} de dano ${prep('a', e.target)}`;
    case 'heal':
      return `cure ${e.amount} ${prep('de', e.target)}`;
    case 'stun':
      return `paralise ${TARGET_TEXT[e.target]}`;
    case 'chakra_block':
      return `aplique Bloqueio de Chakra ${prep('em', e.target)}`;
    case 'barrier':
      return `${TARGET_TEXT[e.target]} ${e.target === 'all_allies' || e.target === 'other_allies' || e.target === 'all_enemies' ? 'ganham' : 'ganha'} Substituição`;
    case 'gate_damage':
      return `cause ${e.amount} de dano ao Portão rival`;
    case 'gate_heal':
      return `cure ${e.amount} do seu Portão`;
    case 'draw':
      return e.amount === 1 ? 'compre 1 carta' : `compre ${e.amount} cartas`;
    case 'reserve':
      return `ganhe ${e.amount} de Reserva`;
    case 'drain_reserve':
      return `o rival perde ${e.amount} de Reserva`;
    case 'summon':
      return `invoque ${getCardById(e.tokenId)?.name ?? 'um Token'}`;
    case 'progress':
      return `+${e.amount} de progresso de Promoção`;
    case 'gain_keyword':
      return `${TARGET_TEXT[e.target]} ganha ${KEYWORD_DISPLAY_NAME[e.keyword] ?? e.keyword} nesta rodada`;
    case 'pay_gate':
      return `pague ${e.amount} de Vida do seu Portão`;
  }
}

function describeCondition(c?: RecurringCondition): string {
  if (!c) return '';
  const parts: string[] = [];
  if (c.minAllies) parts.push(`com ${c.minAllies}+ aliados em campo`);
  if (c.allyCardId) parts.push(`com ${getCardById(c.allyCardId)?.name ?? 'o aliado'} em campo`);
  if (c.allyFaction) parts.push(`com outro aliado do ${c.allyFaction}`);
  if (c.selfDamaged) parts.push('se esta unidade estiver ferida');
  if (c.attackingAlone) parts.push('se atacar sozinha');
  if (c.allyNinjaFaction) parts.push(`com um Ninja do ${c.allyNinjaFaction} em campo`);
  if (c.minOwnGate) parts.push(`com o Portão acima de ${c.minOwnGate}`);
  return parts.length ? `${parts.join(' e ')}, ` : '';
}

const capitalize = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/** Texto do efeito sem o gatilho ("cause 1 de dano ao inimigo mais forte."). */
export function describeRecurringAbilityBody(a: RecurringAbility): string {
  if (a.text) return a.text;
  const parts = a.effects.map(describeRecurringEffect);
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts.join('');
  const body = capitalize(describeCondition(a.condition) + joined);
  return `${body}${a.oncePerRound ? ' (1 vez por rodada)' : ''}.`;
}

/** Linha completa: "Início da rodada: Cause 1 de dano ao inimigo mais forte." */
export function describeRecurringAbility(a: RecurringAbility): string {
  return `${RECURRING_TRIGGER_LABEL[a.trigger]}: ${describeRecurringAbilityBody(a)}`;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

export interface RecurringRunOptions {
  round: number;
  arenaId: ArenaId;
  /** Só estas unidades do dono disparam (ex.: atacantes declarados). Padrão: todas. */
  sourceUids?: string[];
  /** Unidade que disparou fora do campo (Último Desejo: a unidade que morreu). */
  sourceUnit?: BoardUnit;
  /** Inimigo em combate (Ao bloquear / Ao golpear). */
  combatEnemyUid?: string;
  /** Quantos atacantes foram declarados (condição "atacar sozinha"). */
  attackerCount?: number;
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void;
  fx?: CombatVisualFX;
  logs?: BattleLogEntry[];
}

export interface RecurringRunResult {
  owner: PlayerState;
  opp: PlayerState;
  logs: BattleLogEntry[];
  /** Quantas habilidades dispararam. */
  fired: number;
}

const alive = (u: BoardUnit) => getUnitHealth(u) > 0;

function conditionMet(
  c: RecurringCondition | undefined,
  source: BoardUnit,
  owner: PlayerState,
  opts?: RecurringRunOptions
): boolean {
  if (!c) return true;
  if (c.attackingAlone && opts?.attackerCount !== 1) return false;
  if (c.minOwnGate !== undefined && !(owner.hp > c.minOwnGate)) return false;
  if (
    c.allyNinjaFaction &&
    !owner.board.some((u) => {
      const d = getCardById(u.cardId);
      return alive(u) && d?.kind === 'ninja' && d.faction === c.allyNinjaFaction;
    })
  )
    return false;
  const allies = owner.board.filter(alive);
  if (c.minAllies && allies.length < c.minAllies) return false;
  if (c.allyCardId && !allies.some((u) => u.cardId === c.allyCardId && u.uid !== source.uid)) return false;
  if (
    c.allyFaction &&
    !allies.some((u) => u.uid !== source.uid && getCardById(u.cardId)?.faction === c.allyFaction)
  )
    return false;
  if (c.selfDamaged && !(source.health < source.maxHealth)) return false;
  return true;
}

function pickTargets(
  target: RecurringTarget,
  source: BoardUnit,
  owner: PlayerState,
  opp: PlayerState,
  combatEnemyUid?: string
): { side: 'owner' | 'opp'; uids: string[] } {
  const enemies = opp.board.filter(alive);
  const allies = owner.board.filter(alive);
  const byPower = (a: BoardUnit, b: BoardUnit) => getUnitPower(b) - getUnitPower(a);
  switch (target) {
    case 'self':
      return { side: 'owner', uids: allies.some((u) => u.uid === source.uid) ? [source.uid] : [] };
    case 'combat_enemy':
      return { side: 'opp', uids: combatEnemyUid && enemies.some((u) => u.uid === combatEnemyUid) ? [combatEnemyUid] : [] };
    case 'strongest_enemy':
      return { side: 'opp', uids: enemies.length ? [[...enemies].sort(byPower)[0].uid] : [] };
    case 'weakest_enemy':
      return { side: 'opp', uids: enemies.length ? [[...enemies].sort(byPower).reverse()[0].uid] : [] };
    case 'random_enemy':
      return { side: 'opp', uids: enemies.length ? [enemies[Math.floor(Math.random() * enemies.length)].uid] : [] };
    case 'all_enemies':
      return { side: 'opp', uids: enemies.map((u) => u.uid) };
    case 'most_injured_ally': {
      const injured = allies
        .filter((u) => u.health < u.maxHealth)
        .sort((a, b) => b.maxHealth - b.health - (a.maxHealth - a.health));
      return { side: 'owner', uids: injured.length ? [injured[0].uid] : [] };
    }
    case 'weakest_ally':
      return { side: 'owner', uids: allies.length ? [[...allies].sort(byPower).reverse()[0].uid] : [] };
    case 'all_allies':
      return { side: 'owner', uids: allies.map((u) => u.uid) };
    case 'other_allies':
      return { side: 'owner', uids: allies.filter((u) => u.uid !== source.uid).map((u) => u.uid) };
  }
}

type UnitFn = (u: BoardUnit) => BoardUnit;

function applyEffect(
  e: RecurringEffect,
  source: BoardUnit,
  owner: PlayerState,
  opp: PlayerState,
  opts: RecurringRunOptions
): { owner: PlayerState; opp: PlayerState } {
  let o = owner;
  let p = opp;
  const onUnits = (target: RecurringTarget, fn: UnitFn, hostile: boolean) => {
    const t = pickTargets(target, source, o, p, opts.combatEnemyUid);
    if (t.uids.length === 0) return;
    const set = new Set(t.uids);
    const map = (u: BoardUnit): BoardUnit => {
      if (!set.has(u.uid)) return u;
      // Contra-Jutsu anula o próximo efeito inimigo na unidade.
      if (hostile && t.side === 'opp' && u.hasSpellShield) return { ...u, hasSpellShield: false };
      return fn(u);
    };
    if (t.side === 'owner') o = { ...o, board: o.board.map(map) };
    else p = { ...p, board: p.board.map(map) };
  };

  switch (e.type) {
    case 'buff':
      onUnits(
        e.target,
        (u) =>
          e.permanent
            ? {
                ...u,
                attack: Math.max(0, u.attack + e.attack),
                health: u.health + e.health,
                maxHealth: Math.max(1, u.maxHealth + e.health),
              }
            : {
                ...u,
                tempAttackBonus: u.tempAttackBonus + e.attack,
                tempHealthBonus: u.tempHealthBonus + e.health,
              },
        e.attack < 0 || e.health < 0
      );
      break;
    case 'damage':
      onUnits(e.target, (u) => {
        const r = applyDamageToUnit(u, e.amount);
        if (opts.fx && r.actualDamage > 0) opts.fx.unitFx[u.uid] = { type: 'hit', label: `-${r.actualDamage}` };
        return r.unit;
      }, true);
      break;
    case 'heal':
      onUnits(e.target, (u) => {
        if (opts.fx && u.health < u.maxHealth) opts.fx.unitFx[u.uid] = { type: 'heal', label: `+${Math.min(e.amount, u.maxHealth - u.health)}` };
        return healUnit(u, e.amount);
      }, false);
      break;
    case 'stun':
      onUnits(e.target, (u) => ({ ...u, stunned: true }), true);
      break;
    case 'chakra_block':
      onUnits(e.target, (u) => ({ ...u, frozen: true }), true);
      break;
    case 'barrier':
      onUnits(e.target, (u) => ({ ...u, hasBarrier: true }), false);
      break;
    case 'gate_damage':
      p = { ...p, hp: Math.max(0, p.hp - e.amount) };
      if (e.amount > 0) o = { ...o, damagedEnemyNexusThisRound: true };
      break;
    case 'gate_heal':
      o = { ...o, hp: Math.min(o.maxHp, o.hp + e.amount) };
      break;
    case 'draw':
      o = drawCards(o, e.amount);
      break;
    case 'reserve':
      o = { ...o, spellMana: Math.min(MAX_RESERVE, o.spellMana + e.amount) };
      break;
    case 'drain_reserve':
      p = { ...p, spellMana: Math.max(0, p.spellMana - e.amount) };
      break;
    case 'summon': {
      const tok = TOKEN_CARDS[e.tokenId] ?? getCardById(e.tokenId);
      if (tok && (tok.kind === 'token' || tok.kind === 'unidade') && o.board.length < MAX_BOARD) {
        o = { ...o, board: [...o.board, createBoardUnit(tok, source.owner, opts.round, opts.arenaId)] };
      }
      break;
    }
    case 'gain_keyword':
      onUnits(
        e.target,
        (u) =>
          u.keywords.includes(e.keyword)
            ? u
            : { ...u, keywords: [...u.keywords, e.keyword], roundKeywords: [...(u.roundKeywords ?? []), e.keyword] },
        false
      );
      break;
    case 'pay_gate':
      o = { ...o, hp: Math.max(1, o.hp - e.amount) };
      break;
    case 'progress':
      o = {
        ...o,
        board: o.board.map((u) =>
          u.uid === source.uid && u.evolutionLevel < 3
            ? evolveUnitIfReady({ ...u, evolutionProgress: u.evolutionProgress + e.amount }, opts.arenaId, opts.onEvolve)
            : u
        ),
      };
      break;
  }
  return { owner: o, opp: p };
}

const FX_BY_TRIGGER: Partial<Record<RecurringTrigger, 'dawn' | 'nightfall' | 'jutsu'>> = {
  inicio_rodada: 'dawn',
  fim_rodada: 'nightfall',
  repouso: 'nightfall',
  ao_conjurar: 'jutsu',
  vinganca: 'jutsu',
};

/**
 * Dispara as habilidades recorrentes `trigger` das unidades do dono.
 * Retorna os estados novos; não remove unidades mortas.
 */
export function runRecurringTrigger(
  trigger: RecurringTrigger,
  owner: PlayerState,
  opp: PlayerState,
  opts: RecurringRunOptions
): RecurringRunResult {
  const logs = opts.logs ?? [];
  let o = owner;
  let p = opp;
  let fired = 0;

  const sources: BoardUnit[] = opts.sourceUnit
    ? [opts.sourceUnit]
    : o.board.filter((u) => alive(u) && (!opts.sourceUids || opts.sourceUids.includes(u.uid)));

  for (const src0 of sources) {
    const abilities = getRecurringAbilities(src0);
    abilities.forEach((ability, idx) => {
      if (ability.trigger !== trigger) return;
      // Estado mais recente da fonte (pode ter mudado com outro disparo).
      const src = opts.sourceUnit ? src0 : o.board.find((u) => u.uid === src0.uid);
      if (!src || (!opts.sourceUnit && !alive(src)) || src.silenced) return;
      const key = `${trigger}:${idx}`;
      if (ability.oncePerRound && (src.recurringUsed ?? []).includes(key)) return;
      if (!conditionMet(ability.condition, src, o, opts)) return;

      for (const effect of ability.effects) {
        const r = applyEffect(effect, src, o, p, opts);
        o = r.owner;
        p = r.opp;
      }
      if (ability.oncePerRound) {
        o = {
          ...o,
          board: o.board.map((u) =>
            u.uid === src.uid ? { ...u, recurringUsed: [...(u.recurringUsed ?? []), key] } : u
          ),
        };
      }
      fired += 1;
      const name = getCardById(src.cardId)?.name ?? 'Unidade';
      logs.push({
        id: nextUid('rec'),
        round: opts.round,
        text: `${RECURRING_TRIGGER_LABEL[trigger]} · ${name}: ${describeRecurringAbilityBody(ability)}`,
        tone: 'info',
        actor: src.owner,
        cardId: src.cardId,
        originUid: src.uid,
        ...(trigger === 'ultimo_desejo' || trigger === 'vinganca' ? { cine: 'effect' as const } : {}),
      });
      const fxType = FX_BY_TRIGGER[trigger];
      if (opts.fx && fxType && !opts.fx.unitFx[src.uid]) {
        opts.fx.unitFx[src.uid] = { type: fxType, label: RECURRING_TRIGGER_LABEL[trigger] };
      }
    });
  }
  return { owner: o, opp: p, logs, fired };
}

/** Marca unidades que atacaram ou bloquearam (Repouso olha isso no fim da rodada). */
export function markUnitsActed(state: PlayerState, uids: Iterable<string>): PlayerState {
  const set = new Set(uids);
  if (set.size === 0) return state;
  return { ...state, board: state.board.map((u) => (set.has(u.uid) ? { ...u, actedThisRound: true } : u)) };
}

/**
 * Fim da rodada: dispara "Fim da rodada" e depois "Repouso" (unidades que não agiram)
 * dos dois lados, começando pelo dono da Ficha de Ataque.
 */
export function runEndOfRoundTriggers(
  first: PlayerState,
  second: PlayerState,
  opts: Omit<RecurringRunOptions, 'sourceUids' | 'sourceUnit' | 'combatEnemyUid'>
): { first: PlayerState; second: PlayerState; logs: BattleLogEntry[]; fired: number } {
  const logs = opts.logs ?? [];
  let a = first;
  let b = second;
  let fired = 0;
  for (const trig of ['fim_rodada', 'repouso'] as const) {
    for (const side of [0, 1] as const) {
      const own = side === 0 ? a : b;
      const foe = side === 0 ? b : a;
      const sourceUids = trig === 'repouso' ? own.board.filter((u) => !u.actedThisRound).map((u) => u.uid) : undefined;
      const r = runRecurringTrigger(trig, own, foe, { ...opts, logs, sourceUids });
      fired += r.fired;
      if (side === 0) {
        a = r.owner;
        b = r.opp;
      } else {
        b = r.owner;
        a = r.opp;
      }
    }
  }
  return { first: a, second: b, logs, fired };
}

/** Limpa os marcadores por rodada (agiu / 1 vez por rodada). */
export function resetRecurringRoundState(u: BoardUnit): BoardUnit {
  const temp = u.roundKeywords ?? [];
  if (!u.actedThisRound && !(u.recurringUsed && u.recurringUsed.length) && temp.length === 0) return u;
  // Palavras-chave "nesta rodada" saem (uma de cada; se também vierem de Equipamento, ficam).
  let keywords = u.keywords;
  if (temp.length) {
    const eq = u.equippedCardId ? getCardById(u.equippedCardId) : undefined;
    const fromEquip = new Set(eq?.kind === 'equipamento' ? eq.grantedKeywords : []);
    keywords = keywords.filter((k) => !temp.includes(k) || fromEquip.has(k));
  }
  return { ...u, actedThisRound: false, recurringUsed: [], roundKeywords: [], keywords };
}

/**
 * Linhas de habilidade para a UI: as do texto da carta + as recorrentes dos dados cujo
 * gatilho ainda não aparece no texto (evita duplicar quando o texto já descreve o gatilho).
 */
export function mergeRecurringAbilityLines<T extends { trigger?: string; text: string }>(
  lines: T[],
  abilities: RecurringAbility[]
): Array<T | { trigger: string; text: string }> {
  const present = new Set(lines.map((l) => (l.trigger ?? '').replace(/\s*\([^)]*\)\s*$/, '').toLowerCase()));
  const extra = abilities
    .filter((a) => !present.has(RECURRING_TRIGGER_LABEL[a.trigger].toLowerCase()))
    .map((a) => ({ trigger: RECURRING_TRIGGER_LABEL[a.trigger], text: describeRecurringAbilityBody(a) }));
  return [...lines, ...extra];
}
