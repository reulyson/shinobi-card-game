import { ARENAS, ARENA_EFFECTS_ENABLED, activeArenaRule } from '../data/arenas';
import { markUnitsActed, runRecurringTrigger } from './recurringAbilities';
import { getCardById, getNinjaDuplicateCardId, getNinjaMaxRank, TOKEN_CARDS } from '../data/cards';
import {
  applyNinjaCastHooks,
  applyNinjaEquipHooks,
  applyNinjaOnDeath,
  applyNinjaPostStrike,
  applyNinjaPreDeath,
  applyNinjaPreStrike,
  applyNinjaSecondChance,
  gainNinjaProgress,
  gainNinjaProgressOnBoard,
  getNinjaCostDiscount,
  sealUntilRoundEnd,
} from './ninjaEffects';
import {
  ArenaId,
  BattleLogEntry,
  BoardUnit,
  CardDef,
  CombatPair,
  CombatVisualFX,
  EquipmentCardDef,
  JutsuCardDef,
  NinjaCardDef,
  NinjaRankMemory,
  PlayerState,
  TrapCardDef,
  TrapSlot,
  UnitCardDef,
  isOcultoJutsu,
  pushKeywordFx,
} from '../types/game';
import {
  SECOND_ATTACK_UNIT_ID,
  applyCopiarOnResolve,
  applyGenjutsu,
  applyKai,
  isInGenjutsu,
  linkPartner,
  poisonOnStrike,
} from './keywords';
import { MAX_BOARD_UNITS, MAX_HAND_SIZE, MAX_OCULTO_IN_PLAY, STARTING_VITALIDADE } from './limits';
import { applyUnitPreStrike } from './unitEffects';

export {
  DECK_SIZE,
  MAX_BOARD_UNITS,
  MAX_DISTINCT_NINJAS,
  MAX_HAND_SIZE,
  MAX_JUTSU_RESERVE,
  MAX_NINJA_COPIES,
  MAX_NON_NINJA_COPIES,
  MAX_OCULTO_IN_PLAY,
  STARTING_VITALIDADE,
} from './limits';

/** Oculto armável: velocidade Oculto com gatilho (ex-Armadilha). */
export function isOcultoArmable(card: CardDef | undefined | null): card is TrapCardDef {
  return isOcultoJutsu(card) && !!card.triggerType;
}

let uidCounter = 1;
export function nextUid(prefix = 'u'): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createInitialPlayerState(deckIds: string[]): PlayerState {
  const shuffled = shuffle(deckIds);
  const hand = shuffled.slice(0, 5);
  const deck = shuffled.slice(5);
  return {
    hp: STARTING_VITALIDADE,
    maxHp: STARTING_VITALIDADE,
    mana: 1,
    maxMana: 1,
    spellMana: 0,
    hand,
    deck,
    board: [],
    traps: [],
    passed: false,
    cardsPlayedThisRound: 0,
    spellsCastThisRound: 0,
    spellsCastLastRound: 0,
    damagedEnemyNexusThisRound: false,
    scoutAttackUsedThisRound: false,
    hallowedBonus: 0,
    keywordsPlayedSet: [],
    cursedHandIndices: {},
    deckOut: false,
    ninjaMemory: {},
    ninjaCopies: {},
  };
}

export const RANK_NAMES: Record<1 | 2 | 3, string> = { 1: 'Gennin', 2: 'Chuunin', 3: 'Jounnin' };

/** Custo de jogar o Ninja já numa patente (custo de retorno): Gennin = custo; Chuunin = +1; Jounnin = +2 (máx. 10). */
export function getNinjaPatenteCost(card: NinjaCardDef, level: 1 | 2 | 3): number {
  if (level === 1) return card.cost;
  if (level === 2) return Math.min(10, card.chuuninCost ?? card.cost + 1);
  return Math.min(10, card.jounninCost ?? card.cost + 2);
}

/** Patente salva do Ninja para o dono (Gennin sem progresso quando nunca saiu de campo). */
export function getSavedRank(state: PlayerState, ninjaId: string): NinjaRankMemory {
  return state.ninjaMemory?.[ninjaId] ?? { level: 1, progress: 0, target: 0, seq: 0 };
}

let rankSeq = 0;

/** Coloca a unidade recém-criada na patente salva e retoma o progresso parcial. */
export function applySavedRank(unit: BoardUnit, state: PlayerState, arenaId: ArenaId): BoardUnit {
  const def = getCardById(unit.cardId);
  if (!def || def.kind !== 'ninja') return unit;
  const mem = state.ninjaMemory?.[def.id];
  if (!mem) return unit;
  let u = unit;
  while (u.evolutionLevel < mem.level) {
    const before = u.evolutionLevel;
    u = evolveUnitIfReady({ ...u, evolutionProgress: u.evolutionTarget }, arenaId);
    if (u.evolutionLevel === before) break;
  }
  if (u.evolutionLevel < 3) {
    u = { ...u, evolutionProgress: Math.min(mem.progress, Math.max(0, u.evolutionTarget - 1)) };
  }
  return u;
}

/**
 * Regras de mão do Ninja (Grupos 2 e 3), aplicadas a cada mudança de estado do jogador:
 * 1) Ninja que saiu de campo (morreu/removido; não conta se voltou para a mão) grava patente e progresso,
 *    e as cópias dele transformadas na mão voltam a ser o Ninja.
 * 2) Qualquer cópia de um Ninja que esteja em campo, chegando à mão por qualquer caminho, vira o
 *    Jutsu/Token Exclusivo (ou o Jutsu geral) na hora.
 * 3) Contagem de cópias transformadas nunca passa do que existe na mão.
 */
export function normalizeNinjaHand(
  prev: PlayerState,
  next: PlayerState,
  side: 'player' | 'enemy',
  round: number
): { state: PlayerState; logs: BattleLogEntry[] } {
  const logs: BattleLogEntry[] = [];
  let memory = { ...(prev.ninjaMemory ?? {}) };
  // Mescla memória (estado "next" pode ter sido calculado a partir de um estado mais antigo).
  for (const [k, v] of Object.entries(next.ninjaMemory ?? {})) {
    if (!memory[k] || v.seq >= memory[k].seq) memory[k] = v;
  }
  const copies: Record<string, number> = { ...(next.ninjaCopies ?? {}) };
  let hand = [...next.hand];
  let changed = false;

  const nextUids = new Set(next.board.map((u) => u.uid));
  const countIn = (arr: string[], id: string) => arr.filter((c) => c === id).length;
  for (const unit of prev.board) {
    if (nextUids.has(unit.uid)) continue;
    const def = getCardById(unit.cardId);
    if (!def || def.kind !== 'ninja') continue;
    // Voltou para a mão (não morreu): sem memória nem reversão.
    if (countIn(hand, def.id) > countIn(prev.hand, def.id)) continue;
    if (next.board.some((u) => u.cardId === def.id)) continue;
    const level = (Math.min(3, Math.max(1, unit.evolutionLevel)) as 1 | 2 | 3);
    memory[def.id] = {
      level,
      progress: level >= 3 ? 0 : unit.evolutionProgress,
      target: level >= 3 ? 0 : unit.evolutionTarget,
      seq: ++rankSeq,
    };
    changed = true;
    const dupId = getNinjaDuplicateCardId(def);
    let toRevert = Math.min(copies[def.id] ?? 0, countIn(hand, dupId));
    copies[def.id] = 0;
    if (toRevert > 0) {
      for (let i = hand.length - 1; i >= 0 && toRevert > 0; i--) {
        if (hand[i] === dupId) {
          hand[i] = def.id;
          toRevert--;
        }
      }
      const dup = getCardById(dupId);
      logs.push({
        id: nextUid('rev'),
        round,
        text: `${side === 'player' ? `Sua cópia ${dup ? `(${dup.name}) ` : ''}voltou` : 'Uma cópia na mão do oponente voltou'} a ser ${def.name} — patente salva: ${RANK_NAMES[level]}${level < 3 && unit.evolutionTarget ? ` (${unit.evolutionProgress}/${unit.evolutionTarget})` : ''}.`,
        tone: 'evolution',
        actor: side,
      });
    } else if (level > 1) {
      logs.push({
        id: nextUid('rev'),
        round,
        text: `${def.name} saiu de campo; patente salva: ${RANK_NAMES[level]}. A próxima cópia entra nessa patente.`,
        tone: 'info',
        actor: side,
      });
    }
  }

  // Cópias de Ninja em campo chegando à mão por qualquer caminho viram o Exclusivo.
  const onBoard = new Set(
    next.board.filter((u) => getCardById(u.cardId)?.kind === 'ninja').map((u) => u.cardId)
  );
  hand = hand.map((cid) => {
    if (!onBoard.has(cid)) return cid;
    const def = getCardById(cid);
    if (!def || def.kind !== 'ninja') return cid;
    const dupId = getNinjaDuplicateCardId(def);
    copies[def.id] = (copies[def.id] ?? 0) + 1;
    changed = true;
    logs.push({
      id: nextUid('dup'),
      round,
      text: `${side === 'player' ? 'Sua cópia' : 'Uma cópia do oponente'} de ${def.name} virou ${
        getCardById(dupId)?.name ?? 'o Jutsu Exclusivo'
      }, pois ele já está em campo.`,
      tone: 'info',
      actor: side,
    });
    return dupId;
  });

  // Contagem nunca maior que as cartas que existem na mão.
  for (const [nid, n] of Object.entries(copies)) {
    const def = getCardById(nid);
    if (!def || def.kind !== 'ninja') continue;
    const have = countIn(hand, getNinjaDuplicateCardId(def));
    if (n > have) {
      copies[nid] = have;
      changed = true;
    }
  }

  const memChanged = JSON.stringify(memory) !== JSON.stringify(next.ninjaMemory ?? {});
  if (!changed && !memChanged) return { state: next, logs };
  return { state: { ...next, hand, ninjaMemory: memory, ninjaCopies: copies }, logs };
}

/** Regra base (Parte 5 · Grupo 2): nenhuma carta custa menos de 1 depois de descontos. */
export const MIN_CARD_COST = 1;
/** Regra base (Parte 5 · Grupo 2): descontos somados valem no máximo −2 por carta. */
export const MAX_TOTAL_DISCOUNT = 2;

export function getEffectiveCost(
  card: CardDef,
  ownerState: PlayerState,
  arenaId: ArenaId,
  handIndex?: number
): number {
  // Soma todos os descontos e aplica de uma vez: no máximo −2 e nunca abaixo de 1.
  let discount = 0;
  if (activeArenaRule(arenaId) === 'floresta_da_morte' && isOcultoArmable(card)) {
    discount += 1;
  }
  if (
    activeArenaRule(arenaId) === 'telhados_konoha' &&
    (card.kind === 'ninja' || card.kind === 'unidade') &&
    (card.role === 'Hokage' || card.role === 'Sensei')
  ) {
    discount += 1;
  }
  // Descontos de Ninjas em campo (Kakashi, Jiraiya, Orochimaru, Guy, Shikamaru, Tenten...): ver ninjaEffects.
  discount += getNinjaCostDiscount(card, ownerState);
  // Ninja: o custo é o da patente salva (memória de patente); demais cartas usam o custo impresso.
  const base =
    card.kind === 'ninja' ? getNinjaPatenteCost(card, getSavedRank(ownerState, card.id).level) : card.cost;
  let cost = base;
  if (discount > 0) {
    cost = Math.max(MIN_CARD_COST, base - Math.min(MAX_TOTAL_DISCOUNT, discount));
  }
  if (handIndex !== undefined && ownerState.cursedHandIndices[handIndex]) {
    cost += ownerState.cursedHandIndices[handIndex];
  }
  return cost;
}

/**
 * Por que esta carta da mão não pode ser jogada agora (só regras de custo/campo; fase e turno ficam na UI).
 * null = pode pagar. Usado pela UI para mostrar o motivo; a IA usa canPayCard (mesma regra).
 */
export function getUnplayableReason(
  card: CardDef,
  ownerState: PlayerState,
  arenaId: ArenaId,
  handIndex?: number
): string | null {
  const cost = getEffectiveCost(card, ownerState, arenaId, handIndex);
  if (card.kind === 'ninja') {
    if (ownerState.board.some((u) => u.cardId === card.id)) {
      return `Ninja Único: ${card.name} já está em campo. A outra cópia só pode ser jogada depois que ele morrer.`;
    }
    if (ownerState.board.length >= MAX_BOARD_UNITS) {
      return `Campo cheio (máx. ${MAX_BOARD_UNITS} unidades).`;
    }
    if (ownerState.mana < cost) {
      return `Ninja custa só Chakra principal: precisa de ${cost} e você tem ${ownerState.mana} (a Reserva de Jutsu não paga Ninjas).`;
    }
    return null;
  }
  if (card.kind === 'unidade' || card.kind === 'token') {
    if (ownerState.board.length >= MAX_BOARD_UNITS) {
      return `Campo cheio (máx. ${MAX_BOARD_UNITS} unidades).`;
    }
    if (ownerState.mana < cost) return `Chakra insuficiente: precisa de ${cost} e você tem ${ownerState.mana}.`;
    return null;
  }
  if (card.kind === 'equipamento') {
    if (ownerState.board.length === 0) return 'Equipamento precisa de um aliado em campo.';
    if (ownerState.mana < cost) return `Chakra insuficiente: precisa de ${cost} e você tem ${ownerState.mana}.`;
    return null;
  }
  if (isOcultoArmable(card) && ownerState.traps.length >= MAX_OCULTO_IN_PLAY) {
    return `Já há ${MAX_OCULTO_IN_PLAY} Ocultos armados.`;
  }
  if (ownerState.mana + ownerState.spellMana < cost) {
    return `Chakra insuficiente: precisa de ${cost} (Chakra ${ownerState.mana} + Reserva ${ownerState.spellMana}).`;
  }
  return null;
}

export function canPayCard(
  card: CardDef,
  ownerState: PlayerState,
  arenaId: ArenaId,
  handIndex?: number
): boolean {
  return getUnplayableReason(card, ownerState, arenaId, handIndex) === null;
}

export function spendManaForCard(
  state: PlayerState,
  card: CardDef,
  arenaId: ArenaId,
  handIndex?: number
): PlayerState {
  const cost = getEffectiveCost(card, state, arenaId, handIndex);
  if (
    card.kind === 'ninja' ||
    card.kind === 'unidade' ||
    card.kind === 'token' ||
    card.kind === 'equipamento'
  ) {
    return { ...state, mana: Math.max(0, state.mana - cost) };
  }
  const spellUsed = Math.min(state.spellMana, cost);
  const manaUsed = cost - spellUsed;
  return {
    ...state,
    spellMana: state.spellMana - spellUsed,
    mana: Math.max(0, state.mana - manaUsed),
  };
}

export function createBoardUnit(
  card: NinjaCardDef | UnitCardDef,
  owner: 'player' | 'enemy',
  round: number,
  arenaId: ArenaId
): BoardUnit {
  const bonusHp =
    activeArenaRule(arenaId) === 'arena_chunin' && card.keywords.includes('Ágil') ? 1 : 0;
  return {
    uid: nextUid(owner === 'player' ? 'p' : 'e'),
    cardId: card.id,
    owner,
    attack: card.attack,
    health: card.health + bonusHp,
    maxHealth: card.health + bonusHp,
    tempAttackBonus: 0,
    tempHealthBonus: 0,
    keywords: [...card.keywords],
    hasBarrier: card.keywords.includes('Esquiva'),
    hasSpellShield: card.keywords.includes('Anulação'),
    stunned: false,
    frozen: false,
    silenced: false,
    immortalUsed: false,
    gloomStacks: 0,
    spiritStacks: 0,
    impactStacks: card.keywords.includes('Impacto') ? 1 : 0,
    destinedTriggeredThisRound: false,
    equippedCardId: null,
    equippedBonusAttack: 0,
    equippedBonusHealth: 0,
    capturedUnits: [],
    evolutionLevel: 1,
    evolved: false,
    evolutionProgress: 0,
    evolutionTarget: card.kind === 'ninja' ? card.levelUpTarget : 99,
    summonedRound: round,
    canAttackThisRound: true,
  };
}

/**
 * Ninja Único: só pode existir uma cópia de cada Ninja em campo por jogador.
 * Retorna true se o dono já tem esse Ninja no campo.
 */
export function isNinjaAlreadyOnBoard(cardId: string, ownerState: PlayerState): boolean {
  const def = getCardById(cardId);
  return def?.kind === 'ninja' && ownerState.board.some((u) => u.cardId === cardId);
}

/**
 * Jutsu Exclusivo (regra B): não entra no baralho. Sempre que um Ninja entra em campo
 * (pela mão ou por efeito), 1 cópia do Jutsu Exclusivo dele é criada na mão (se houver espaço),
 * e as cópias repetidas do Ninja na mão viram o Token Exclusivo (se houver) ou o Jutsu Exclusivo.
 */
export function onNinjaEnteredBoard(
  ninja: NinjaCardDef,
  ownerState: PlayerState,
  round: number,
  logs?: BattleLogEntry[],
  side?: 'player' | 'enemy'
): PlayerState {
  let next: PlayerState = { ...ownerState, hand: [...ownerState.hand] };
  const sig = getCardById(ninja.signatureJutsuId);
  if (sig) {
    if (next.hand.length < 9) {
      next.hand.push(sig.id);
      logs?.push({
        id: nextUid('log'),
        round,
        text:
          side === 'enemy'
            ? `O oponente ganhou ${sig.name} na mão (de ${ninja.name}).`
            : `Você ganhou ${sig.name} na mão (de ${ninja.name}).`,
        tone: 'jutsu',
        actor: side,
        cardId: sig.id,
        cine: side === 'player' ? 'created' : undefined,
      });
    } else {
      logs?.push({
        id: nextUid('log'),
        round,
        text: `Mão cheia: ${sig.name} (de ${ninja.name}) foi perdido.`,
        tone: 'info',
      });
    }
  }
  const transformed = transformHandCopiesForBoard(next);
  next = transformed.state;
  for (const pair of transformed.transformedPairs) {
    logs?.push({
      id: nextUid('log'),
      round,
      text:
        side === 'enemy'
          ? `Uma cópia de ${pair.ninjaName} na mão do oponente virou ${pair.jutsuName}, pois ele já está em campo.`
          : `Sua cópia de ${pair.ninjaName} virou ${pair.jutsuName}, pois ele já está em campo.`,
      tone: 'info',
      actor: side,
    });
  }
  return next;
}

/**
 * Invocação por efeito (jutsu, token, oculto, habilidade).
 * Regra Ninja Único: se o Ninja já está em campo, a invocação falha e a carta vira
 * o Token Exclusivo dele (se definido) ou o Jutsu Exclusivo, na mão (se houver espaço).
 * Se o Ninja entra, cria o Jutsu Exclusivo na mão (onNinjaEnteredBoard).
 */
export function summonUnitByEffect(
  card: NinjaCardDef | UnitCardDef,
  ownerState: PlayerState,
  owner: 'player' | 'enemy',
  round: number,
  arenaId: ArenaId,
  logs?: BattleLogEntry[]
): { ownerState: PlayerState; unit: BoardUnit | null } {
  if (card.kind === 'ninja' && isNinjaAlreadyOnBoard(card.id, ownerState)) {
    const dupId = getNinjaDuplicateCardId(card);
    const dup = getCardById(dupId);
    const nextOwner = { ...ownerState };
    if (dup && nextOwner.hand.length < 9) {
      nextOwner.hand = [...nextOwner.hand, dup.id];
      nextOwner.ninjaCopies = { ...(nextOwner.ninjaCopies ?? {}), [card.id]: (nextOwner.ninjaCopies?.[card.id] ?? 0) + 1 };
    }
    logs?.push({
      id: nextUid('log'),
      round,
      text: `${card.name} já está em campo, então a carta virou ${
        dup?.name || 'o Jutsu Exclusivo'
      }.`,
      tone: 'info',
      actor: owner,
      cardId: dup?.id,
      cine: 'created',
    });
    return { ownerState: nextOwner, unit: null };
  }
  if (ownerState.board.length >= 5) {
    return { ownerState, unit: null };
  }
  const unit = applySavedRank(createBoardUnit(card, owner, round, arenaId), ownerState, arenaId);
  let nextOwner: PlayerState = { ...ownerState, board: [...ownerState.board, unit] };
  if (card.kind === 'ninja') {
    nextOwner = onNinjaEnteredBoard(card, nextOwner, round, logs, owner);
  }
  return { ownerState: nextOwner, unit };
}

/**
 * Parceiro (Grupo 5): invoca um Token que acompanha o Ninja `ninjaUid`.
 * Se o Ninja sair de campo, o Parceiro vai junto (applyPartnerRule em engine/keywords.ts).
 */
export function summonPartner(
  token: UnitCardDef,
  ownerState: PlayerState,
  ninjaUid: string,
  owner: 'player' | 'enemy',
  round: number,
  arenaId: ArenaId,
  logs?: BattleLogEntry[]
): { ownerState: PlayerState; unit: BoardUnit | null } {
  if (!ownerState.board.some((u) => u.uid === ninjaUid)) return { ownerState, unit: null };
  const res = summonUnitByEffect(token, ownerState, owner, round, arenaId, logs);
  if (!res.unit) return res;
  const linked = linkPartner(res.unit, ninjaUid);
  return {
    ownerState: { ...res.ownerState, board: res.ownerState.board.map((u) => (u.uid === linked.uid ? linked : u)) },
    unit: linked,
  };
}

export function getUnitPower(unit: BoardUnit): number {
  if (unit.frozen) return 0;
  const equipAtk = unit.silenced ? 0 : unit.equippedBonusAttack;
  const equipHp = unit.silenced ? 0 : unit.equippedBonusHealth;
  if (!unit.silenced && unit.keywords.includes('Muralha')) {
    return Math.max(0, unit.health + equipHp + unit.tempHealthBonus);
  }
  return Math.max(0, unit.attack + equipAtk + unit.tempAttackBonus);
}

export function getUnitHealth(unit: BoardUnit): number {
  const equipHp = unit.silenced ? 0 : unit.equippedBonusHealth;
  return Math.max(0, unit.health + equipHp + unit.tempHealthBonus);
}

export function canUnitAttack(unit: BoardUnit): boolean {
  if (unit.stunned) return false;
  if (isInGenjutsu(unit)) return false;
  if (!unit.silenced && unit.keywords.includes('Imobilizado')) return false;
  return true;
}

export function canBlockAttacker(
  blocker: BoardUnit,
  attacker: BoardUnit
): { ok: boolean; reason?: string } {
  const attName = getCardById(attacker.cardId)?.name ?? 'O atacante';
  const blkName = getCardById(blocker.cardId)?.name ?? 'Esta unidade';
  if (blocker.stunned) {
    return { ok: false, reason: `${blkName} está Paralisado: unidades paralisadas não podem bloquear.` };
  }
  if (isInGenjutsu(blocker)) {
    return { ok: false, reason: `${blkName} está em Genjutsu: não ataca nem bloqueia até o efeito acabar (Kai remove).` };
  }
  if (
    !blocker.silenced &&
    (blocker.keywords.includes('Indefeso') || blocker.keywords.includes('Imobilizado'))
  ) {
    const kw = blocker.keywords.includes('Imobilizado') ? 'Imobilizado' : 'Indefeso';
    return { ok: false, reason: `${blkName} tem ${kw}: não pode bloquear.` };
  }
  if (!attacker.silenced && attacker.keywords.includes('Furtivo')) {
    const canSee =
      !blocker.silenced &&
      (blocker.keywords.includes('Furtivo') || blocker.keywords.includes('Sensor'));
    if (!canSee) {
      return {
        ok: false,
        reason: `${attName} tem Furtivo: só pode ser bloqueado por unidades com Furtivo ou Sensor.`,
      };
    }
  }
  if (!attacker.silenced && attacker.keywords.includes('Intimidação')) {
    if (getUnitPower(blocker) < 3) {
      return {
        ok: false,
        reason: `${attName} tem Intimidação: só pode ser bloqueado por Poder 3+ (${blkName} tem ${getUnitPower(blocker)}).`,
      };
    }
  }
  if (!attacker.silenced && attacker.keywords.includes('Imprudente')) {
    if (getUnitHealth(blocker) < 3) {
      return {
        ok: false,
        reason: `${attName} tem Imprudente: só pode ser bloqueado por Vida 3+ (${blkName} tem ${getUnitHealth(blocker)}).`,
      };
    }
  }
  return { ok: true };
}

export function transformHandCopiesForBoard(state: PlayerState): {
  state: PlayerState;
  transformedPairs: Array<{ ninjaName: string; jutsuName: string }>;
} {
  const ninjaOnBoardIds = new Set(
    state.board
      .filter((u) => getCardById(u.cardId)?.kind === 'ninja')
      .map((u) => u.cardId)
  );
  if (ninjaOnBoardIds.size === 0) {
    return { state, transformedPairs: [] };
  }
  const transformedPairs: Array<{ ninjaName: string; jutsuName: string }> = [];
  let changed = false;
  const copies: Record<string, number> = { ...(state.ninjaCopies ?? {}) };
  const nextHand = state.hand.map((cid) => {
    if (ninjaOnBoardIds.has(cid)) {
      const def = getCardById(cid);
      if (def?.kind === 'ninja') {
        const dupId = getNinjaDuplicateCardId(def);
        const dup = getCardById(dupId);
        transformedPairs.push({
          ninjaName: def.name,
          jutsuName: dup?.name || dupId,
        });
        copies[def.id] = (copies[def.id] ?? 0) + 1;
        changed = true;
        return dupId;
      }
    }
    return cid;
  });
  if (!changed) return { state, transformedPairs: [] };
  return { state: { ...state, hand: nextHand, ninjaCopies: copies }, transformedPairs };
}

export function drawCards(state: PlayerState, count: number): PlayerState {
  let nextDeck = [...state.deck];
  let nextHand = [...state.hand];
  let deckOut = Boolean(state.deckOut);
  const copies: Record<string, number> = { ...(state.ninjaCopies ?? {}) };
  const ninjaOnBoardIds = new Set(
    state.board
      .filter((u) => getCardById(u.cardId)?.kind === 'ninja')
      .map((u) => u.cardId)
  );
  for (let i = 0; i < count; i++) {
    if (nextDeck.length === 0) {
      deckOut = true;
      break;
    }
    const [top, ...rest] = nextDeck;
    nextDeck = rest;
    let drawnId = top;
    if (ninjaOnBoardIds.has(top)) {
      const def = getCardById(top);
      if (def?.kind === 'ninja') {
        drawnId = getNinjaDuplicateCardId(def);
        if (nextHand.length < 9) copies[def.id] = (copies[def.id] ?? 0) + 1;
      }
    }
    if (nextHand.length < 9) {
      nextHand.push(drawnId);
    }
  }
  return { ...state, deck: nextDeck, hand: nextHand, deckOut, ninjaCopies: copies };
}

export function evolveUnitIfReady(
  unit: BoardUnit,
  arenaId: ArenaId,
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void
): BoardUnit {
  if (unit.evolutionLevel >= 3 || unit.silenced || unit.evolutionProgress < unit.evolutionTarget) {
    return unit;
  }
  const def = getCardById(unit.cardId);
  if (!def || def.kind !== 'ninja') return unit;
  // Patente máxima (Grupo 6): Ninjas de 1 ou 2 patentes não sobem além dela.
  if (unit.evolutionLevel >= getNinjaMaxRank(def)) return unit;

  const arenaBonus = activeArenaRule(arenaId) === 'vale_do_fim' ? 1 : 0;

  if (unit.evolutionLevel === 1) {
    const atkGain = Math.max(1, def.chuuninAttack - def.attack);
    const hpGain = Math.max(1, def.chuuninHealth - def.health);
    const mergedKeywords = Array.from(new Set([...unit.keywords, ...def.chuuninKeywords]));
    const promotedUnit: BoardUnit = {
      ...unit,
      evolutionLevel: 2,
      evolved: true,
      evolutionProgress: 0,
      evolutionTarget: def.chuuninLevelUpTarget,
      attack: unit.attack + atkGain + arenaBonus,
      health: unit.health + hpGain + arenaBonus,
      maxHealth: unit.maxHealth + hpGain + arenaBonus,
      keywords: mergedKeywords,
      hasBarrier: unit.hasBarrier || def.chuuninKeywords.includes('Esquiva'),
      hasSpellShield: unit.hasSpellShield || def.chuuninKeywords.includes('Anulação'),
      impactStacks:
        unit.impactStacks +
        (def.chuuninKeywords.includes('Impacto') && !unit.keywords.includes('Impacto') ? 1 : 0),
    };
    onEvolve?.(promotedUnit, def);
    return promotedUnit;
  }

  // Nível 2 (Chuunin) -> Nível 3 (Jounnin)
  const atkGain = Math.max(1, def.jounninAttack - def.chuuninAttack);
  const hpGain = Math.max(1, def.jounninHealth - def.chuuninHealth);
  const mergedKeywords = Array.from(new Set([...unit.keywords, ...def.jounninKeywords]));
  const jounninUnit: BoardUnit = {
    ...unit,
    evolutionLevel: 3,
    evolved: true,
    evolutionProgress: 1,
    evolutionTarget: 1,
    attack: unit.attack + atkGain + arenaBonus,
    health: unit.health + hpGain + arenaBonus,
    maxHealth: unit.maxHealth + hpGain + arenaBonus,
    keywords: mergedKeywords,
    hasBarrier: unit.hasBarrier || def.jounninKeywords.includes('Esquiva'),
    hasSpellShield: unit.hasSpellShield || def.jounninKeywords.includes('Anulação'),
    impactStacks:
      unit.impactStacks +
      (def.jounninKeywords.includes('Impacto') && !unit.keywords.includes('Impacto') ? 1 : 0),
  };
  onEvolve?.(jounninUnit, def);
  return jounninUnit;
}

export function healUnit(unit: BoardUnit, amount: number): BoardUnit {
  const newHp = Math.min(unit.maxHealth, unit.health + amount);
  return { ...unit, health: newHp };
}

export function applyGloomToUnit(unit: BoardUnit, stacks = 1): BoardUnit {
  const nextAtk = Math.max(0, unit.attack - stacks);
  const nextHp = unit.health - stacks;
  const nextMax = Math.max(1, unit.maxHealth - stacks);
  return {
    ...unit,
    attack: nextAtk,
    health: nextHp,
    maxHealth: nextMax,
    gloomStacks: unit.gloomStacks + stacks,
  };
}

export function applyDamageToUnit(
  unit: BoardUnit,
  amount: number
): { unit: BoardUnit; actualDamage: number } {
  if (amount <= 0) return { unit, actualDamage: 0 };
  if (unit.hasBarrier) {
    return { unit: { ...unit, hasBarrier: false }, actualDamage: 0 };
  }
  const toughReduction = !unit.silenced && unit.keywords.includes('Resistente') ? 1 : 0;
  const finalAmount = Math.max(0, amount - toughReduction);
  if (finalAmount <= 0) return { unit, actualDamage: 0 };

  let remaining = finalAmount;
  let tempHp = unit.tempHealthBonus;
  let hp = unit.health;
  if (tempHp > 0) {
    const absorbed = Math.min(tempHp, remaining);
    tempHp -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    hp -= remaining;
  }
  return {
    unit: { ...unit, tempHealthBonus: tempHp, health: hp },
    actualDamage: finalAmount,
  };
}

export function attachEquipmentToUnit(
  equip: EquipmentCardDef,
  unit: BoardUnit,
  ownerState: PlayerState
): { unit: BoardUnit; ownerState: PlayerState; returnedEquipId?: string; destroyedOldEquipId?: string } {
  let nextOwner = { ...ownerState };
  let returnedEquipId: string | undefined;
  let destroyedOldEquipId: string | undefined;
  let baseKeywords = [...unit.keywords];

  if (unit.equippedCardId) {
    const prevEquip = getCardById(unit.equippedCardId);
    if (prevEquip && prevEquip.kind === 'equipamento') {
      const cardDef = getCardById(unit.cardId);
      const nativeKeywords = new Set(
        cardDef && (cardDef.kind === 'ninja' || cardDef.kind === 'unidade' || cardDef.kind === 'token')
          ? [
              ...cardDef.keywords,
              ...(cardDef.kind === 'ninja' && unit.evolutionLevel >= 2 ? cardDef.chuuninKeywords : []),
              ...(cardDef.kind === 'ninja' && unit.evolutionLevel === 3 ? cardDef.jounninKeywords : []),
            ]
          : []
      );
      baseKeywords = baseKeywords.filter(
        (kw) => !prevEquip.grantedKeywords.includes(kw) || nativeKeywords.has(kw)
      );
    }
    if (nextOwner.hand.length < 9) {
      returnedEquipId = unit.equippedCardId;
      nextOwner.hand = [...nextOwner.hand, returnedEquipId];
    } else {
      destroyedOldEquipId = unit.equippedCardId;
    }
  }

  // Selado: o equipamento fica preso ao portador, mas seus bônus e palavras-chave ficam desligados.
  const grantsActive = !unit.silenced;
  const grantedKeywords = grantsActive ? equip.grantedKeywords : [];
  const nextKeywords = Array.from(new Set([...baseKeywords, ...grantedKeywords]));
  let destinedBonus = 0;
  let nextDestinedFlag = unit.destinedTriggeredThisRound;
  if (!unit.silenced && unit.keywords.includes('Determinação') && !unit.destinedTriggeredThisRound) {
    destinedBonus = 1;
    nextDestinedFlag = true;
  }

  const updatedUnit: BoardUnit = {
    ...unit,
    attack: unit.attack + destinedBonus,
    health: unit.health + destinedBonus,
    maxHealth: unit.maxHealth + destinedBonus,
    equippedBonusAttack: equip.bonusAttack,
    equippedBonusHealth: equip.bonusHealth,
    keywords: nextKeywords,
    hasBarrier: unit.hasBarrier || grantedKeywords.includes('Esquiva'),
    hasSpellShield: unit.hasSpellShield || grantedKeywords.includes('Anulação'),
    impactStacks:
      unit.impactStacks + (grantedKeywords.includes('Impacto') ? 1 : 0),
    destinedTriggeredThisRound: nextDestinedFlag,
    equippedCardId: equip.id,
  };

  // Aperfeiçoar (Tenten) ganha +1/+0 ao equipar ou criar
  nextOwner.board = nextOwner.board.map((u) => {
    if (u.uid === updatedUnit.uid) return updatedUnit;
    if (!u.silenced && u.keywords.includes('Treinamento')) {
      return { ...u, attack: u.attack + 1 };
    }
    return u;
  });

  return { unit: updatedUnit, ownerState: nextOwner, returnedEquipId, destroyedOldEquipId };
}

export function returnUnitToHand(
  unitUid: string,
  ownerState: PlayerState,
  oppState: PlayerState,
  round: number,
  logs: BattleLogEntry[]
): { ownerState: PlayerState; oppState: PlayerState } {
  let nextOwner = { ...ownerState };
  let nextOpp = { ...oppState };
  const target = nextOwner.board.find((u) => u.uid === unitUid);
  if (!target) return { ownerState: nextOwner, oppState: nextOpp };

  nextOwner.board = nextOwner.board.filter((u) => u.uid !== unitUid);
  const def = getCardById(target.cardId);

  if (target.equippedCardId) {
    const eqDef = getCardById(target.equippedCardId);
    if (nextOwner.hand.length < 9) {
      nextOwner.hand = [...nextOwner.hand, target.equippedCardId];
      logs.push({
        id: nextUid('eqret'),
        round,
        text: `${eqDef?.name || 'Equipamento'} voltou para a mão.`,
        tone: 'equip',
      });
    } else {
      logs.push({
        id: nextUid('eqdest'),
        round,
        text: `${eqDef?.name || 'Equipamento'} foi perdido: mão cheia.`,
        tone: 'equip',
      });
    }
  }

  if (target.capturedUnits.length > 0) {
    for (const cap of target.capturedUnits) {
      if (nextOpp.board.length < 5) {
        nextOpp.board = [...nextOpp.board, cap];
      }
    }
  }

  if (def?.kind === 'token') {
    logs.push({
      id: nextUid('tokvan'),
      round,
      text: `${def.name} é uma ficha e sumiu em vez de voltar à mão.`,
      tone: 'info',
    });
  } else if (def) {
    if (nextOwner.hand.length < 9) {
      nextOwner.hand = [...nextOwner.hand, def.id];
      logs.push({
        id: nextUid('ret'),
        round,
        text: `${def.name} voltou para a mão.`,
        tone: 'info',
      });
    } else {
      logs.push({
        id: nextUid('retfull'),
        round,
        text: `${def.name} foi descartado: mão cheia.`,
        tone: 'info',
      });
    }
  }

  return { ownerState: nextOwner, oppState: nextOpp };
}

export function processBoardDeaths(
  ownerState: PlayerState,
  oppState: PlayerState,
  round: number,
  arenaId: ArenaId,
  logs: BattleLogEntry[],
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void,
  /** Profundidade de mortes em cadeia (Último Desejo/Vingança que matam). */
  depth = 0
): { ownerState: PlayerState; oppState: PlayerState; deathCount: number } {
  const ninjaCtx = { round, arenaId, logs, onEvolve };
  let nextOwner = applyNinjaPreDeath({ ...ownerState }, ninjaCtx);
  let nextOpp = { ...oppState };
  const surviving: BoardUnit[] = [];
  const fallen: BoardUnit[] = [];
  let deathCount = 0;

  for (const unit of nextOwner.board) {
    if (getUnitHealth(unit) > 0) {
      surviving.push(unit);
      continue;
    }

    // Troca de Corpo (Orochimaru Chuunin): na 1ª morte volta 3/3 e compra 2.
    if (!unit.immortalUsed) {
      const bodySwap = applyNinjaSecondChance(unit, nextOwner, ninjaCtx);
      if (bodySwap) {
        surviving.push(bodySwap.unit);
        nextOwner = { ...nextOwner, hand: bodySwap.owner.hand, deck: bodySwap.owner.deck, deckOut: bodySwap.owner.deckOut, ninjaCopies: bodySwap.owner.ninjaCopies };
        continue;
      }
    }

    // Segunda Chance check
    if (!unit.silenced && unit.keywords.includes('Renascer') && !unit.immortalUsed) {
      const revived: BoardUnit = {
        ...unit,
        health: 1,
        tempHealthBonus: 0,
        stunned: true,
        immortalUsed: true,
      };
      surviving.push(revived);
      logs.push({
        id: nextUid('imm'),
        round,
        text: `Segunda Chance: ${getCardById(unit.cardId)?.name} voltou com 1 de Vida, Paralisado.`,
        tone: 'info',
        actor: unit.owner,
        cardId: unit.cardId,
        cine: 'effect',
      });
      continue;
    }

    deathCount += 1;
    fallen.push(unit);
    const def = getCardById(unit.cardId);

    // Return equipment to owner's hand (destroyed if hand already has 9 cards)
    if (unit.equippedCardId) {
      const eqDef = getCardById(unit.equippedCardId);
      if (nextOwner.hand.length < 9) {
        nextOwner.hand = [...nextOwner.hand, unit.equippedCardId];
        logs.push({
          id: nextUid('eqret'),
          round,
          text: `${def?.name} caiu; ${eqDef?.name || 'o equipamento'} voltou para a mão.`,
          tone: 'equip',
        });
      } else {
        logs.push({
          id: nextUid('eqdest'),
          round,
          text: `${def?.name} caiu; ${eqDef?.name || 'o equipamento'} foi perdido (mão cheia).`,
          tone: 'equip',
        });
      }
    }

    // Release captured units
    if (unit.capturedUnits.length > 0) {
      for (const cap of unit.capturedUnits) {
        if (nextOpp.board.length < 5) {
          nextOpp.board = [...nextOpp.board, cap];
        }
      }
    }

    // Legado (Hallowed)
    if (!unit.silenced && unit.keywords.includes('Legado')) {
      nextOwner.hallowedBonus += 1;
      logs.push({
        id: nextUid('sac'),
        round,
        text: `Último Desejo: ${def?.name} caiu e dá +1 de Poder ao próximo atacante.`,
        tone: 'info',
        actor: unit.owner,
        cardId: unit.cardId,
        cine: 'effect',
      });
    }

    // Último Desejo (Edo Shinobi draws 1)
    if (!unit.silenced && unit.cardId === 'token_edo_shinobi') {
      nextOwner = drawCards(nextOwner, 1);
      logs.push({
        id: nextUid('edo'),
        round,
        text: 'Último Desejo: Shinobi Reanimado caiu e você comprou 1 carta.',
        tone: 'info',
        actor: unit.owner,
        cardId: unit.cardId,
        cine: 'effect',
      });
    }
  }

  nextOwner.board = surviving;
  // (merge 4+5+7) "Ao morrer" das Unidades (ex.: Arashi → Marionete) agora é Último Desejo no `recurring` da carta.

  // Habilidades recorrentes (Grupo 4): Último Desejo de quem caiu, Vingança dos aliados.
  let recurringFired = 0;
  for (const dead of fallen) {
    const ld = runRecurringTrigger('ultimo_desejo', nextOwner, nextOpp, { round, arenaId, sourceUnit: dead, onEvolve, logs });
    const vg = runRecurringTrigger('vinganca', ld.owner, ld.opp, { round, arenaId, onEvolve, logs });
    nextOwner = vg.owner;
    nextOpp = vg.opp;
    recurringFired += ld.fired + vg.fired;
  }

  // Último Desejo / Vingança dos Ninjas (Naruto, Haku, Tayuya, Kimimaro, Kiba, Sakura).
  for (const dead of fallen) {
    const res = applyNinjaOnDeath(dead, nextOwner, nextOpp, ninjaCtx);
    nextOwner = res.owner;
    nextOpp = res.opp;
  }

  // Mortes em cadeia causadas por Último Desejo/Vingança (limite de profundidade).
  if (recurringFired > 0 && depth < 4) {
    const dead = (u: BoardUnit) => getUnitHealth(u) <= 0;
    if (nextOpp.board.some(dead)) {
      const r = processBoardDeaths(nextOpp, nextOwner, round, arenaId, logs, onEvolve, depth + 1);
      nextOpp = r.ownerState;
      nextOwner = r.oppState;
    }
    if (nextOwner.board.some(dead)) {
      const r = processBoardDeaths(nextOwner, nextOpp, round, arenaId, logs, onEvolve, depth + 1);
      nextOwner = r.ownerState;
      nextOpp = r.oppState;
      deathCount += r.deathCount;
    }
  }

  return { ownerState: nextOwner, oppState: nextOpp, deathCount };
}

export function getMatchingTraps(
  eventType: 'attack' | 'jutsu' | 'summon',
  defender: PlayerState
): TrapSlot[] {
  const targetTrigger =
    eventType === 'attack'
      ? 'on_enemy_attack'
      : eventType === 'jutsu'
        ? 'on_enemy_jutsu'
        : 'on_enemy_summon';
  return defender.traps.filter((slot) => {
    const def = getCardById(slot.cardId);
    if (!isOcultoArmable(def)) return false;
    return def.triggerType === targetTrigger;
  });
}

export function resolveTrapEffect(
  trapCardId: string,
  trapOwnerSide: 'player' | 'enemy',
  player: PlayerState,
  enemy: PlayerState,
  attackPairs: CombatPair[],
  arenaId: ArenaId,
  round: number,
  context?: {
    attackerUids?: string[];
    summonedUnitUid?: string;
  },
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void
): {
  player: PlayerState;
  enemy: PlayerState;
  attackPairs: CombatPair[];
  logs: BattleLogEntry[];
  fx: CombatVisualFX;
} {
  let defender = trapOwnerSide === 'player' ? { ...player } : { ...enemy };
  let attacker = trapOwnerSide === 'player' ? { ...enemy, board: [...enemy.board] } : { ...player, board: [...player.board] };
  let nextPairs = [...attackPairs];
  const logs: BattleLogEntry[] = [];
  const fx: CombatVisualFX = { unitFx: {} };

  const activeAttackerUids =
    nextPairs.length > 0
      ? nextPairs.map((p) => p.attackerUid)
      : (context?.attackerUids || []).filter((uid) =>
          attacker.board.some((b) => b.uid === uid && getUnitHealth(b) > 0)
        );

  if (trapCardId === 'trap_selo_explosivo' && activeAttackerUids.length > 0) {
    let strongestUid = activeAttackerUids[0];
    let maxAtk = -1;
    for (const uid of activeAttackerUids) {
      const u = attacker.board.find((b) => b.uid === uid);
      if (u && getUnitPower(u) > maxAtk) {
        maxAtk = getUnitPower(u);
        strongestUid = u.uid;
      }
    }
    attacker.board = attacker.board.map((u) => {
      if (u.uid !== strongestUid) return u;
      const res = applyDamageToUnit(u, 3);
      fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
      return res.unit;
    });
    const deathRes = processBoardDeaths(attacker, defender, round, arenaId, logs, onEvolve);
    attacker = deathRes.ownerState;
    defender = deathRes.oppState;
    nextPairs = nextPairs.filter((p) => attacker.board.some((b) => b.uid === p.attackerUid));
    logs.push({
      id: nextUid('log'),
      round,
      text: 'Kibaku Fuda: 3 de dano no atacante mais forte!',
      tone: 'trap',
    });
  } else if (trapCardId === 'trap_possessao_sombras' && activeAttackerUids.length > 0) {
    let strongestUid = activeAttackerUids[0];
    let maxAtk = -1;
    for (const uid of activeAttackerUids) {
      const u = attacker.board.find((b) => b.uid === uid);
      if (u && getUnitPower(u) > maxAtk) {
        maxAtk = getUnitPower(u);
        strongestUid = u.uid;
      }
    }
    attacker.board = attacker.board.map((u) => {
      if (u.uid !== strongestUid) return u;
      fx.unitFx[u.uid] = { type: 'hit', label: 'Paralisado' };
      return { ...u, stunned: true };
    });
    nextPairs = nextPairs.filter((p) => p.attackerUid !== strongestUid);
    logs.push({
      id: nextUid('log'),
      round,
      text: 'Oculto · Kagemane no Jutsu: o atacante mais forte foi Paralisado e saiu do ataque!',
      tone: 'trap',
      actor: trapOwnerSide,
      cardId: trapCardId,
    });
  } else if (trapCardId === 'trap_nevoa_venenosa' && activeAttackerUids.length > 0) {
    const attackerIds = new Set(activeAttackerUids);
    attacker.board = attacker.board.map((u) => {
      if (!attackerIds.has(u.uid)) return u;
      const gloomed = applyGloomToUnit(u, 1);
      const res = applyDamageToUnit(gloomed, 1);
      fx.unitFx[u.uid] = { type: 'hit', label: 'Exaustão -1/-1' };
      return res.unit;
    });
    const deathRes = processBoardDeaths(attacker, defender, round, arenaId, logs, onEvolve);
    attacker = deathRes.ownerState;
    defender = deathRes.oppState;
    nextPairs = nextPairs.filter((p) => attacker.board.some((b) => b.uid === p.attackerUid));
    logs.push({
      id: nextUid('log'),
      round,
      text: 'Dokugiri: 1 de dano e -1/-1 em todos os atacantes!',
      tone: 'trap',
    });
  } else if (trapCardId === 'trap_selo_cinco_elementos') {
    attacker.spellMana = Math.max(0, attacker.spellMana - 2);
    defender.hp = Math.min(defender.maxHp, defender.hp + 2);
    if (trapOwnerSide === 'player') fx.playerGateLabel = '+2';
    else fx.enemyGateLabel = '+2';
    logs.push({
      id: nextUid('log'),
      round,
      text: 'Oculto · Gogyō Fūin: o rival perdeu 2 de Reserva e sua Vitalidade curou 2!',
      tone: 'trap',
      actor: trapOwnerSide,
      cardId: trapCardId,
    });
  } else if (trapCardId === 'trap_arvore_genjutsu') {
    const targetUid =
      context?.summonedUnitUid && attacker.board.some((u) => u.uid === context.summonedUnitUid)
        ? context.summonedUnitUid
        : attacker.board[attacker.board.length - 1]?.uid;
    if (targetUid) {
      attacker.board = attacker.board.map((u) => {
        if (u.uid !== targetUid) return u;
        const kws = u.keywords.includes('Exposto')
          ? u.keywords
          : [...u.keywords, 'Exposto' as const];
        fx.unitFx[u.uid] = { type: 'hit', label: 'Paral. Exposto' };
        return { ...u, stunned: true, keywords: kws };
      });
      logs.push({
        id: nextUid('log'),
        round,
        text: 'Magen: Jubaku Satsu: a unidade invocada ficou Paralisada e Exposta!',
        tone: 'trap',
      });
    }
  }

  return {
    player: trapOwnerSide === 'player' ? defender : attacker,
    enemy: trapOwnerSide === 'player' ? attacker : defender,
    attackPairs: nextPairs,
    logs,
    fx,
  };
}

/**
 * IA: entre vários Ocultos com o mesmo gatilho, escolhe o que mais rende.
 * Heurística simples: simula cada oculto e pontua o estrago no lado inimigo
 * (Poder/Vida perdidos, abates, atacantes retirados do ataque, Reserva de Jutsu
 * drenada) e o ganho de Vida da Vitalidade do dono.
 */
export function chooseBestTrap(
  matching: TrapSlot[],
  trapOwnerSide: 'player' | 'enemy',
  player: PlayerState,
  enemy: PlayerState,
  attackPairs: CombatPair[],
  arenaId: ArenaId,
  round: number,
  context?: { attackerUids?: string[]; summonedUnitUid?: string }
): TrapSlot | undefined {
  if (matching.length <= 1) return matching[0];
  const opponentOf = (p: PlayerState, e: PlayerState) => (trapOwnerSide === 'player' ? e : p);
  const ownerOf = (p: PlayerState, e: PlayerState) => (trapOwnerSide === 'player' ? p : e);
  const boardValue = (st: PlayerState) =>
    st.board.reduce((sum, u) => sum + getUnitPower(u) + getUnitHealth(u), 0);
  const pairPower = (pairs: CombatPair[], st: PlayerState) =>
    pairs.reduce((sum, pair) => {
      const u = st.board.find((b) => b.uid === pair.attackerUid);
      return sum + (u ? getUnitPower(u) : 0);
    }, 0);

  const oppBefore = opponentOf(player, enemy);
  const ownBefore = ownerOf(player, enemy);
  let best = matching[0];
  let bestScore = -Infinity;
  for (const slot of matching) {
    const sim = resolveTrapEffect(slot.cardId, trapOwnerSide, player, enemy, attackPairs, arenaId, round, context);
    const oppAfter = opponentOf(sim.player, sim.enemy);
    const ownAfter = ownerOf(sim.player, sim.enemy);
    const kills = oppBefore.board.length - oppAfter.board.length;
    const stunned = oppAfter.board.filter(
      (u) => u.stunned && !oppBefore.board.find((b) => b.uid === u.uid)?.stunned
    ).length;
    const score =
      (boardValue(oppBefore) - boardValue(oppAfter)) +
      kills * 4 +
      stunned * 2 +
      (pairPower(attackPairs, oppBefore) - pairPower(sim.attackPairs, oppAfter)) * 1.5 +
      (oppBefore.spellMana - oppAfter.spellMana) * 1.5 +
      (ownAfter.hp - ownBefore.hp);
    if (score > bestScore) {
      bestScore = score;
      best = slot;
    }
  }
  return best;
}

export function checkEnemyTrapsOnEvent(
  eventType: 'attack' | 'jutsu' | 'summon',
  defender: PlayerState,
  attacker: PlayerState,
  attackPairs: CombatPair[],
  round: number,
  arenaId: ArenaId,
  summonedUnitUid?: string
): {
  defender: PlayerState;
  attacker: PlayerState;
  attackPairs: CombatPair[];
  logs: BattleLogEntry[];
} {
  const matching = getMatchingTraps(eventType, defender);
  if (matching.length === 0) {
    return { defender, attacker, attackPairs, logs: [] };
  }
  const chosen =
    chooseBestTrap(
      matching,
      matching[0].owner,
      matching[0].owner === 'player' ? defender : attacker,
      matching[0].owner === 'player' ? attacker : defender,
      attackPairs,
      arenaId,
      round,
      { attackerUids: attackPairs.map((pair) => pair.attackerUid), summonedUnitUid }
    ) || matching[0];
  const nextDefender = {
    ...defender,
    traps: defender.traps.filter((t) => t.uid !== chosen.uid),
  };
  const ownerSide = chosen.owner;
  const p = ownerSide === 'player' ? nextDefender : attacker;
  const e = ownerSide === 'player' ? attacker : nextDefender;
  const res = resolveTrapEffect(
    chosen.cardId,
    ownerSide,
    p,
    e,
    attackPairs,
    arenaId,
    round,
    {
      attackerUids: attackPairs.map((pair) => pair.attackerUid),
      summonedUnitUid,
    }
  );
  return {
    defender: ownerSide === 'player' ? res.player : res.enemy,
    attacker: ownerSide === 'player' ? res.enemy : res.player,
    attackPairs: res.attackPairs,
    logs: res.logs,
  };
}

export function resolveJutsuEffect(
  jutsu: JutsuCardDef,
  casterSide: 'player' | 'enemy',
  targetUid: string | undefined,
  player: PlayerState,
  enemy: PlayerState,
  arenaId: ArenaId,
  round: number,
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void
): {
  player: PlayerState;
  enemy: PlayerState;
  arenaId: ArenaId;
  logs: BattleLogEntry[];
  fx: CombatVisualFX;
} {
  let caster = casterSide === 'player' ? { ...player } : { ...enemy };
  let opponent = casterSide === 'player' ? { ...enemy } : { ...player };
  let nextArena = arenaId;
  const logs: BattleLogEntry[] = [];
  const fx: CombatVisualFX = { unitFx: {} };

  const resolveAllyTarget = (uid?: string): string | undefined => {
    if (uid && caster.board.some((u) => u.uid === uid)) return uid;
    return caster.board[0]?.uid;
  };

  const resolveEnemyTarget = (uid?: string): string | undefined => {
    if (uid && opponent.board.some((u) => u.uid === uid)) return uid;
    if (opponent.board.length === 0) return undefined;
    return [...opponent.board].sort((a, b) => getUnitPower(b) - getUnitPower(a))[0].uid;
  };

  const tryPopSpellShield = (uid: string): boolean => {
    const unit = opponent.board.find((u) => u.uid === uid);
    if (unit && unit.hasSpellShield) {
      opponent.board = opponent.board.map((u) =>
        u.uid === uid ? { ...u, hasSpellShield: false } : u
      );
      fx.unitFx[uid] = { type: 'jutsu', label: 'Anulação!' };
      logs.push({
        id: nextUid('ss'),
        round,
        text: `${getCardById(unit.cardId)?.name} anulou ${jutsu.name} com Anulação!`,
        tone: 'info',
      });
      return true;
    }
    return false;
  };

  const applyDestinadoOnAlly = (uid: string) => {
    caster.board = caster.board.map((u) => {
      if (u.uid !== uid) return u;
      if (!u.silenced && u.keywords.includes('Determinação') && !u.destinedTriggeredThisRound) {
        return {
          ...u,
          attack: u.attack + 1,
          health: u.health + 1,
          maxHealth: u.maxHealth + 1,
          destinedTriggeredThisRound: true,
        };
      }
      return u;
    });
  };

  let didDamage = false;
  let didHealOrBuff = false;

  switch (jutsu.id) {
    case 'jutsu_substituicao': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) =>
          u.uid === tid
            ? { ...u, hasBarrier: true, tempHealthBonus: u.tempHealthBonus + 2 }
            : u
        );
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: 'Esquiva +2' };
      }
      break;
    }
    case 'jutsu_chidori': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const stripped = { ...u, hasBarrier: false };
          const res = applyDamageToUnit(stripped, 3);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_raikiri': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const stripped = { ...u, hasBarrier: false, hasSpellShield: false };
          const res = applyDamageToUnit(stripped, 4);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_hiraishin': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Ágil')
            ? u.keywords
            : [...u.keywords, 'Ágil' as const];
          return { ...u, tempAttackBonus: u.tempAttackBonus + 2, keywords: kws };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: '+2/+0 Veloz' };
      }
      break;
    }
    case 'jutsu_rajada_shuriken': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 2);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      opponent.hp = Math.max(0, opponent.hp - 1);
      caster.damagedEnemyNexusThisRound = true;
      if (casterSide === 'player') fx.enemyGateLabel = '-1';
      else fx.playerGateLabel = '-1';
      break;
    }
    case 'jutsu_lamina_vento': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) =>
          u.uid === tid
            ? {
                ...u,
                stunned: false,
                tempAttackBonus: u.tempAttackBonus + 2,
                tempHealthBonus: u.tempHealthBonus + 1,
              }
            : u
        );
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: '+2/+1' };
      }
      break;
    }
    case 'jutsu_rasengan': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        let killed = false;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 5);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          if (getUnitHealth(res.unit) <= 0) killed = true;
          return res.unit;
        });
        if (killed) {
          opponent.hp = Math.max(0, opponent.hp - 2);
          caster.damagedEnemyNexusThisRound = true;
          if (casterSide === 'player') fx.enemyGateLabel = '-2';
          else fx.playerGateLabel = '-2';
        }
      }
      break;
    }
    case 'jutsu_rasenshuriken': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid === tid) {
            const res = applyDamageToUnit(u, 6);
            fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
            return res.unit;
          }
          fx.unitFx[u.uid] = { type: 'hit', label: '-1/-1' };
          return applyGloomToUnit(u, 1);
        });
      }
      opponent.hp = Math.max(0, opponent.hp - 2);
      caster.damagedEnemyNexusThisRound = true;
      if (casterSide === 'player') fx.enemyGateLabel = '-2';
      else fx.playerGateLabel = '-2';
      break;
    }
    case 'jutsu_bola_de_fogo': {
      didDamage = true;
      opponent.board = opponent.board.map((u) => {
        if (u.hasSpellShield) {
          fx.unitFx[u.uid] = { type: 'jutsu', label: 'Anulação!' };
          return { ...u, hasSpellShield: false };
        }
        const res = applyDamageToUnit(u, 2);
        fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
        return res.unit;
      });
      break;
    }
    case 'jutsu_goka_mekkyaku': {
      didDamage = true;
      opponent.board = opponent.board.map((u) => {
        if (u.hasSpellShield) {
          fx.unitFx[u.uid] = { type: 'jutsu', label: 'Anulação!' };
          return { ...u, hasSpellShield: false };
        }
        const res = applyDamageToUnit(u, 3);
        fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
        return res.unit;
      });
      opponent.hp = Math.max(0, opponent.hp - 2);
      caster.damagedEnemyNexusThisRound = true;
      if (casterSide === 'player') fx.enemyGateLabel = '-2';
      else fx.playerGateLabel = '-2';
      break;
    }
    case 'jutsu_edo_tensei': {
      {
        const summoned = summonUnitByEffect(TOKEN_CARDS.token_edo_shinobi, caster, casterSide, round, nextArena, logs);
        caster = summoned.ownerState;
        if (summoned.unit) fx.unitFx[summoned.unit.uid] = { type: 'jutsu', label: 'Edo Tensei' };
      }
      caster = drawCards(caster, 1);
      break;
    }
    case 'jutsu_manda': {
      {
        const summoned = summonUnitByEffect(TOKEN_CARDS.token_manda, caster, casterSide, round, nextArena, logs);
        caster = summoned.ownerState;
        if (summoned.unit) fx.unitFx[summoned.unit.uid] = { type: 'jutsu', label: 'Manda!' };
      }
      break;
    }
    case 'jutsu_rotacao_trigramas': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) =>
          u.uid === tid
            ? {
                ...u,
                hasBarrier: true,
                tempAttackBonus: u.tempAttackBonus + 1,
                tempHealthBonus: u.tempHealthBonus + 3,
              }
            : u
        );
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: '+1/+3' };
      }
      const enemyTarget = resolveEnemyTarget();
      if (enemyTarget && !tryPopSpellShield(enemyTarget)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== enemyTarget) return u;
          const res = applyDamageToUnit(u, 2);
          fx.unitFx[enemyTarget] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_128_palmas': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 3);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Selado` };
          return {
            ...res.unit,
            silenced: true,
            keywords: [],
            hasBarrier: false,
            hasSpellShield: false,
          };
        });
        opponent.spellMana = Math.max(0, opponent.spellMana - 1);
      }
      break;
    }
    case 'jutsu_dragao_agua': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 3);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Paral.` };
          return { ...res.unit, stunned: true };
        });
      }
      if (ARENA_EFFECTS_ENABLED) {
        nextArena = 'vale_do_fim';
        logs.push({
          id: nextUid('log'),
          round,
          text: `A Arena mudou para ${ARENAS[nextArena].name}.`,
          tone: 'arena',
        });
      }
      break;
    }
    case 'jutsu_daibakufu': {
      didDamage = true;
      const strongest = [...opponent.board].sort((a, b) => getUnitPower(b) - getUnitPower(a))[0];
      opponent.board = opponent.board.map((u) => {
        if (u.hasSpellShield) {
          fx.unitFx[u.uid] = { type: 'jutsu', label: 'Anulação!' };
          return { ...u, hasSpellShield: false };
        }
        const res = applyDamageToUnit(u, 2);
        const freeze = strongest && u.uid === strongest.uid;
        fx.unitFx[u.uid] = {
          type: 'hit',
          label: freeze ? `-${res.actualDamage} Bloq.Chakra` : `-${res.actualDamage}`,
        };
        return freeze ? { ...res.unit, frozen: true } : res.unit;
      });
      break;
    }
    case 'jutsu_daitoppa': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          const dmg = u.uid === tid ? 2 : 1;
          const res = applyDamageToUnit(u, dmg);
          fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_suna_shuriken': {
      didDamage = true;
      opponent.hp = Math.max(0, opponent.hp - 2);
      caster.damagedEnemyNexusThisRound = true;
      if (casterSide === 'player') fx.enemyGateLabel = '-2';
      else fx.playerGateLabel = '-2';
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Impacto')
            ? u.keywords
            : [...u.keywords, 'Impacto' as const];
          return { ...u, keywords: kws, impactStacks: u.impactStacks + 1 };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: 'Impacto' };
      }
      break;
    }
    case 'jutsu_palma_mistica': {
      const tid = resolveAllyTarget(targetUid);
      didHealOrBuff = true;
      if (tid) {
        caster.board = caster.board.map((u) => (u.uid === tid ? healUnit(u, 3) : u));
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: '+3 Vida' };
      }
      caster.hp = Math.min(caster.maxHp, caster.hp + 2);
      if (casterSide === 'player') fx.playerGateLabel = '+2';
      else fx.enemyGateLabel = '+2';
      break;
    }
    case 'jutsu_sozo_saisei': {
      const tid = resolveAllyTarget(targetUid);
      didHealOrBuff = true;
      if (tid) {
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Regenerar')
            ? u.keywords
            : [...u.keywords, 'Regenerar' as const];
          return {
            ...u,
            health: u.maxHealth + 2,
            maxHealth: u.maxHealth + 2,
            keywords: kws,
          };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: 'Regenerar!' };
      }
      break;
    }
    case 'jutsu_katsuyu_cura': {
      didHealOrBuff = true;
      caster.board = caster.board.map((u) => {
        fx.unitFx[u.uid] = { type: 'heal', label: '+3 Vida' };
        return healUnit(u, 3);
      });
      caster.hp = Math.min(caster.maxHp, caster.hp + 3);
      if (casterSide === 'player') fx.playerGateLabel = '+3';
      else fx.enemyGateLabel = '+3';
      break;
    }
    case 'jutsu_pilula_soldado': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const updated = {
            ...u,
            attack: u.attack + 2,
            health: u.health + 2,
            maxHealth: u.maxHealth + 2,
          };
          if (u.cardId === 'choji_akimichi' && u.evolutionLevel === 1 && updated.health >= 7) {
            return evolveUnitIfReady(
              { ...updated, evolutionProgress: updated.evolutionTarget },
              nextArena,
              onEvolve
            );
          }
          return updated;
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: '+2/+2' };
      }
      break;
    }
    case 'jutsu_cho_baika': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Perfurante')
            ? u.keywords
            : [...u.keywords, 'Perfurante' as const];
          return {
            ...u,
            tempAttackBonus: u.tempAttackBonus + 3,
            tempHealthBonus: u.tempHealthBonus + 3,
            keywords: kws,
          };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: '+3/+3 Perfur.' };
      }
      break;
    }
    case 'jutsu_rashomon': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Resistente')
            ? u.keywords
            : [...u.keywords, 'Resistente' as const];
          return {
            ...u,
            hasBarrier: true,
            tempHealthBonus: u.tempHealthBonus + 3,
            keywords: kws,
          };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: 'Substit. +3' };
      }
      break;
    }
    case 'jutsu_doryuheki': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) =>
          u.uid === tid
            ? { ...u, hasBarrier: true, tempHealthBonus: u.tempHealthBonus + 3 }
            : u
        );
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: 'Substit. +3' };
      }
      break;
    }
    case 'jutsu_clones_sombras': {
      {
        const summoned = summonUnitByEffect(TOKEN_CARDS.token_kage_bunshin, caster, casterSide, round, nextArena, logs);
        caster = summoned.ownerState;
        if (summoned.unit) fx.unitFx[summoned.unit.uid] = { type: 'jutsu', label: 'Clone!' };
      }
      caster = drawCards(caster, 1);
      break;
    }
    case 'jutsu_gamabunta': {
      {
        const summoned = summonUnitByEffect(TOKEN_CARDS.token_gamabunta, caster, casterSide, round, nextArena, logs);
        caster = summoned.ownerState;
        if (summoned.unit) fx.unitFx[summoned.unit.uid] = { type: 'jutsu', label: 'Gamabunta!' };
      }
      break;
    }
    case 'jutsu_vontade_fogo': {
      didHealOrBuff = true;
      caster.board = caster.board.map((u) => {
        fx.unitFx[u.uid] = { type: 'heal', label: '+1/+1' };
        return {
          ...u,
          attack: u.attack + 1,
          health: u.health + 1,
          maxHealth: u.maxHealth + 1,
        };
      });
      break;
    }
    case 'jutsu_sabaku_kyu': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 3);
          const kws = res.unit.keywords.includes('Exposto')
            ? res.unit.keywords
            : [...res.unit.keywords, 'Exposto' as const];
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Bloq.Chakra` };
          return { ...res.unit, frozen: true, keywords: kws };
        });
      }
      break;
    }
    case 'jutsu_shintenshin': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          fx.unitFx[tid] = { type: 'hit', label: 'Paral. Bloq.' };
          return { ...u, frozen: true, stunned: true };
        });
      }
      caster = drawCards(caster, 1);
      break;
    }
    case 'jutsu_jukai_kotan': {
      const sorted = [...opponent.board].sort((a, b) => getUnitPower(b) - getUnitPower(a));
      const stunIds = new Set(sorted.slice(0, 2).map((u) => u.uid));
      opponent.board = opponent.board.map((u) => {
        if (u.hasSpellShield) {
          fx.unitFx[u.uid] = { type: 'jutsu', label: 'Anulação!' };
          return { ...u, hasSpellShield: false };
        }
        const kws = u.keywords.includes('Exposto')
          ? u.keywords
          : [...u.keywords, 'Exposto' as const];
        const stunned = stunIds.has(u.uid) ? true : u.stunned;
        fx.unitFx[u.uid] = { type: 'hit', label: stunned ? 'Paral. Exposto' : 'Exposto' };
        return { ...u, stunned, keywords: kws };
      });
      break;
    }
    case 'jutsu_tsukuyomi': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const gloomed = applyGloomToUnit(u, 2);
          fx.unitFx[tid] = { type: 'hit', label: 'Selado -2/-2' };
          return {
            ...gloomed,
            silenced: true,
            stunned: true,
            keywords: [],
            hasBarrier: false,
            hasSpellShield: false,
          };
        });
      }
      break;
    }
    case 'jutsu_makyo_hyosho': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 2);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Bloq.Chakra` };
          return { ...res.unit, frozen: true };
        });
      }
      const otherWeakest = [...opponent.board]
        .filter((u) => u.uid !== tid && getUnitHealth(u) > 0)
        .sort((a, b) => getUnitHealth(a) - getUnitHealth(b))[0];
      if (otherWeakest) {
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== otherWeakest.uid) return u;
          const res = applyDamageToUnit(u, 1);
          fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_kirigakure': {
      didHealOrBuff = true;
      caster.board = caster.board.map((u) => {
        const kws = u.keywords.includes('Furtivo')
          ? u.keywords
          : [...u.keywords, 'Furtivo' as const];
        fx.unitFx[u.uid] = { type: 'jutsu', label: 'Furtivo' };
        return { ...u, keywords: kws };
      });
      break;
    }
    case 'jutsu_byakugan_rastreio': {
      if (opponent.traps.length > 0) {
        const [revealed, ...remaining] = opponent.traps;
        opponent.traps = remaining;
        const trapDef = getCardById(revealed.cardId);
        logs.push({
          id: nextUid('det'),
          round,
          text: `Byakugan achou e destruiu a oculto ${trapDef?.name || 'do rival'}.`,
          tone: 'trap',
        });
      } else {
        logs.push({
          id: nextUid('det'),
          round,
          text: 'Byakugan: nenhuma oculto encontrada.',
          tone: 'info',
        });
      }
      caster = drawCards(caster, 1);
      break;
    }
    case 'jutsu_kagura_shingan': {
      if (opponent.traps.length > 0) {
        const [revealed, ...remaining] = opponent.traps;
        opponent.traps = remaining;
        const trapDef = getCardById(revealed.cardId);
        logs.push({
          id: nextUid('det'),
          round,
          text: `Kagura Shingan achou e destruiu a oculto ${trapDef?.name || 'do rival'}.`,
          tone: 'trap',
        });
      } else {
        logs.push({
          id: nextUid('det'),
          round,
          text: 'Kagura Shingan: nenhuma oculto encontrada.',
          tone: 'info',
        });
      }
      break;
    }
    case 'jutsu_gatsuga': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          const dmg = u.uid === tid ? 2 : 1;
          const res = applyDamageToUnit(u, dmg);
          fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_kikaichu': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const gloomed = applyGloomToUnit(u, 1);
          const res = applyDamageToUnit(gloomed, 2);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Exaust.` };
          return res.unit;
        });
      }
      didHealOrBuff = true;
      caster.hp = Math.min(caster.maxHp, caster.hp + 2);
      if (casterSide === 'player') fx.playerGateLabel = '+2';
      else fx.enemyGateLabel = '+2';
      break;
    }
    case 'jutsu_magen_kurenai': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          fx.unitFx[tid] = { type: 'jutsu', label: 'Genjutsu -2/-0' };
          return {
            ...applyGenjutsu(u),
            tempAttackBonus: u.tempAttackBonus - 2,
          };
        });
        // Conta para a missão "Aplicar Genjutsu" da Kurenai (não usa Paralisia).
        caster = gainNinjaProgressOnBoard(caster, { type: 'genjutsu' }, { arenaId: nextArena, onEvolve }, opponent);
      }
      break;
    }
    case 'jutsu_omote_renge': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Ágil')
            ? u.keywords
            : [...u.keywords, 'Ágil' as const];
          return { ...u, tempAttackBonus: u.tempAttackBonus + 2, keywords: kws };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: '+2/+0 Veloz' };
      }
      break;
    }
    case 'jutsu_hachimon': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Perfurante')
            ? u.keywords
            : [...u.keywords, 'Perfurante' as const];
          return {
            ...u,
            tempAttackBonus: u.tempAttackBonus + 4,
            tempHealthBonus: u.tempHealthBonus + 2,
            keywords: kws,
          };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: '+4/+2 Perfur.' };
      }
      break;
    }
    case 'jutsu_kagemane_tecnica': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 1);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Paral.` };
          return { ...res.unit, stunned: true };
        });
      }
      break;
    }
    case 'jutsu_tsubaki_mai': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Resistente')
            ? u.keywords
            : [...u.keywords, 'Resistente' as const];
          return {
            ...u,
            tempAttackBonus: u.tempAttackBonus + 2,
            tempHealthBonus: u.tempHealthBonus + 2,
            keywords: kws,
          };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'heal', label: '+2/+2 Resist.' };
      }
      break;
    }
    case 'jutsu_kumo_sokai': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Exposto')
            ? u.keywords
            : [...u.keywords, 'Exposto' as const];
          fx.unitFx[tid] = { type: 'hit', label: 'Exposto' };
          return { ...u, keywords: kws };
        });
      }
      caster = drawCards(caster, 1);
      break;
    }
    case 'jutsu_magen_onsa': {
      didDamage = true;
      opponent.board = opponent.board.map((u) => {
        if (u.hasSpellShield) {
          fx.unitFx[u.uid] = { type: 'jutsu', label: 'Anulação!' };
          return { ...u, hasSpellShield: false };
        }
        fx.unitFx[u.uid] = { type: 'hit', label: 'Exaustão -1/-1' };
        return applyGloomToUnit(u, 1);
      });
      break;
    }
    case 'jutsu_kugutsu_marionete': {
      {
        const summoned = summonUnitByEffect(TOKEN_CARDS.token_karasu, caster, casterSide, round, nextArena, logs);
        caster = summoned.ownerState;
        if (summoned.unit) fx.unitFx[summoned.unit.uid] = { type: 'jutsu', label: 'Karasu!' };
      }
      break;
    }
    case 'jutsu_seneijashu': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 2);
          const kws = res.unit.keywords.includes('Exposto')
            ? res.unit.keywords
            : [...res.unit.keywords, 'Exposto' as const];
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage} Exposto` };
          return { ...res.unit, keywords: kws };
        });
      }
      break;
    }
    case 'jutsu_mikazuki_mai': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => {
          if (u.uid !== tid) return u;
          const kws = u.keywords.includes('Furtivo')
            ? u.keywords
            : [...u.keywords, 'Furtivo' as const];
          return { ...u, tempAttackBonus: u.tempAttackBonus + 2, keywords: kws };
        });
        applyDestinadoOnAlly(tid);
        fx.unitFx[tid] = { type: 'jutsu', label: '+2/+0 Furtivo' };
      }
      break;
    }
    // ---- Jutsus Exclusivos criados no Grupo 6 ----
    case 'jutsu_doton_domu': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        opponent.board = opponent.board.map((u) => (u.uid === tid ? { ...u, stunned: true } : u));
        fx.unitFx[tid] = { type: 'jutsu', label: 'Paralisado' };
      }
      break;
    }
    case 'jutsu_chakra_no_mesu': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 2);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return sealUntilRoundEnd(res.unit);
        });
      }
      break;
    }
    case 'jutsu_kamaitachi': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          const res = applyDamageToUnit(u, u.uid === tid ? 2 : 1);
          fx.unitFx[u.uid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_dainamikku_entori': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 3);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit.keywords.includes('Exposto')
            ? res.unit
            : { ...res.unit, keywords: [...res.unit.keywords, 'Exposto'] };
        });
      }
      break;
    }
    case 'jutsu_shiki_fujin': {
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        const sealed = opponent.board.find((u) => u.uid === tid);
        opponent.board = opponent.board.filter((u) => u.uid !== tid);
        logs.push({
          id: nextUid('shiki'),
          round,
          text: `Shiki Fūjin: ${getCardById(sealed?.cardId ?? '')?.name ?? 'a unidade'} foi selada e removida do jogo.`,
          tone: 'jutsu',
          actor: casterSide,
        });
        caster.board = caster.board.map((u) =>
          u.cardId === 'hiruzen_sarutobi'
            ? { ...u, ninjaState: { ...(u.ninjaState ?? {}), morre_fim_rodada: 1 } }
            : u
        );
      }
      break;
    }
    case 'jutsu_fuma_shuriken': {
      // TODO Grupo 8: dano da Fūma NÃO decidido — mantido 2 (valor atual / ex-bonusAttack).
      const tid = resolveEnemyTarget(targetUid);
      if (tid && !tryPopSpellShield(tid)) {
        didDamage = true;
        opponent.board = opponent.board.map((u) => {
          if (u.uid !== tid) return u;
          const res = applyDamageToUnit(u, 2);
          fx.unitFx[tid] = { type: 'hit', label: `-${res.actualDamage}` };
          return res.unit;
        });
      }
      break;
    }
    case 'jutsu_kai': {
      const tid = resolveAllyTarget(targetUid);
      if (tid) {
        didHealOrBuff = true;
        caster.board = caster.board.map((u) => (u.uid === tid ? applyKai(u) : u));
        fx.unitFx[tid] = { type: 'jutsu', label: 'Kai' };
        logs.push({
          id: nextUid('kai'),
          round,
          text: `Kai: Genjutsu e Selado removidos de ${getCardById(caster.board.find((u) => u.uid === tid)?.cardId ?? '')?.name ?? 'aliado'}.`,
          tone: 'jutsu',
          actor: casterSide,
          cardId: jutsu.id,
        });
      }
      break;
    }
  }

  // Process deaths from spell damage (including equipment returns!)
  const deathRes = processBoardDeaths(opponent, caster, round, nextArena, logs, onEvolve);
  opponent = deathRes.ownerState;
  caster = deathRes.oppState;

  // Arena Chunin bonus for Instantâneo jutsus
  if (jutsu.speed === 'Imediata' && activeArenaRule(nextArena) === 'arena_chunin') {
    const tid = resolveAllyTarget(targetUid);
    if (tid) {
      caster.board = caster.board.map((u) =>
        u.uid === tid
          ? {
              ...u,
              tempAttackBonus: u.tempAttackBonus + 1,
              tempHealthBonus: u.tempHealthBonus + 1,
            }
          : u
      );
    }
  }

  // Habilidades recorrentes (Grupo 4): Ao conjurar.
  {
    const rc = runRecurringTrigger('ao_conjurar', caster, opponent, { round, arenaId: nextArena, onEvolve, fx, logs });
    caster = rc.owner;
    opponent = rc.opp;
    if (rc.fired > 0) {
      const d1 = processBoardDeaths(opponent, caster, round, nextArena, logs, onEvolve);
      opponent = d1.ownerState;
      caster = d1.oppState;
      const d2 = processBoardDeaths(caster, opponent, round, nextArena, logs, onEvolve);
      caster = d2.ownerState;
      opponent = d2.oppState;
    }
  }

  // Ninjas do conjurador: "Ao conjurar um Jutsu" e promoção por Jutsu (Exclusivo ou condição da patente).
  for (const u of caster.board) {
    const def = getCardById(u.cardId);
    if (def?.kind === 'ninja' && def.signatureJutsuId === jutsu.id && !u.silenced && u.evolutionLevel < getNinjaMaxRank(def)) {
      logs.push({
        id: nextUid('sigprog'),
        round,
        text: `${jutsu.name} avançou a Promoção de ${def.name}.`,
        tone: 'evolution',
      });
    }
  }
  const castRes = applyNinjaCastHooks(
    jutsu,
    casterSide,
    caster,
    opponent,
    { didDamage, didHeal: didHealOrBuff && jutsu.category === 'Cura' },
    { round, arenaId: nextArena, logs, onEvolve }
  );
  caster = castRes.owner;
  opponent = castRes.opp;
  if (opponent.board.some((u) => getUnitHealth(u) <= 0)) {
    const castDeaths = processBoardDeaths(opponent, caster, round, nextArena, logs, onEvolve);
    opponent = castDeaths.ownerState;
    caster = castDeaths.oppState;
  }

  caster.spellsCastThisRound += 1;

  // Copiar (Grupo 5): o rival pode criar uma cópia Fugaz deste Jutsu; consome a cópia Fugaz de quem conjurou.
  const copied = applyCopiarOnResolve(jutsu, caster, opponent, round, casterSide === 'player' ? 'enemy' : 'player');
  caster = copied.caster;
  if (copied.observer !== opponent && copied.observer.copyUsedRound === round && opponent.copyUsedRound !== round) {
    // A cópia conta para a promoção de quem copiou (Sasuke Chuunin, Kakashi Chuunin).
    const copier = copied.observer.board.find((u) => !u.silenced && u.keywords.includes('Copiar'));
    opponent = copier
      ? {
          ...copied.observer,
          board: copied.observer.board.map((u) =>
            u.uid === copier.uid ? gainNinjaProgress(u, { type: 'copy' }, copied.observer, { arenaId: nextArena, onEvolve }) : u
          ),
        }
      : copied.observer;
  } else {
    opponent = copied.observer;
  }
  logs.push(...copied.logs);

  return {
    player: casterSide === 'player' ? caster : opponent,
    enemy: casterSide === 'player' ? opponent : caster,
    arenaId: nextArena,
    logs,
    fx,
  };
}

export function resolveCombatPairs(
  pairs: CombatPair[],
  attackerSide: 'player' | 'enemy',
  player: PlayerState,
  enemy: PlayerState,
  arenaId: ArenaId,
  round: number,
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void
): {
  player: PlayerState;
  enemy: PlayerState;
  logs: BattleLogEntry[];
  fx: CombatVisualFX;
  rallyGranted: boolean;
} {
  let attState = attackerSide === 'player' ? { ...player } : { ...enemy };
  let defState = attackerSide === 'player' ? { ...enemy } : { ...player };
  const logs: BattleLogEntry[] = [];
  const fx: CombatVisualFX = { unitFx: {} };

  // Vale do Fim bonus for isolated 1-2 attackers
  const valeBonus = activeArenaRule(arenaId) === 'vale_do_fim' && pairs.length > 0 && pairs.length <= 2 ? 2 : 0;

  // Batedor de Suna (texto da carta; a palavra-chave Batedor foi cortada no Grupo 5):
  // se só Batedores de Suna atacarem, na 1ª vez na rodada, recarrega a Ficha de Ataque.
  const allScouts =
    pairs.length > 0 &&
    pairs.every((p) => {
      const u = attState.board.find((b) => b.uid === p.attackerUid);
      return u && !u.silenced && SECOND_ATTACK_UNIT_ID !== null && u.cardId === SECOND_ATTACK_UNIT_ID;
    });
  let rallyGranted = false;
  if (allScouts && !attState.scoutAttackUsedThisRound) {
    attState.scoutAttackUsedThisRound = true;
    rallyGranted = true;
    logs.push({
      id: nextUid('scout'),
      round,
      text: 'Batedor de Suna: pode atacar de novo nesta rodada.',
      tone: 'combat',
    });
  }

  // Apply Sagrado (Hallowed) to 1st attacker + Auxiliar (Support) to right neighbor
  if (attState.hallowedBonus > 0 && pairs.length > 0) {
    const firstUid = pairs[0].attackerUid;
    const bonus = attState.hallowedBonus;
    attState.hallowedBonus = 0;
    attState.board = attState.board.map((u) =>
      u.uid === firstUid ? { ...u, tempAttackBonus: u.tempAttackBonus + bonus } : u
    );
  }

  for (let i = 0; i < pairs.length - 1; i++) {
    const sup = attState.board.find((u) => u.uid === pairs[i].attackerUid);
    const rightUid = pairs[i + 1].attackerUid;
    if (sup && !sup.silenced && sup.keywords.includes('Apoio')) {
      const auxBonus = sup.evolutionLevel === 3 ? 2 : 1;
      attState.board = attState.board.map((u) =>
        u.uid === rightUid
          ? {
              ...u,
              tempAttackBonus: u.tempAttackBonus + auxBonus,
              tempHealthBonus: u.tempHealthBonus + auxBonus,
            }
          : u
      );
    }
  }

  // Repouso: quem ataca ou bloqueia "agiu" nesta rodada.
  attState = markUnitsActed(attState, pairs.map((p) => p.attackerUid));
  defState = markUnitsActed(defState, pairs.map((p) => p.blockerUid).filter((x): x is string => Boolean(x)));

  /** Grava as cópias locais no campo, dispara um gatilho recorrente e relê as unidades. */
  const runCombatTrigger = (
    trigger: 'ao_bloquear' | 'ao_golpear',
    side: 'att' | 'def',
    sourceUid: string,
    combatEnemyUid: string | undefined,
    au: BoardUnit,
    du: BoardUnit | undefined
  ): { au: BoardUnit; du: BoardUnit | undefined } => {
    attState.board = attState.board.map((u) => (u.uid === au.uid ? au : u));
    if (du) defState.board = defState.board.map((u) => (u.uid === du.uid ? du : u));
    if (side === 'att') {
      const r = runRecurringTrigger(trigger, attState, defState, { round, arenaId, sourceUids: [sourceUid], combatEnemyUid, onEvolve, fx, logs });
      attState = r.owner;
      defState = r.opp;
    } else {
      const r = runRecurringTrigger(trigger, defState, attState, { round, arenaId, sourceUids: [sourceUid], combatEnemyUid, onEvolve, fx, logs });
      defState = r.owner;
      attState = r.opp;
    }
    return {
      au: attState.board.find((u) => u.uid === au.uid) ?? au,
      du: du ? defState.board.find((u) => u.uid === du.uid) ?? du : undefined,
    };
  };

  const ninjaCtx = { round, arenaId, logs, onEvolve };
  for (const pair of pairs) {
    let attUnit = attState.board.find((u) => u.uid === pair.attackerUid);
    if (!attUnit || getUnitHealth(attUnit) <= 0) continue;

    let defUnit = pair.blockerUid
      ? defState.board.find((u) => u.uid === pair.blockerUid)
      : undefined;

    const attCard = getCardById(attUnit.cardId) as NinjaCardDef | UnitCardDef;
    // (merge) Emboscada/Espreitar foi cortada no Grupo 5: sem bônus de espreita.
    const isLurk = 0;
    let attPower = Math.max(0, getUnitPower(attUnit) + valeBonus + isLurk);

    fx.unitFx[attUnit.uid] = {
      type: attackerSide === 'player' ? 'lunge-up' : 'lunge-down',
    };

    // Impacto bonus on attack strike
    const impactDamage = !attUnit.silenced ? attUnit.impactStacks : 0;
    if (impactDamage > 0) {
      defState.hp = Math.max(0, defState.hp - impactDamage);
      attState.damagedEnemyNexusThisRound = true;
      pushKeywordFx(fx, attUnit.uid, 'ataque_portao');
    }
    if (!attUnit.silenced && attUnit.keywords.includes('Muralha')) {
      pushKeywordFx(fx, attUnit.uid, 'muralha');
    }

    if (!defUnit) {
      // Unblocked: strikes Vitalidade (twice if Ataque Duplo!)
      const strikes = !attUnit.silenced && attUnit.keywords.includes('Veloz') ? 2 : 1;
      if (strikes === 2) pushKeywordFx(fx, attUnit.uid, 'combo');
      const totalNexusDmg = attPower * strikes;
      defState.hp = Math.max(0, defState.hp - totalNexusDmg);
      if (totalNexusDmg > 0) {
        attState.damagedEnemyNexusThisRound = true;
        if (attackerSide === 'player') fx.enemyGateLabel = `-${totalNexusDmg + impactDamage}`;
        else fx.playerGateLabel = `-${totalNexusDmg + impactDamage}`;
      }

      if (
        !attUnit.silenced &&
        (attUnit.keywords.includes('Drenar') || attUnit.keywords.includes('Roubo de Vida')) &&
        totalNexusDmg > 0
      ) {
        attState.hp = Math.min(attState.maxHp, attState.hp + totalNexusDmg);
        pushKeywordFx(fx, attUnit.uid, 'absorcao');
      }

      logs.push({
        id: nextUid('log'),
        round,
        text: `${attCard.name} causou ${totalNexusDmg + impactDamage} de dano à Vitalidade!`,
        tone: 'combat',
      });

      // Ao golpear (Grupo 4): golpe na Vitalidade.
      if (attPower > 0) {
        attUnit = runCombatTrigger('ao_golpear', 'att', attUnit.uid, undefined, attUnit, undefined).au;
      }

      // Ninjas: Ao golpear e promoção (golpe na Vitalidade).
      {
        const post = applyNinjaPostStrike(attUnit, undefined, attState, defState, {
          damageDealt: totalNexusDmg,
          killed: false,
          attHadBarrier: attUnit.hasBarrier,
          defHadBarrier: false,
          attHealthBefore: getUnitHealth(attUnit),
          defHealthBefore: 0,
        }, ninjaCtx);
        attUnit = post.att;
        attState = post.attState;
        defState = post.defState;
      }
      // Efêmero dies after striking
      if (!attUnit.silenced && attUnit.keywords.includes('Clone')) {
        attUnit = { ...attUnit, health: -999 };
      }
      attState.board = attState.board.map((u) => (u.uid === attUnit!.uid ? attUnit! : u));
      continue;
    }

    const defCard = getCardById(defUnit.cardId) as NinjaCardDef | UnitCardDef;

    // Ao bloquear (Grupo 4): antes dos golpes.
    {
      const r = runCombatTrigger('ao_bloquear', 'def', defUnit.uid, attUnit.uid, attUnit, defUnit);
      attUnit = r.au;
      defUnit = r.du!;
      if (getUnitHealth(attUnit) <= 0) {
        attState.board = attState.board.map((u) => (u.uid === attUnit!.uid ? attUnit! : u));
        defState.board = defState.board.map((u) => (u.uid === defUnit!.uid ? defUnit! : u));
        continue;
      }
    }

    // Unidades (Grupo 7): efeitos antes do golpe (Dosu: 1 de dano ao bloqueador).
    defUnit = applyUnitPreStrike(attUnit, defUnit);

    // Ninjas: efeitos antes da troca de golpes (Zabuza/Kisame, Kidōmaru, Gaara, Hinata, Haku, Jirōbō).
    {
      const pre = applyNinjaPreStrike(attUnit, defUnit, attState, defState, Boolean(pair.forced), ninjaCtx);
      attUnit = pre.att;
      defUnit = pre.def;
      attState = pre.attState;
      defState = pre.defState;
      attPower = Math.max(0, getUnitPower(attUnit) + valeBonus + isLurk);
    }
    const defPower = getUnitPower(defUnit);
    const attHealthBefore = getUnitHealth(attUnit);
    const attHadBarrier = attUnit.hasBarrier;
    const defHealthBefore = getUnitHealth(defUnit);
    const defHadBarrier = defUnit.hasBarrier;

    const hasDoubleAttack = !attUnit.silenced && attUnit.keywords.includes('Veloz');
    const hasQuickAttack =
      hasDoubleAttack || (!attUnit.silenced && attUnit.keywords.includes('Ágil'));

    if (hasDoubleAttack) pushKeywordFx(fx, attUnit.uid, 'combo');
    else if (hasQuickAttack) pushKeywordFx(fx, attUnit.uid, 'golpe_veloz');
    if (!defUnit.silenced && defUnit.keywords.includes('Resistente') && !defUnit.hasBarrier && attPower > 0) {
      pushKeywordFx(fx, defUnit.uid, 'resistente');
    }

    // First strike (Attacker strikes Defender)
    const preDefHp = getUnitHealth(defUnit);
    const defHit1 = applyDamageToUnit(defUnit, attPower);
    defUnit = poisonOnStrike(attUnit, defHit1.unit, defHit1.actualDamage);
    let totalDamageToDef = defHit1.actualDamage;

    if (!attUnit.silenced && attUnit.keywords.includes('Perfurante') && defHit1.actualDamage > preDefHp) {
      const excess = defHit1.actualDamage - preDefHp;
      defState.hp = Math.max(0, defState.hp - excess);
      attState.damagedEnemyNexusThisRound = true;
      pushKeywordFx(fx, attUnit.uid, 'perfurante');
      if (attackerSide === 'player') fx.enemyGateLabel = `-${excess} Perfurante`;
      else fx.playerGateLabel = `-${excess} Perfurante`;
    }

    let defSurvived = getUnitHealth(defUnit) > 0;

    // Defender strikes back unless killed by Quick/Double Attack
    let defStruck = false;
    if (!hasQuickAttack || defSurvived) {
      defStruck = defPower > 0;
      if (!attUnit.silenced && attUnit.keywords.includes('Resistente') && !attUnit.hasBarrier && defPower > 0) {
        pushKeywordFx(fx, attUnit.uid, 'resistente');
      }
      const attHit = applyDamageToUnit(attUnit, defPower);
      attUnit = poisonOnStrike(defUnit, attHit.unit, attHit.actualDamage);
      if (attHit.actualDamage > 0) {
        fx.unitFx[attUnit.uid] = { type: 'hit', label: `-${attHit.actualDamage}` };
      }
    }

    // Second strike of Ataque Duplo if both still alive (or overwhelms)
    if (hasDoubleAttack && getUnitHealth(attUnit) > 0 && defSurvived) {
      const preDefHp2 = getUnitHealth(defUnit);
      const defHit2 = applyDamageToUnit(defUnit, attPower);
      defUnit = poisonOnStrike(attUnit, defHit2.unit, defHit2.actualDamage);
      totalDamageToDef += defHit2.actualDamage;
      if (!attUnit.silenced && attUnit.keywords.includes('Perfurante') && defHit2.actualDamage > preDefHp2) {
        const excess2 = defHit2.actualDamage - preDefHp2;
        defState.hp = Math.max(0, defState.hp - excess2);
        attState.damagedEnemyNexusThisRound = true;
        pushKeywordFx(fx, attUnit.uid, 'perfurante');
      }
      defSurvived = getUnitHealth(defUnit) > 0;
    }

    // (merge 4+5+7) Veneno do Grupo 5 já é aplicado em cada golpe (poisonOnStrike); o substituto do Grupo 7 saiu.

    fx.unitFx[defUnit.uid] = {
      type: 'hit',
      label: totalDamageToDef > 0 ? `-${totalDamageToDef}` : 'Esquiva!',
    };

    if (
      !attUnit.silenced &&
      (attUnit.keywords.includes('Drenar') || attUnit.keywords.includes('Roubo de Vida')) &&
      totalDamageToDef > 0
    ) {
      attState.hp = Math.min(attState.maxHp, attState.hp + totalDamageToDef);
      pushKeywordFx(fx, attUnit.uid, 'absorcao');
    }

    if (!defSurvived) {
      if (!attUnit.silenced && attUnit.keywords.includes('Fúria')) {
        pushKeywordFx(fx, attUnit.uid, 'sede_batalha');
        attUnit = {
          ...attUnit,
          attack: attUnit.attack + 1,
          health: attUnit.health + 1,
          maxHealth: attUnit.maxHealth + 1,
        };
      }
    }

    // Ninjas: Ao golpear, Teimosia, Armadura de Areia e promoção dos dois lados.
    {
      const post = applyNinjaPostStrike(attUnit, defUnit, attState, defState, {
        damageDealt: totalDamageToDef,
        killed: !defSurvived,
        attHadBarrier,
        defHadBarrier,
        attHealthBefore,
        defHealthBefore,
      }, ninjaCtx);
      attUnit = post.att;
      defUnit = post.def ?? defUnit;
      attState = post.attState;
      defState = post.defState;
    }

    // Ao golpear (Grupo 4): atacante e bloqueador que golpearam e seguem vivos.
    if (attPower > 0 && getUnitHealth(attUnit) > 0) {
      const r = runCombatTrigger('ao_golpear', 'att', attUnit.uid, defUnit.uid, attUnit, defUnit);
      attUnit = r.au;
      defUnit = r.du!;
    }
    if (defStruck && getUnitHealth(defUnit) > 0) {
      const r = runCombatTrigger('ao_golpear', 'def', defUnit.uid, attUnit.uid, attUnit, defUnit);
      attUnit = r.au;
      defUnit = r.du!;
    }
    defSurvived = getUnitHealth(defUnit) > 0;

    // Efêmero dies after striking
    if (!attUnit.silenced && attUnit.keywords.includes('Clone')) {
      attUnit = { ...attUnit, health: -999 };
    }

    logs.push({
      id: nextUid('log'),
      round,
      text: `${attCard.name} (Poder ${attPower}) contra ${defCard.name} (Poder ${defPower}).`,
      tone: 'combat',
    });

    attState.board = attState.board.map((u) => (u.uid === attUnit!.uid ? attUnit! : u));
    defState.board = defState.board.map((u) => (u.uid === defUnit!.uid ? defUnit! : u));
  }

  // Process all deaths (including Imortal, Equipment returns, Sagrado, Orochimaru)
  const attDeaths = processBoardDeaths(attState, defState, round, arenaId, logs, onEvolve);
  attState = attDeaths.ownerState;
  defState = attDeaths.oppState;

  const defDeaths = processBoardDeaths(defState, attState, round, arenaId, logs, onEvolve);
  defState = defDeaths.ownerState;
  attState = defDeaths.oppState;

  // Números flutuantes dos Portões = variação TOTAL do combate (soma de todos os pares,
  // Perfurante, Impacto e curas), para bater com a soma das linhas do Registro.
  const finalPlayer = attackerSide === 'player' ? attState : defState;
  const finalEnemy = attackerSide === 'player' ? defState : attState;
  const gateDelta = (before: number, after: number) =>
    after === before ? undefined : after < before ? `-${before - after}` : `+${after - before}`;
  fx.playerGateLabel = gateDelta(player.hp, finalPlayer.hp);
  fx.enemyGateLabel = gateDelta(enemy.hp, finalEnemy.hp);

  return {
    player: finalPlayer,
    enemy: finalEnemy,
    logs,
    fx,
    rallyGranted,
  };
}
