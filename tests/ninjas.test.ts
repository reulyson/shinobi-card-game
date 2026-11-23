/**
 * Grupo 6 · Ninjas revisados: os 34 Ninjas existem, são válidos e alguns efeitos por carta funcionam.
 * Rodar: npx tsx tests/ninjas.test.ts
 */
import {
  ALL_CARDS,
  DECK_PRESETS,
  NINJA_CARDS,
  TOKEN_CARDS,
  getCardById,
  getNinjaDuplicateCardId,
  getNinjaMaxRank,
  isDeckableCard,
  validateDeck,
} from '../src/data/cards';
import { NINJA_IDS } from '../src/data/ninjas';
import {
  createBoardUnit,
  createInitialPlayerState,
  evolveUnitIfReady,
  getEffectiveCost,
  getNinjaPatenteCost,
  processBoardDeaths,
  resolveJutsuEffect,
} from '../src/engine/battleEngine';
import {
  applyNinjaAttackTriggers,
  applyNinjaEntry,
  applyNinjaRoundEnd,
  getNinjaCostDiscount,
} from '../src/engine/ninjaEffects';
import type { BattleLogEntry, NinjaCardDef, PlayerState } from '../src/types/game';

let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? 'OK  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const A = 'arena_chunin' as const;

const EXPECTED = [
  'naruto_uzumaki', 'sasuke_uchiha', 'sakura_haruno', 'kakashi_hatake',
  'hinata_hyuga', 'kiba_inuzuka', 'shino_aburame', 'kurenai_yuhi',
  'rock_lee', 'neji_hyuga', 'tenten', 'might_guy',
  'shikamaru_nara', 'ino_yamanaka', 'choji_akimichi', 'asuma_sarutobi',
  'orochimaru', 'jiraiya', 'tsunade', 'kabuto_yakushi',
  'kimimaro', 'jirobo', 'kidomaru', 'sakon_ukon', 'tayuya',
  'hiruzen_sarutobi', 'minato_namikaze',
  'gaara', 'temari', 'kankuro',
  'zabuza_momochi', 'haku', 'itachi_uchiha', 'kisame_hoshigaki',
];

// ---------------- dados
ok(NINJA_CARDS.length === 34, `34 Ninjas (tem ${NINJA_CARDS.length})`);
ok(EXPECTED.every((id) => NINJA_CARDS.some((n) => n.id === id)), 'todos os 34 ids esperados existem');
ok(NINJA_IDS.length === 34 && new Set(NINJA_IDS).size === 34, 'NINJA_IDS sem repetição');
const allIds = ALL_CARDS.map((c) => c.id);
ok(new Set(allIds).size === allIds.length, 'nenhum id repetido em ALL_CARDS');

const IMG = /^https:\/\/static\.wikia\.nocookie\.net\/naruto\/images\//;
for (const n of NINJA_CARDS as NinjaCardDef[]) {
  const errs: string[] = [];
  const max = getNinjaMaxRank(n);
  if (n.kind !== 'ninja') errs.push('kind');
  if (![1, 2, 3].includes(max)) errs.push('maxRank');
  for (const lvl of [1, 2, 3] as const) {
    const c = getNinjaPatenteCost(n, lvl);
    if (c < 1 || c > 10) errs.push(`custo patente ${lvl}=${c}`);
  }
  if (max >= 2 && getNinjaPatenteCost(n, 2) < n.cost) errs.push('Chuunin mais barato que Gennin');
  if (max >= 3 && getNinjaPatenteCost(n, 3) < getNinjaPatenteCost(n, 2)) errs.push('Jounnin mais barato que Chuunin');
  if (n.attack < 0 || n.health < 1) errs.push('stats Gennin');
  if (max >= 2 && (n.chuuninAttack < n.attack || n.chuuninHealth < n.health)) errs.push('stats Chuunin menores');
  if (max >= 3 && (n.jounninAttack < n.chuuninAttack || n.jounninHealth < n.chuuninHealth)) errs.push('stats Jounnin menores');
  if (max === 1 && n.levelUpTarget !== 99) errs.push('maxRank 1 deveria ter meta 99');
  if (max === 2 && n.chuuninLevelUpTarget !== 99) errs.push('maxRank 2 deveria ter meta Chuunin 99');
  if (!n.abilityText || !n.levelUpCondition) errs.push('texto vazio');
  if (n.signatureJutsuId) {
    const sig = getCardById(n.signatureJutsuId);
    if (!sig || sig.kind !== 'jutsu') errs.push(`Exclusivo inexistente ${n.signatureJutsuId}`);
    else if (isDeckableCard(sig)) errs.push('Exclusivo não deveria entrar no baralho');
  } else {
    const gen = n.generalJutsuId ? getCardById(n.generalJutsuId) : undefined;
    if (!gen || gen.kind !== 'jutsu') errs.push(`sem Exclusivo e sem Jutsu geral válido (${n.generalJutsuId})`);
    else if (!isDeckableCard(gen)) errs.push('Jutsu geral deveria entrar no baralho');
  }
  const dup = getCardById(getNinjaDuplicateCardId(n));
  if (!dup) errs.push('cópia repetida não vira nenhuma carta');
  const imgs = [n.imageUrl, n.imageUrls?.gennin, n.imageUrls?.chuunin, n.imageUrls?.jounnin].filter(Boolean) as string[];
  if (imgs.length === 0 || !imgs.every((u) => IMG.test(u))) errs.push('imagem fora da Narutopedia');
  if (!isDeckableCard(n)) errs.push('Ninja deveria entrar no baralho');
  ok(errs.length === 0, `${n.name} (patente máx. ${max}) válido${errs.length ? ': ' + errs.join(', ') : ''}`);
}

for (const id of ['token_akamaru', 'token_espelho_gelo', 'token_karasu', 'token_kage_bunshin', 'token_enxame', 'token_doki', 'token_ukon', 'token_gamabunta']) {
  ok(Boolean(TOKEN_CARDS[id]), `token ${id} existe`);
}
for (const id of ['equip_osso_kaguya', 'equip_laminas_chakra', 'equip_kubikiribocho', 'jutsu_katsuyu_cura', 'jutsu_rasengan']) {
  ok(Boolean(getCardById(id)), `carta criada ${id} existe`);
}
ok(!isDeckableCard(getCardById('equip_osso_kaguya')!), 'Osso (token de Kimimaro) não entra no baralho');
for (const p of DECK_PRESETS) {
  const v = validateDeck(p.cardIds);
  ok(v.ok, `baralho pronto ${p.id} válido ${v.errors.join(' | ')}`);
}

// ---------------- custos pedidos na ficha
const cost = (id: string, lvl: 1 | 2 | 3) => getNinjaPatenteCost(getCardById(id) as NinjaCardDef, lvl);
ok(cost('naruto_uzumaki', 3) === 6 && cost('kakashi_hatake', 3) === 7, 'Naruto Jounnin 6, Kakashi Jounnin 7');
ok(cost('rock_lee', 3) === 5 && cost('sakura_haruno', 3) === 5 && cost('choji_akimichi', 3) === 6 && cost('sasuke_uchiha', 3) === 6, 'Lee 5, Sakura 5, Chōji 6, Sasuke 6 (Jounnin)');

// ---------------- motor
const ctx = (logs: BattleLogEntry[] = []) => ({ round: 3, arenaId: A, logs });
const base = (): PlayerState => ({ ...createInitialPlayerState([]), hand: [], deck: [], mana: 10, maxMana: 10 });
const def = (id: string) => getCardById(id) as NinjaCardDef;

// Patente máxima
const kimi = createBoardUnit(def('kimimaro'), 'player', 1, A);
ok(evolveUnitIfReady({ ...kimi, evolutionProgress: 999 }, A).evolutionLevel === 1, 'Kimimaro (patente máx. Gennin) não promove');
const guy1 = createBoardUnit(def('might_guy'), 'player', 1, A);
const guy2 = evolveUnitIfReady({ ...guy1, evolutionProgress: guy1.evolutionTarget }, A);
ok(guy2.evolutionLevel === 2, 'Guy promove a Chuunin');
ok(evolveUnitIfReady({ ...guy2, evolutionProgress: 999, evolutionTarget: 1 }, A).evolutionLevel === 2, 'Guy (patente máx. Chuunin) não vira Jounnin');

// Entrada: Kiba invoca Akamaru
{
  const kiba = createBoardUnit(def('kiba_inuzuka'), 'player', 1, A);
  const r = applyNinjaEntry(def('kiba_inuzuka'), kiba.uid, 'player', { ...base(), board: [kiba] }, base(), ctx());
  ok(r.owner.board.some((u) => u.cardId === 'token_akamaru'), 'Entrada de Kiba invoca Akamaru');
}
// Entrada: Kisame drena Reserva
{
  const k = createBoardUnit(def('kisame_hoshigaki'), 'player', 1, A);
  const r = applyNinjaEntry(def('kisame_hoshigaki'), k.uid, 'player', { ...base(), board: [k] }, { ...base(), spellMana: 2 }, ctx());
  ok(r.opp.spellMana === 1, 'Entrada de Kisame: rival perde 1 de Reserva');
}
// Entrada: Itachi sela até o fim da rodada
{
  const it = createBoardUnit(def('itachi_uchiha'), 'player', 1, A);
  const foe = createBoardUnit(def('gaara'), 'enemy', 1, A);
  const r = applyNinjaEntry(def('itachi_uchiha'), it.uid, 'player', { ...base(), board: [it] }, { ...base(), board: [foe] }, ctx());
  ok(r.opp.board[0].silenced === true, 'Itachi: inimigo mais forte Selado');
  const end = applyNinjaRoundEnd('enemy', r.opp, r.owner, ctx());
  ok(end.owner.board[0].silenced === false, 'Selado de Itachi acaba no fim da rodada');
}
// Guy: Taijutsu custa 1 a menos (Lee)
{
  const g = createBoardUnit(def('might_guy'), 'player', 1, A);
  const st = { ...base(), board: [g] };
  ok(getNinjaCostDiscount(def('rock_lee'), st) === 1, 'Guy: Rock Lee custa 1 a menos');
  ok(getEffectiveCost(def('rock_lee'), st, A) === Math.max(1, def('rock_lee').cost - 1), 'custo efetivo de Lee com Guy');
}
// Rock Lee Chuunin abre Portões ao atacar
{
  const lee1 = createBoardUnit(def('rock_lee'), 'player', 1, A);
  const lee = evolveUnitIfReady({ ...lee1, evolutionProgress: lee1.evolutionTarget }, A);
  const before = lee.health;
  const r = applyNinjaAttackTriggers([lee.uid], 'player', { ...base(), board: [lee] }, base(), ctx());
  const after = r.owner.board[0];
  ok(after.tempAttackBonus > 0 && after.health < before, `Lee Chuunin abriu Portões (+${after.tempAttackBonus}/+0, Vida ${before}→${after.health})`);
}
// Orochimaru Chuunin: Troca de Corpo
{
  const o1 = createBoardUnit(def('orochimaru'), 'player', 1, A);
  const o2 = evolveUnitIfReady({ ...o1, evolutionProgress: o1.evolutionTarget }, A);
  const owner = { ...base(), board: [{ ...o2, health: -3 }], deck: ['jutsu_rasengan', 'jutsu_chidori', 'jutsu_rasengan'] };
  const res = processBoardDeaths(owner, base(), 3, A, []);
  const oro = res.ownerState.board.find((u) => u.cardId === 'orochimaru');
  ok(Boolean(oro) && oro!.health === 3 && oro!.attack === 3 && res.ownerState.hand.length === 2, 'Orochimaru volta 3/3 e compra 2');
}
// Sakon Chuunin + Ukon
{
  const s1 = createBoardUnit(def('sakon_ukon'), 'player', 1, A);
  const s2 = evolveUnitIfReady({ ...s1, evolutionProgress: s1.evolutionTarget }, A);
  const ukon = createBoardUnit(TOKEN_CARDS.token_ukon, 'player', 1, A);
  const res = processBoardDeaths({ ...base(), board: [{ ...s2, health: 0 }, ukon] }, base(), 3, A, []);
  ok(res.ownerState.board.length === 1 && res.ownerState.board[0].cardId === 'sakon_ukon' && res.ownerState.board[0].health === 3, 'Sakon & Ukon: volta 3/3 e Ukon se funde');
}
// Naruto Chuunin: Último Desejo cria Rasengan
{
  const n1 = createBoardUnit(def('naruto_uzumaki'), 'player', 1, A);
  const n2 = evolveUnitIfReady({ ...n1, evolutionProgress: n1.evolutionTarget }, A);
  const res = processBoardDeaths({ ...base(), board: [{ ...n2, health: 0 }] }, base(), 3, A, []);
  ok(res.ownerState.hand.includes('jutsu_rasengan'), 'Naruto Chuunin: Último Desejo cria Rasengan');
}
// Jutsu Exclusivo novo: Kamaitachi (2 no alvo, 1 nos outros)
{
  const t = createBoardUnit(def('temari'), 'player', 1, A);
  const e1 = createBoardUnit(def('jirobo'), 'enemy', 1, A);
  const e2 = createBoardUnit(def('kidomaru'), 'enemy', 1, A);
  const res = resolveJutsuEffect(getCardById('jutsu_kamaitachi') as never, 'player', e1.uid, { ...base(), board: [t] }, { ...base(), board: [e1, e2] }, A, 3);
  const h1 = res.enemy.board.find((u) => u.uid === e1.uid)?.health ?? 0;
  const h2 = res.enemy.board.find((u) => u.uid === e2.uid)?.health ?? 0;
  ok(h1 === e1.health - 2 && h2 === e2.health - 1, 'Kamaitachi: 2 no alvo, 1 nos outros');
  const tem = res.player.board.find((u) => u.cardId === 'temari')!;
  ok(tem.evolutionProgress >= 2 || tem.evolutionLevel === 2, 'Kamaitachi avança a Promoção de Temari');
}

console.log(fails === 0 ? 'TODOS OK' : `FALHAS: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
