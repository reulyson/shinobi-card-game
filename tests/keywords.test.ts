/**
 * Testes de regras — Parte 5 · Grupo 5 (Palavras-chave).
 * Rodar: npm run test:rules
 */
import assert from 'node:assert/strict';
import { ARENA_EFFECTS_ENABLED } from '../src/data/arenas';
import { ALL_CARDS, JUTSU_CARDS, SIGNATURE_JUTSU_IDS, TOKEN_CARDS, getCardById } from '../src/data/cards';
import { KEYWORD_SHORT_HELP } from '../src/data/keywordHelp';
import { KEYWORD_VISUALS, getUnitBadges } from '../src/data/keywordVisuals';
import * as E from '../src/engine/battleEngine';
import * as K from '../src/engine/keywords';
import type { ArenaId, BoardUnit, Keyword, NinjaCardDef, PlayerState, UnitCardDef } from '../src/types/game';
import { KEYWORD_DISPLAY_NAME, KEYWORD_LIST } from '../src/types/game';
import { keywordIconId } from '../src/ui/card/theme';

const ARENA = 'arena_chunin' as ArenaId;
let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  FAIL ${name}\n      ${(err as Error).message.split('\n').join('\n      ')}`);
  }
}

const unitDef = (id: string) => getCardById(id) as UnitCardDef | NinjaCardDef;
function mk(id: string, owner: 'player' | 'enemy', over: Partial<BoardUnit> = {}): BoardUnit {
  return { ...E.createBoardUnit(unitDef(id), owner, 1, ARENA), ...over };
}
function emptyState(): PlayerState {
  return { ...E.createInitialPlayerState([]), hand: [], deck: [], board: [] };
}
const CLONE = TOKEN_CARDS.token_kage_bunshin;
const PLAIN_UNIT = 'unit_batedor_areia';

console.log('Grupo 5 — Palavras-chave');

// ---------------------------------------------------------------- regras base preservadas
test('regras base: custo mínimo 1, desconto máx. −2 e arenas desligadas', () => {
  assert.equal(E.MIN_CARD_COST, 1);
  assert.equal(E.MAX_TOTAL_DISCOUNT, 2);
  assert.equal(ARENA_EFFECTS_ENABLED, false);
});

// ---------------------------------------------------------------- cortes
test('cortes: Batedor, Instável, Iniciativa, Sequência, Pilhagem e Emboscada não existem mais', () => {
  const names = Object.values(KEYWORD_DISPLAY_NAME);
  for (const cut of ['Batedor', 'Instável', 'Iniciativa', 'Sequência', 'Pilhagem', 'Emboscada']) {
    assert.ok(!names.includes(cut), `${cut} ainda está no glossário`);
  }
  for (const k of ['Patrulheiro', 'Fugaz', 'Amanhecer', 'Anoitecer', 'Saquear', 'Espreitar']) {
    assert.ok(!(k in KEYWORD_DISPLAY_NAME), `${k} ainda é palavra-chave`);
  }
});

test('cortes: nenhuma carta usa palavra-chave inexistente e os textos não citam as cortadas', () => {
  const valid = new Set(Object.keys(KEYWORD_DISPLAY_NAME));
  const all = [...ALL_CARDS, ...Object.values(TOKEN_CARDS)];
  for (const c of all) {
    const lists: Keyword[][] =
      c.kind === 'ninja' ? [c.keywords, c.chuuninKeywords, c.jounninKeywords]
      : c.kind === 'unidade' || c.kind === 'token' ? [c.keywords]
      : c.kind === 'equipamento' ? [c.grantedKeywords] : [];
    for (const l of lists) for (const k of l) assert.ok(valid.has(k), `${c.id}: ${k}`);
    const texts = c.kind === 'ninja' ? [c.abilityText, c.chuuninAbilityText, c.jounninAbilityText]
      : 'abilityText' in c ? [(c as UnitCardDef).abilityText] : [];
    for (const t of texts) assert.ok(!/\b(Iniciativa|Sequência|Pilhagem)\s*:/.test(t ?? ''), `${c.id}: ${t}`);
  }
});

test('ícone e ajuda curta para toda palavra-chave (inclui as 4 novas)', () => {
  for (const k of Object.keys(KEYWORD_DISPLAY_NAME) as Keyword[]) {
    assert.ok(KEYWORD_VISUALS[k]?.icon, `sem ícone: ${k}`);
    assert.ok((KEYWORD_SHORT_HELP[k] ?? '').length > 10, `sem ajuda: ${k}`);
  }
  for (const k of ['Veneno', 'Parceiro', 'Formação', 'Copiar'] as Keyword[]) assert.ok(k in KEYWORD_DISPLAY_NAME);
  assert.match(KEYWORD_SHORT_HELP['Sensor'], /Ocultos/);
});

test('toda palavra-chave tem ícone SVG na carta (KEYWORD_ICON)', () => {
  for (const k of KEYWORD_LIST) {
    assert.ok(keywordIconId(k), `sem ícone de carta: ${k}`);
  }
});

// ---------------------------------------------------------------- Formação
test('Formação: 2 aliados (1 com Formação + 1 Token) → sem bônus', () => {
  let st = emptyState();
  const f = mk(PLAIN_UNIT, 'player', { keywords: ['Formação'] });
  st.board = [f, E.createBoardUnit(CLONE, 'player', 1, ARENA)];
  st = K.refreshFormation(st);
  const u = st.board[0];
  assert.equal(K.isFormationActive(st), false);
  assert.equal(u.formationActive ?? false, false);
  assert.equal(u.attack, f.attack);
  assert.equal(u.health, f.health);
});

test('Formação: 3 aliados (2 deles Tokens) → +1/+1, sem acumular', () => {
  let st = emptyState();
  const f = mk(PLAIN_UNIT, 'player', { keywords: ['Formação'] });
  st.board = [f, E.createBoardUnit(CLONE, 'player', 1, ARENA), E.createBoardUnit(CLONE, 'player', 1, ARENA)];
  st = K.refreshFormation(st);
  st = K.refreshFormation(st); // idempotente: não acumula
  const u = st.board[0];
  assert.equal(K.isFormationActive(st), true);
  assert.equal(u.formationActive, true);
  assert.equal(u.attack, f.attack + 1);
  assert.equal(u.health, f.health + 1);
  assert.equal(u.maxHealth, f.maxHealth + 1);
  // Tokens sem Formação não ganham nada
  assert.equal(st.board[1].attack, CLONE.attack);
  const badge = getUnitBadges(u, u.keywords).find((b) => b.key === 'Formação');
  assert.match(badge?.label ?? '', /ativa/);
});

test('Formação: ao cair de 3 para 2 aliados perde o bônus e não morre por isso', () => {
  let st = emptyState();
  const f = mk(PLAIN_UNIT, 'player', { keywords: ['Formação'] });
  st.board = [f, E.createBoardUnit(CLONE, 'player', 1, ARENA), E.createBoardUnit(CLONE, 'player', 1, ARENA)];
  st = K.refreshFormation(st);
  // dano deixa a unidade com 1 de Vida, depois um Token sai
  st.board = [{ ...st.board[0], health: 1 }, st.board[1]];
  st = K.refreshFormation(st);
  const u = st.board[0];
  assert.equal(u.formationActive, false);
  assert.equal(u.attack, f.attack);
  assert.equal(u.maxHealth, f.maxHealth);
  assert.equal(u.health, 1);
});

test('Formação: Selado desliga o bônus; nunca é requisito para jogar', () => {
  let st = emptyState();
  const f = mk(PLAIN_UNIT, 'player', { keywords: ['Formação'] });
  st.board = [f, mk(PLAIN_UNIT, 'player'), mk(PLAIN_UNIT, 'player')];
  st = K.refreshFormation(st);
  assert.equal(st.board[0].formationActive, true);
  st.board = [{ ...st.board[0], silenced: true }, ...st.board.slice(1)];
  st = K.refreshFormation(st);
  assert.equal(st.board[0].formationActive, false);
  assert.equal(st.board[0].attack, f.attack);
  // campo vazio: a carta continua jogável (só custo/campo importam)
  const empty = { ...emptyState(), mana: 10 };
  assert.equal(E.getUnplayableReason(unitDef(PLAIN_UNIT), empty, ARENA), null);
});

test('Formação: Jutsu/efeito pode consultar isFormationActive (3+ aliados, Tokens contam)', () => {
  const st = emptyState();
  st.board = [E.createBoardUnit(CLONE, 'player', 1, ARENA), E.createBoardUnit(CLONE, 'player', 1, ARENA)];
  assert.equal(K.isFormationActive(st), false);
  st.board = [...st.board, E.createBoardUnit(CLONE, 'player', 1, ARENA)];
  assert.equal(K.isFormationActive(st), true);
});

// ---------------------------------------------------------------- Parceiro
test('Parceiro: Token ligado ao Ninja sai de campo quando o Ninja sai', () => {
  let st = emptyState();
  const ninja = mk('kiba_inuzuka', 'player');
  st.board = [ninja];
  const res = E.summonPartner(CLONE, st, ninja.uid, 'player', 1, ARENA);
  assert.ok(res.unit);
  assert.equal(res.unit!.partnerOfUid, ninja.uid);
  st = res.ownerState;
  assert.equal(st.board.length, 2);
  // Ninja continua em campo: nada muda
  assert.equal(K.applyPartnerRule(st, 1, 'player').board.length, 2);
  // Ninja morre/sai
  const logs: any[] = [];
  st = K.applyPartnerRule({ ...st, board: st.board.filter((u) => u.uid !== ninja.uid) }, 1, 'player', logs);
  assert.equal(st.board.length, 0);
  assert.match(logs[0].text, /Parceiro/);
});

test('Parceiro: sem o Ninja em campo, o Parceiro não é invocado', () => {
  const res = E.summonPartner(CLONE, emptyState(), 'nao_existe', 'player', 1, ARENA);
  assert.equal(res.unit, null);
});

// ---------------------------------------------------------------- Veneno X
test('Veneno: não acumula, renova para a maior duração', () => {
  let u = mk(PLAIN_UNIT, 'enemy');
  u = K.applyPoison(u, 2);
  u = K.applyPoison(u, 1);
  assert.equal(u.poison, 2);
  u = K.applyPoison(u, 3);
  assert.equal(u.poison, 3);
});

test('Veneno: 1 de dano por rodada, ignora Substituição e Resistente; acaba após X rodadas', () => {
  const st = emptyState();
  st.board = [mk(PLAIN_UNIT, 'enemy', { poison: 2, hasBarrier: true, keywords: ['Resistente'], health: 3, maxHealth: 3 })];
  const r1 = K.applyRoundStartKeywords(st, 2, 'enemy');
  assert.equal(r1.board[0].health, 2);
  assert.equal(r1.board[0].poison, 1);
  const r2 = K.applyRoundStartKeywords(r1, 3, 'enemy');
  assert.equal(r2.board[0].health, 1);
  assert.equal(r2.board[0].poison, 0);
  const r3 = K.applyRoundStartKeywords(r2, 4, 'enemy');
  assert.equal(r3.board[0].health, 1);
});

test('Veneno: pode matar (morte resolvida por processBoardDeaths)', () => {
  const st = emptyState();
  st.board = [mk(PLAIN_UNIT, 'enemy', { poison: 1, health: 1 })];
  const r = K.applyRoundStartKeywords(st, 2, 'enemy');
  const d = E.processBoardDeaths(r, emptyState(), 2, ARENA, []);
  assert.equal(d.ownerState.board.length, 0);
});

test('Veneno: atacante com Veneno envenena o bloqueador ao causar dano (X da carta, padrão 1)', () => {
  const p = emptyState();
  const e = emptyState();
  const att = mk(PLAIN_UNIT, 'player', { keywords: ['Veneno'], attack: 1 });
  const blk = mk('unit_raiz_ne', 'enemy', { health: 5, maxHealth: 5, attack: 0, keywords: [] });
  p.board = [att];
  e.board = [blk];
  const r = E.resolveCombatPairs([{ attackerUid: att.uid, blockerUid: blk.uid }], 'player', p, e, ARENA, 1);
  assert.equal(r.enemy.board[0].poison, 1);
  assert.equal(K.getVenenoX(att), 1);
});

test('Veneno: sem dano (Substituição) não envenena', () => {
  const p = emptyState();
  const e = emptyState();
  const att = mk(PLAIN_UNIT, 'player', { keywords: ['Veneno'], attack: 1 });
  const blk = mk('unit_raiz_ne', 'enemy', { health: 5, maxHealth: 5, attack: 0, keywords: [], hasBarrier: true });
  p.board = [att];
  e.board = [blk];
  const r = E.resolveCombatPairs([{ attackerUid: att.uid, blockerUid: blk.uid }], 'player', p, e, ARENA, 1);
  assert.equal(r.enemy.board[0].poison ?? 0, 0);
});

// ---------------------------------------------------------------- Genjutsu e Kai
test('Genjutsu: não ataca nem bloqueia nesta rodada e na próxima; libera na seguinte', () => {
  const st = emptyState();
  const g = K.applyGenjutsu(mk(PLAIN_UNIT, 'player'));
  const attacker = mk(PLAIN_UNIT, 'enemy');
  assert.equal(E.canUnitAttack(g), false);
  assert.equal(E.canBlockAttacker(g, attacker).ok, false);
  assert.match(E.canBlockAttacker(g, attacker).reason ?? '', /Genjutsu/);
  st.board = [g];
  const r1 = K.applyRoundStartKeywords(st, 2, 'player');
  assert.equal(K.isInGenjutsu(r1.board[0]), true, 'ainda em Genjutsu na rodada seguinte');
  assert.equal(E.canUnitAttack(r1.board[0]), false);
  const r2 = K.applyRoundStartKeywords(r1, 3, 'player');
  assert.equal(K.isInGenjutsu(r2.board[0]), false);
  assert.equal(E.canUnitAttack(r2.board[0]), true);
});

test('Kai: remove Genjutsu e Selado, mas não Paralisia', () => {
  const u = K.applyKai({ ...K.applyGenjutsu(mk(PLAIN_UNIT, 'player')), silenced: true, stunned: true });
  assert.equal(K.isInGenjutsu(u), false);
  assert.equal(u.silenced, false);
  assert.equal(u.stunned, true);
  assert.equal(K.isOutOfCombat(u), true);
});

// ---------------------------------------------------------------- Copiar
const generalJutsu = JUTSU_CARDS.find((j) => !SIGNATURE_JUTSU_IDS.has(j.id) && j.targetMode === 'none')
  ?? JUTSU_CARDS.find((j) => !SIGNATURE_JUTSU_IDS.has(j.id))!;
const exclusiveJutsu = JUTSU_CARDS.find((j) => SIGNATURE_JUTSU_IDS.has(j.id))!;

function copySetup() {
  const p = emptyState();
  const e = emptyState();
  p.board = [mk(PLAIN_UNIT, 'player', { keywords: ['Copiar'], health: 10, maxHealth: 10 })];
  e.board = [mk(PLAIN_UNIT, 'enemy')];
  return { p, e };
}

test(`Copiar: Jutsu rival (${generalJutsu.name}) cria cópia Fugaz na mão, 1 vez por rodada`, () => {
  const { p, e } = copySetup();
  const r1 = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, p, e, ARENA, 1);
  assert.deepEqual(r1.player.hand, [generalJutsu.id]);
  assert.deepEqual(r1.player.fleetingHand, [generalJutsu.id]);
  assert.ok(r1.logs.some((l) => /Copiar/.test(l.text)));
  const r2 = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, r1.player, r1.enemy, ARENA, 1);
  assert.equal(r2.player.hand.length, 1, '2º copiar na mesma rodada não pode');
  const r3 = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, r2.player, r2.enemy, ARENA, 2);
  assert.equal(r3.player.hand.length, 2, 'na rodada seguinte copia de novo');
});

test(`Copiar: não copia Jutsu Exclusivo (${exclusiveJutsu.name}) nem sem unidade com Copiar`, () => {
  const { p, e } = copySetup();
  const r = E.resolveJutsuEffect(exclusiveJutsu, 'enemy', undefined, p, e, ARENA, 1);
  assert.equal(r.player.hand.length, 0);
  const noCopier = { ...p, board: [mk(PLAIN_UNIT, 'player')] };
  const r2 = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, noCopier, e, ARENA, 1);
  assert.equal(r2.player.hand.length, 0);
  const sealed = { ...p, board: [{ ...p.board[0], silenced: true }] };
  const r3 = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, sealed, e, ARENA, 1);
  assert.equal(r3.player.hand.length, 0, 'Selado desliga Copiar');
});

test('Copiar: a cópia Fugaz conjurada não é copiada de volta e é consumida', () => {
  const { p, e } = copySetup();
  const enemyCopier = { ...e, board: [mk(PLAIN_UNIT, 'enemy', { keywords: ['Copiar'] })] };
  const caster = { ...p, fleetingHand: [generalJutsu.id] };
  const r = E.resolveJutsuEffect(generalJutsu, 'player', undefined, caster, enemyCopier, ARENA, 1);
  assert.equal(r.enemy.hand.length, 0);
  assert.deepEqual(r.player.fleetingHand, []);
});

test('Copiar: a cópia Fugaz que ficou na mão some no fim da rodada; cartas normais ficam', () => {
  const st = { ...emptyState(), hand: [generalJutsu.id, 'unit_raiz_ne'], fleetingHand: [generalJutsu.id] };
  const logs: any[] = [];
  const r = K.applyRoundStartKeywords(st, 2, 'player', logs);
  assert.deepEqual(r.hand, ['unit_raiz_ne']);
  assert.deepEqual(r.fleetingHand, []);
  assert.match(logs[0].text, /Fugaz/);
});

test('Copiar: mão cheia (9) não recebe cópia', () => {
  const { p, e } = copySetup();
  const full = { ...p, hand: Array(9).fill('unit_raiz_ne') };
  const r = E.resolveJutsuEffect(generalJutsu, 'enemy', undefined, full, e, ARENA, 1);
  assert.equal(r.player.hand.length, 9);
  assert.equal(r.player.copyUsedRound, undefined);
});

// ---------------------------------------------------------------- Batedor (cortado)
// Merge 4+5+6+7: o Grupo 7 redesenhou os Ninjas da Areia (Entrada: 2 Tokens; Investida sozinho: Furtivo).
// O 2º ataque do antigo Batedor de Suna saiu (SECOND_ATTACK_UNIT_ID = null).
test('Batedor cortado: ninguém ganha 2º ataque (Ninjas da Areia do G7 e Kiba)', () => {
  assert.equal(K.SECOND_ATTACK_UNIT_ID, null);
  for (const id of ['unit_batedor_areia', 'kiba_inuzuka']) {
    const p = emptyState();
    const b = mk(id, 'player');
    p.board = [b];
    const r = E.resolveCombatPairs([{ attackerUid: b.uid, blockerUid: null }], 'player', p, emptyState(), ARENA, 1);
    assert.equal(r.rallyGranted, false, id);
  }
});

// ---------------------------------------------------------------- simulação (fuzz) sem React
test('simulação: 300 rodadas aleatórias com as palavras-chave novas, sem erro e sem NaN', () => {
  const pool: Keyword[] = ['Veneno', 'Formação', 'Copiar', 'Resistente', 'Esquiva', 'Ágil', 'Veloz', 'Perfurante', 'Fúria'];
  const unitIds = ALL_CARDS.filter((c) => c.kind === 'unidade').map((c) => c.id);
  const jutsus = JUTSU_CARDS;
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const randUnit = (owner: 'player' | 'enemy') => {
    const kws = pool.filter(() => Math.random() < 0.25);
    let u = mk(unitIds[rnd(unitIds.length)], owner, { keywords: kws });
    if (Math.random() < 0.15) u = K.applyGenjutsu(u);
    return u;
  };
  let p = emptyState();
  let e = emptyState();
  for (let round = 1; round <= 300; round++) {
    for (const side of ['player', 'enemy'] as const) {
      const st = side === 'player' ? p : e;
      while (st.board.length < 1 + rnd(5)) st.board.push(randUnit(side));
    }
    p = K.applyContinuousKeywordRules(p, round, 'player').state;
    e = K.applyContinuousKeywordRules(e, round, 'enemy').state;
    const att = round % 2 ? 'player' : 'enemy';
    const A = att === 'player' ? p : e;
    const D = att === 'player' ? e : p;
    const attackers = A.board.filter((u) => E.canUnitAttack(u)).slice(0, 3);
    const used = new Set<string>();
    const pairs = attackers.map((a) => {
      const blk = D.board.find((d) => !used.has(d.uid) && E.canBlockAttacker(d, a).ok && Math.random() < 0.6);
      if (blk) used.add(blk.uid);
      return { attackerUid: a.uid, blockerUid: blk?.uid ?? null };
    });
    const c = E.resolveCombatPairs(pairs, att, p, e, ARENA, round);
    p = { ...c.player, hp: 20 };
    e = { ...c.enemy, hp: 20 };
    const j = jutsus[rnd(jutsus.length)];
    const caster = Math.random() < 0.5 ? 'player' : 'enemy';
    const r = E.resolveJutsuEffect(j, caster, undefined, p, e, ARENA, round);
    p = { ...r.player, hp: 20, hand: r.player.hand.slice(0, 9) };
    e = { ...r.enemy, hp: 20, hand: r.enemy.hand.slice(0, 9) };
    p = E.processBoardDeaths(K.applyRoundStartKeywords(p, round + 1, 'player'), e, round + 1, ARENA, []).ownerState;
    e = E.processBoardDeaths(K.applyRoundStartKeywords(e, round + 1, 'enemy'), p, round + 1, ARENA, []).ownerState;
    p = K.applyContinuousKeywordRules(p, round + 1, 'player').state;
    e = K.applyContinuousKeywordRules(e, round + 1, 'enemy').state;
    for (const st of [p, e]) {
      assert.ok(st.board.length <= 6, 'campo explodiu');
      for (const u of st.board) {
        assert.ok(Number.isFinite(u.attack) && Number.isFinite(u.health) && Number.isFinite(u.maxHealth), 'NaN');
        const shouldForm = K.isFormationActive(st) && !u.silenced && u.keywords.includes('Formação');
        assert.equal(Boolean(u.formationActive), shouldForm, 'Formação inconsistente');
      }
      assert.ok((st.fleetingHand ?? []).length === 0, 'cópia Fugaz sobrou após o início da rodada');
    }
  }
});

console.log(`\n${passed} passaram, ${failures.length} falharam`);
if (failures.length) process.exit(1);
