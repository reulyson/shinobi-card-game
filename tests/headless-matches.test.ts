/**
 * Grupo 6 · partidas headless (sem React): IA simples dos dois lados, usando só o motor e os ganchos
 * dos Ninjas. Objetivo: nenhuma exceção, nenhum NaN, campo/mão dentro dos limites.
 * Rodar: npx tsx tests/headless-matches.test.ts [partidas]
 */
import {
  ALL_CARDS,
  DECK_PRESETS,
  NINJA_CARDS,
  getCardById,
  isDeckableCard,
  validateDeck,
} from '../src/data/cards';
import {
  attachEquipmentToUnit,
  canBlockAttacker,
  canPayCard,
  canUnitAttack,
  checkEnemyTrapsOnEvent,
  createInitialPlayerState,
  drawCards,
  getUnitHealth,
  getUnitPower,
  healUnit,
  processBoardDeaths,
  resolveCombatPairs,
  resolveJutsuEffect,
  spendManaForCard,
  summonUnitByEffect,
} from '../src/engine/battleEngine';
import {
  applyNinjaAttackTriggers,
  applyNinjaEntry,
  applyNinjaEquipHooks,
  applyNinjaRoundEnd,
  applyNinjaRoundStart,
} from '../src/engine/ninjaEffects';
import type { ArenaId, BattleLogEntry, CombatPair, EquipmentCardDef, JutsuCardDef, PlayerState } from '../src/types/game';

type Side = 'player' | 'enemy';
const ARENAS: ArenaId[] = ['vale_do_fim', 'floresta_da_morte', 'arena_chunin', 'telhados_konoha'];
const N = Number(process.argv[2] ?? 40);

function check(st: PlayerState, where: string) {
  const bad = (x: number) => typeof x !== 'number' || Number.isNaN(x);
  if (bad(st.hp) || bad(st.mana) || bad(st.spellMana)) throw new Error(`${where}: NaN em recursos`);
  if (st.board.length > 5) throw new Error(`${where}: campo com ${st.board.length}`);
  if (st.hand.length > 9) throw new Error(`${where}: mão com ${st.hand.length}`);
  for (const u of st.board) {
    if (bad(u.attack) || bad(u.health) || bad(u.maxHealth) || bad(u.tempAttackBonus) || bad(u.evolutionProgress)) {
      throw new Error(`${where}: NaN em ${u.cardId}`);
    }
    if (!getCardById(u.cardId)) throw new Error(`${where}: carta desconhecida ${u.cardId}`);
  }
  for (const id of st.hand) if (!getCardById(id)) throw new Error(`${where}: carta desconhecida na mão ${id}`);
}

function randomDeck(ninjaIds: string[]): string[] {
  const pool = ALL_CARDS.filter((c) => c.kind !== 'ninja' && isDeckableCard(c));
  const deck: string[] = [];
  for (const id of ninjaIds) deck.push(id, id);
  const counts: Record<string, number> = {};
  while (deck.length < 24) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if ((counts[c.id] ?? 0) >= 3) continue;
    counts[c.id] = (counts[c.id] ?? 0) + 1;
    deck.push(c.id);
  }
  return deck;
}

function playMain(side: Side, P: { player: PlayerState; enemy: PlayerState }, round: number, arena: ArenaId, logs: BattleLogEntry[]) {
  for (let guard = 0; guard < 12; guard++) {
    const me = P[side];
    const idx = me.hand.findIndex((id, i) => {
      const c = getCardById(id);
      return c && c.kind !== 'token' && canPayCard(c, me, arena, i);
    });
    if (idx < 0) return;
    const card = getCardById(me.hand[idx])!;
    let caster = spendManaForCard(me, card, arena, idx);
    caster = { ...caster, hand: caster.hand.filter((_, i) => i !== idx), cardsPlayedThisRound: caster.cardsPlayedThisRound + 1 };
    const oppSide: Side = side === 'player' ? 'enemy' : 'player';
    let opp = P[oppSide];
    if (card.kind === 'ninja' || card.kind === 'unidade') {
      const res = summonUnitByEffect(card, caster, side, round, arena, logs);
      caster = res.ownerState;
      if (res.unit && card.kind === 'ninja') {
        const e = applyNinjaEntry(card, res.unit.uid, side, caster, opp, { round, arenaId: arena, logs });
        caster = e.owner;
        opp = e.opp;
      }
      const d = processBoardDeaths(opp, caster, round, arena, logs);
      opp = d.ownerState;
      caster = d.oppState;
      P[side] = caster;
      P[oppSide] = opp;
    } else if (card.kind === 'jutsu' && card.speed === 'Oculta' && card.triggerType) {
      caster = { ...caster, traps: [...caster.traps, { uid: `t${Math.random()}`, cardId: card.id, owner: side, armedRound: round }] };
      P[side] = caster;
    } else if (card.kind === 'jutsu') {
      P[side] = caster;
      const r = resolveJutsuEffect(card as JutsuCardDef, side, undefined, P.player, P.enemy, arena, round);
      P.player = r.player;
      P.enemy = r.enemy;
      logs.push(...r.logs);
    } else if (card.kind === 'equipamento') {
      const target = caster.board[0];
      if (target) {
        const r = attachEquipmentToUnit(card as EquipmentCardDef, target, caster);
        caster = applyNinjaEquipHooks(r.ownerState, { arenaId: arena });
      }
      P[side] = caster;
    }
    check(P.player, `main ${card.id}`);
    check(P.enemy, `main ${card.id}`);
  }
}

function attack(side: Side, P: { player: PlayerState; enemy: PlayerState }, round: number, arena: ArenaId, logs: BattleLogEntry[]) {
  const defSide: Side = side === 'player' ? 'enemy' : 'player';
  const uids = P[side].board.filter((u) => canUnitAttack(u) && getUnitPower(u) > 0).map((u) => u.uid);
  if (uids.length === 0) return;
  const trig = applyNinjaAttackTriggers(uids, side, P[side], P[defSide], { round, arenaId: arena, logs });
  let att = trig.owner;
  let def = trig.opp;
  const d1 = processBoardDeaths(att, def, round, arena, logs);
  att = d1.ownerState;
  def = d1.oppState;
  const d2 = processBoardDeaths(def, att, round, arena, logs);
  def = d2.ownerState;
  att = d2.oppState;
  let pairs: CombatPair[] = uids.filter((uid) => att.board.some((u) => u.uid === uid)).map((uid) => ({ attackerUid: uid, blockerUid: null }));
  const trap = checkEnemyTrapsOnEvent('attack', def, att, pairs, round, arena);
  def = trap.defender;
  att = trap.attacker;
  pairs = trap.attackPairs.filter((p) => att.board.some((u) => u.uid === p.attackerUid));
  const used = new Set<string>();
  pairs = pairs.map((p) => {
    const a = att.board.find((u) => u.uid === p.attackerUid)!;
    const b = def.board.find((bl) => !used.has(bl.uid) && canBlockAttacker(bl, a).ok && getUnitHealth(bl) > getUnitPower(a) - 1);
    if (b && Math.random() < 0.75) {
      used.add(b.uid);
      return { ...p, blockerUid: b.uid };
    }
    return p;
  });
  P[side] = att;
  P[defSide] = def;
  const r = resolveCombatPairs(pairs, side, P.player, P.enemy, arena, round);
  P.player = r.player;
  P.enemy = r.enemy;
  logs.push(...r.logs);
  check(P.player, 'combate');
  check(P.enemy, 'combate');
}

function nextRound(P: { player: PlayerState; enemy: PlayerState }, round: number, arena: ArenaId, logs: BattleLogEntry[]) {
  const endCtx = { round, arenaId: arena, logs };
  let r = applyNinjaRoundEnd('player', P.player, P.enemy, endCtx);
  P.player = r.owner; P.enemy = r.opp;
  r = applyNinjaRoundEnd('enemy', P.enemy, P.player, endCtx);
  P.enemy = r.owner; P.player = r.opp;
  const nr = round + 1;
  const prep = (st: PlayerState): PlayerState => ({
    ...st,
    maxMana: Math.min(10, nr),
    mana: Math.min(10, nr),
    spellMana: Math.min(3, st.spellMana + st.mana),
    cardsPlayedThisRound: 0,
    spellsCastLastRound: st.spellsCastThisRound,
    spellsCastThisRound: 0,
    damagedEnemyNexusThisRound: false,
    scoutAttackUsedThisRound: false,
    board: st.board.map((u) => {
      let x = { ...u, tempAttackBonus: 0, tempHealthBonus: 0, hasBarrier: false, stunned: false, frozen: false, canAttackThisRound: true };
      if (!x.silenced && x.keywords.includes('Clone')) x = { ...x, health: -999 };
      if (!x.silenced && x.keywords.includes('Regenerar')) x = healUnit(x, x.maxHealth);
      return x;
    }),
  });
  P.player = prep(P.player);
  P.enemy = prep(P.enemy);
  for (const s of ['player', 'enemy'] as Side[]) {
    const o: Side = s === 'player' ? 'enemy' : 'player';
    const d = processBoardDeaths(P[s], P[o], nr, arena, logs);
    P[s] = drawCards(d.ownerState, 1);
    P[o] = d.oppState;
  }
  const startCtx = { round: nr, arenaId: arena, logs };
  r = applyNinjaRoundStart('player', P.player, P.enemy, startCtx);
  P.player = r.owner; P.enemy = r.opp;
  r = applyNinjaRoundStart('enemy', P.enemy, P.player, startCtx);
  P.enemy = r.owner; P.player = r.opp;
  for (const s of ['player', 'enemy'] as Side[]) {
    const o: Side = s === 'player' ? 'enemy' : 'player';
    const d = processBoardDeaths(P[s], P[o], nr, arena, logs);
    P[s] = d.ownerState;
    P[o] = d.oppState;
  }
  check(P.player, 'rodada');
  check(P.enemy, 'rodada');
}

const ninjaIds = NINJA_CARDS.map((n) => n.id);
const seen = new Set<string>();
const promoted = new Set<string>();
let finished = 0;
let crashes = 0;
let totalRounds = 0;
for (let m = 0; m < N; m++) {
  let decks: [string[], string[]];
  if (m < 12) {
    // Cobertura: cada Ninja aparece em pelo menos uma partida.
    const pick = (k: number) => [0, 1, 2].map((j) => ninjaIds[(k * 3 + j) % ninjaIds.length]);
    decks = [randomDeck(pick(m * 2)), randomDeck(pick(m * 2 + 1))];
  } else if (m < 15) {
    decks = [DECK_PRESETS[m % DECK_PRESETS.length].cardIds.slice(), DECK_PRESETS[(m + 1) % DECK_PRESETS.length].cardIds.slice()];
  } else {
    const shuffled = [...ninjaIds].sort(() => Math.random() - 0.5);
    decks = [randomDeck(shuffled.slice(0, 3)), randomDeck(shuffled.slice(3, 6))];
  }
  for (const d of decks) {
    const v = validateDeck(d);
    if (!v.ok) throw new Error('baralho inválido: ' + v.errors.join(' | '));
    d.forEach((id) => getCardById(id)?.kind === 'ninja' && seen.add(id));
  }
  const arena = ARENAS[m % ARENAS.length];
  const P = { player: createInitialPlayerState(decks[0]), enemy: createInitialPlayerState(decks[1]) };
  const logs: BattleLogEntry[] = [];
  let round = 1;
  try {
    for (; round <= 30; round++) {
      const first: Side = round % 2 ? 'player' : 'enemy';
      const second: Side = first === 'player' ? 'enemy' : 'player';
      playMain(first, P, round, arena, logs);
      playMain(second, P, round, arena, logs);
      attack(first, P, round, arena, logs);
      for (const s of ['player', 'enemy'] as Side[]) for (const u of P[s].board) if (u.evolutionLevel > 1) promoted.add(`${u.cardId}@${u.evolutionLevel}`);
      if (P.player.hp <= 0 || P.enemy.hp <= 0) break;
      nextRound(P, round, arena, logs);
      if (P.player.hp <= 0 || P.enemy.hp <= 0) break;
    }
    finished++;
    totalRounds += Math.min(round, 30);
    const res = P.player.hp <= 0 && P.enemy.hp <= 0 ? 'empate' : P.player.hp <= 0 ? 'enemy' : P.enemy.hp <= 0 ? 'player' : 'limite';
    console.log(`partida ${m + 1}: ${res} em ${Math.min(round, 30)} rodadas (Vitalidade ${P.player.hp}/${P.enemy.hp}, ${logs.length} logs) [${arena}]`);
  } catch (err) {
    crashes++;
    console.log(`partida ${m + 1}: ERRO na rodada ${round}:`, err);
  }
}
console.log(`\n${finished}/${N} partidas sem erro; média ${(totalRounds / Math.max(1, finished)).toFixed(1)} rodadas.`);
console.log(`Ninjas usados: ${seen.size}/34. Promoções vistas: ${promoted.size} (${[...promoted].sort().join(', ')})`);
process.exit(crashes === 0 && seen.size === 34 ? 0 : 1);
