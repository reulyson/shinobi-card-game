/**
 * Grupo 7 · teste de dados e efeitos das 44 Unidades.
 * Rodar: npx tsx tests/g7-units.test.ts [caminho/ninjas-vs-unidades.md]
 */
import { readFileSync, existsSync } from 'node:fs';
import { ALL_CARDS, CARD_MAP, DECK_PRESETS, getCardById, isDeckableCard, TOKEN_CARDS, UNIT_CARDS, validateDeck } from '../src/data/cards';
import { UNIT_PENDING_KEYWORDS, UNIT_PARTNER_TOKENS } from '../src/data/units';
import { applyUnitEntryEffect } from '../src/engine/unitEffects';
import { applyContinuousKeywordRules } from '../src/engine/keywords';
import { resetRecurringRoundState, runRecurringTrigger } from '../src/engine/recurringAbilities';
import { createBoardUnit, createInitialPlayerState, processBoardDeaths, resolveCombatPairs } from '../src/engine/battleEngine';
import { BattleLogEntry, CombatVisualFX, PlayerState, UnitCardDef } from '../src/types/game';

let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? 'OK  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const A = 'arena_chunin' as const;

// ---------- Dados ----------
ok(UNIT_CARDS.length === 44, `44 Unidades (tem ${UNIT_CARDS.length})`);
ok(new Set(UNIT_CARDS.map((u) => u.id)).size === 44, 'ids únicos');
ok(UNIT_CARDS.every((u) => u.kind === 'unidade'), 'todas kind=unidade');
ok(UNIT_CARDS.every((u) => CARD_MAP[u.id] === u && isDeckableCard(u)), 'todas no CARD_MAP e podem ir ao baralho');
ok(new Set(ALL_CARDS.map((c) => c.id)).size === ALL_CARDS.length, 'sem id repetido entre todas as cartas');
const bad = UNIT_CARDS.filter(
  (u) =>
    !(u.cost >= 1 && u.cost <= 10) ||
    u.attack < 0 ||
    u.health < 1 ||
    !u.name ||
    !u.title ||
    !u.wikiTitle ||
    !/^https:\/\/static\.wikia\.nocookie\.net\/naruto\/images\//.test(u.imageUrl ?? '') ||
    !/^https:\/\/naruto\.fandom\.com\/wiki\//.test(u.sourceUrl ?? '')
);
ok(bad.length === 0, `custo 1–10, Poder ≥ 0, Vida ≥ 1, imagem/fonte da Narutopedia ${bad.map((b) => b.id).join(',')}`);
ok(
  UNIT_CARDS.every((u) => !('levelUpTarget' in u) && !('chuuninTitle' in u) && !('jounninTitle' in u)),
  'Unidades sem patente/graduação'
);
const curve: Record<number, number> = {};
for (const u of UNIT_CARDS) curve[u.cost] = (curve[u.cost] ?? 0) + 1;
ok(curve[1] === 5 && curve[2] === 18 && curve[3] === 15 && curve[4] === 4 && curve[5] === 2, `curva C1–C5 = 5/18/15/4/2 (${JSON.stringify(curve)})`);
const textAll = (u: UnitCardDef) => u.abilityText + ' ' + u.title;
ok(UNIT_CARDS.every((u) => !/[A-Za-z]+ing |Gain |Draw /.test(textAll(u))), 'texto em pt-BR');
const pendIds = [...Object.keys(UNIT_PENDING_KEYWORDS), ...Object.keys(UNIT_PARTNER_TOKENS), ...Object.values(UNIT_PARTNER_TOKENS)];
ok(pendIds.every((id) => getCardById(id)), 'palavras-chave pendentes/Parceiros apontam para cartas que existem');
const g7Tokens = Object.values(TOKEN_CARDS).filter((t) => t.id.startsWith('token_'));
ok(g7Tokens.every((t) => t.kind === 'token' && !isDeckableCard(t)), 'Tokens não entram no baralho');
for (const p of DECK_PRESETS) ok(validateDeck(p.cardIds).ok, `preset válido: ${p.name}`);

// Comparação com a tabela aprovada (ninjas-vs-unidades.md, seção 3)
const specPath = process.argv[2] ?? '/workspace/naruto-card-game/ninjas-vs-unidades.md';
if (existsSync(specPath)) {
  const md = readFileSync(specPath, 'utf8');
  const sec = md.split('## 3.')[1].split('## 4.')[0];
  const rows = sec
    .split('\n')
    .filter((l) => /^\| [^-|]/.test(l) && !l.startsWith('| Unidade |'))
    .map((l) => l.split('|').map((c) => c.trim()));
  ok(rows.length === 44, `tabela da spec tem 44 linhas (${rows.length})`);
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const miss: string[] = [];
  for (const r of rows) {
    const [, name, , cost, pv] = r;
    const [p, v] = pv.split('/').map(Number);
    const base = norm(name.replace(/\s*\(Irmãos Demônio\)/, ''));
    const c = UNIT_CARDS.find((u) => norm(u.name) === base || norm(u.name).startsWith(base));
    if (!c || c.cost !== Number(cost) || c.attack !== p || c.health !== v) miss.push(`${name} ${cost} ${pv} → ${c ? `${c.cost} ${c.attack}/${c.health}` : 'não achou'}`);
  }
  ok(miss.length === 0, `nome/custo/P/V batem com a spec ${miss.join(' | ')}`);
} else {
  console.log('     (spec não encontrada, pulando comparação)');
}

// ---------- Efeitos de Entrada (todas as 44, dos dois lados) ----------
const mk = (ids: string[], side: 'player' | 'enemy'): PlayerState => {
  const s = createInitialPlayerState([]);
  return { ...s, deck: ['jutsu_fuma_shuriken', 'jutsu_rasengan', 'unit_anbu_konoha'], hand: ['jutsu_rasengan', 'unit_tazuna'], board: ids.map((id) => createBoardUnit(getCardById(id) as UnitCardDef, side, 1, A)) };
};
let crashes = 0;
const tokenCount: Record<string, number> = {
  unit_brigada_marionetes: 1, unit_gozu_meizu: 1, unit_kotetsu_izumo: 1, unit_gato_bandidos: 2, unit_batedor_areia: 2,
  unit_batedor_som: 1, unit_genin_chuva: 2, unit_yoroi_misumi: 1, unit_esquadrao_anbu: 1, unit_shizune: 1,
  unit_cla_fuma: 2, unit_irmaos_estupidos: 1, unit_familia_kurosuki: 2,
};
for (const side of ['player', 'enemy'] as const) {
  for (const card of UNIT_CARDS) {
    try {
      const other = side === 'player' ? 'enemy' : 'player';
      let caster = mk(['naruto_uzumaki'], side);
      const opp = { ...mk(['unit_anbu_konoha', 'unit_capitao_jonin'], other), traps: [{ uid: 't1', cardId: 'trap_selo_explosivo', owner: other, armedRound: 1 }] } as PlayerState;
      const nu = createBoardUnit(card, side, 1, A);
      caster = { ...caster, board: [...caster.board, nu] };
      const logs: BattleLogEntry[] = [];
      const fx: CombatVisualFX = { unitFx: {} };
      const before = caster.board.length;
      const r = applyUnitEntryEffect({ card, side, unitUid: nu.uid, caster, opp, round: 1, arenaId: A, logs, fx });
      if (r.caster.board.length > 5) throw new Error('board > 5');
      const created = r.caster.board.length - before;
      if ((tokenCount[card.id] ?? 0) !== created) throw new Error(`tokens criados ${created}, esperado ${tokenCount[card.id] ?? 0}`);
    } catch (e) {
      crashes++;
      console.log('FAIL entrada', side, card.id, String(e));
    }
  }
}
ok(crashes === 0, 'Entrada das 44 Unidades (jogador e rival) sem erro, Tokens certos');

// Casos específicos
{
  const logs: BattleLogEntry[] = [];
  const fx: CombatVisualFX = { unitFx: {} };
  const run = (id: string, caster: PlayerState, opp: PlayerState) => {
    const card = getCardById(id) as UnitCardDef;
    const nu = createBoardUnit(card, 'player', 1, A);
    const r0 = applyUnitEntryEffect({ card, side: 'player', unitUid: nu.uid, caster: { ...caster, board: [...caster.board, nu] }, opp, round: 1, arenaId: A, logs, fx });
    // Regras contínuas do Grupo 5 (Parceiro, Formação), como os setters do BattleArena fazem.
    return { nu, caster: applyContinuousKeywordRules(r0.caster, 1, 'player').state, opp: r0.opp };
  };
  const empty = mk([], 'player');
  const foe = mk(['unit_kin_tsuchi', 'unit_capitao_jonin'], 'enemy');
  let r = run('unit_esquadrao_anbu_elite', empty, foe);
  ok(r.opp.board.some((u) => u.cardId === 'unit_kin_tsuchi' && u.health === 0), 'Esquadrão Anbu de Elite: 2 de dano mata Kin (2 de Vida)');
  r = run('unit_gozu_meizu', empty, foe);
  ok(r.caster.board.some((u) => u.cardId === 'token_meizu' && u.partnerOfUid === r.nu.uid), 'Gōzu cria Meizu como Parceiro (G5)');
  {
    const gone = applyContinuousKeywordRules({ ...r.caster, board: r.caster.board.filter((u) => u.uid !== r.nu.uid) }, 1, 'player').state;
    ok(!gone.board.some((u) => u.cardId === 'token_meizu'), 'Parceiro: Meizu sai de campo junto com Gōzu');
  }
  {
    const rs = run('unit_shizune', empty, foe);
    ok(rs.caster.board.some((u) => u.cardId === 'token_tonton' && u.partnerOfUid === rs.nu.uid), 'Shizune cria Ton-Ton como Parceiro');
    const ry = run('unit_yoroi_misumi', empty, foe);
    ok(ry.caster.board.some((u) => u.cardId === 'token_misumi' && u.partnerOfUid === ry.nu.uid), 'Yoroi cria Misumi como Parceiro');
  }
  r = run('unit_genin_chuva', empty, foe);
  ok(r.caster.board.filter((u) => u.cardId.includes('genin_chuva')).every((u) => u.attack === 2), 'Genin da Chuva: 3 em campo → Formação +1/+1 em todos');
  r = run('unit_kin_tsuchi', mk(['unit_anbu_konoha', 'unit_tazuna'], 'player'), foe);
  ok(r.caster.board.find((u) => u.uid === r.nu.uid)!.attack === 2, 'Kin com 3 aliados: Formação +1/+1');
  r = run('unit_kin_tsuchi', empty, foe);
  ok(r.caster.board.find((u) => u.uid === r.nu.uid)!.attack === 1, 'Kin sozinha: sem Formação');
  r = run('unit_ibiki_morino', empty, { ...foe, hand: ['jutsu_rasengan', 'unit_tazuna'], cursedHandIndices: { 1: 1 } });
  ok(r.opp.hand.length === 1 && Object.keys(r.opp.cursedHandIndices).length === 0, `Ibiki: rival descartou a carta de menor custo e a marca de maldição saiu junto (sobrou ${r.opp.hand.join(',')})`);
  r = run('unit_mizuki', empty, foe);
  const mz = r.caster.board.find((u) => u.uid === r.nu.uid)!;
  ok(r.caster.hand.includes('jutsu_fuma_shuriken') && !r.caster.deck.includes('jutsu_fuma_shuriken'), 'Mizuki pega a Fūma Shuriken (Taijutsu) do deck para a mão');
  r = run('unit_sasame_fuma', empty, foe);
  ok(r.caster.hand.includes('jutsu_fuma_shuriken') && (r.caster.fleetingHand ?? []).includes('jutsu_fuma_shuriken'), 'Sasame cria Fūma Shuriken Fugaz na mão');
  r = run('unit_ebisu', mk(['naruto_uzumaki'], 'player'), foe);
  ok(r.caster.hand.length === 3, 'Ebisu com Gennin em campo compra 1');
  r = run('unit_konohamaru', mk(['naruto_uzumaki'], 'player'), foe);
  const kn = r.caster.board.find((u) => u.uid === r.nu.uid)!;
  ok(kn.tempAttackBonus === 1 && kn.tempHealthBonus === 1, 'Konohamaru com Naruto: +1/+1 na rodada');
  r = run('unit_ranmaru', mk(['unit_raiga_kurosuki'], 'player'), foe);
  ok(r.caster.board.every((u) => u.attack === (getCardById(u.cardId) as UnitCardDef).attack + 1), 'Ranmaru + Raiga: ambos +1/+1');
  const lb = logs.length;
  r = run('unit_bikochu', empty, { ...foe, traps: [{ uid: 't', cardId: 'trap_selo_explosivo', owner: 'enemy', armedRound: 1 }] });
  ok(logs.slice(lb).some((l) => l.text.includes('farejou: o rival armou')), 'Bikōchū revela o Oculto (log só para o jogador)');
}

// Ao atacar, Início/Fim da rodada, Ao morrer, golpes
{
  const logs: BattleLogEntry[] = [];
  let a = mk(['unit_batedor_areia', 'unit_idate_morino', 'unit_anko_mitarashi'], 'player');
  const d = mk([], 'enemy');
  const [sand, idate, anko] = a.board;
  const atk = (st: PlayerState, uids: string[]) =>
    runRecurringTrigger('ao_atacar', st, d, { round: 1, arenaId: A, sourceUids: uids, attackerCount: uids.length, logs }).owner;
  let a1 = atk(a, [sand.uid]);
  ok(a1.board[0].keywords.includes('Elusivo'), 'Ninjas da Areia: Investida sozinhos → Furtivo (recurring G4)');
  a1 = { ...a1, board: a1.board.map(resetRecurringRoundState) };
  ok(!a1.board[0].keywords.includes('Elusivo'), 'Furtivo temporário some no início da rodada');
  ok(!atk(a, [sand.uid, idate.uid]).board[0].keywords.includes('Elusivo'), 'Ninjas da Areia acompanhados: sem Furtivo');
  let a2 = atk(a, [idate.uid]);
  ok(a2.board[1].tempAttackBonus === 1, 'Idate sozinho: +1/+0');
  a2 = atk(a, [idate.uid, anko.uid]);
  ok(a2.board[1].tempAttackBonus === 0 && a2.board[2].tempAttackBonus === 3 && a2.hp === a.hp - 2, `Anko: paga 2 de Vida, +3/+0; Idate acompanhado sem bônus (hp ${a2.hp})`);
  const low = atk({ ...a, hp: 4 }, [anko.uid]);
  ok(low.hp === 4 && low.board[2].tempAttackBonus === 0, 'Anko com Vitalidade 4: não paga');

  let p = mk(['unit_policia_uchiha'], 'player');
  p = runRecurringTrigger('inicio_rodada', p, d, { round: 2, arenaId: A, logs }).owner;
  ok(p.board[0].hasBarrier, 'Policial Uchiha ganha Substituição no início da rodada');

  const t0 = { ...mk(['unit_tazuna', 'naruto_uzumaki'], 'player'), hp: 15 };
  ok(runRecurringTrigger('fim_rodada', t0, d, { round: 1, arenaId: A, logs }).owner.hp === 16, 'Tazuna com Naruto (Time 7): cura 1 da Vitalidade no fim da rodada');
  const t1 = { ...mk(['unit_tazuna', 'unit_anbu_konoha'], 'player'), hp: 15 };
  ok(runRecurringTrigger('fim_rodada', t1, d, { round: 1, arenaId: A, logs }).owner.hp === 15, 'Tazuna sem Ninja do Time 7: não cura');
  let sz = mk(['unit_shizune', 'unit_capitao_jonin'], 'player');
  sz = { ...sz, board: sz.board.map((u) => (u.cardId === 'unit_capitao_jonin' ? { ...u, health: 1 } : u)) };
  sz = runRecurringTrigger('fim_rodada', sz, d, { round: 1, arenaId: A, logs }).owner;
  ok(sz.board[1].health === 2, 'Shizune cura 1 do aliado mais ferido no fim da rodada');

  let ar = mk(['unit_arashi_fuma'], 'player');
  ar = { ...ar, board: ar.board.map((u) => ({ ...u, health: 0 })) };
  const dres = processBoardDeaths(ar, mk([], 'enemy'), 1, A, logs);
  ok(dres.ownerState.board.length === 1 && dres.ownerState.board[0].cardId === 'token_marionete', 'Arashi ao morrer deixa Marionete 1/1');

  // Dosu ataca bloqueado por 2/2: 1 de dano antes + 2 do golpe → bloqueador morre
  const pa = mk(['unit_dosu_kinuta'], 'player');
  const ea = mk(['unit_anbu_konoha'], 'enemy');
  const rc = resolveCombatPairs([{ attackerUid: pa.board[0].uid, blockerUid: ea.board[0].uid }], 'player', pa, ea, A, 1);
  ok(rc.enemy.board.length === 0, 'Dosu: 1 de dano ao bloqueador antes do golpe');
  // Genma (2/2) atacando Capitão (4/4, Resistente): 4-1=3 e fica com Veneno 1 (dano no início da rodada)
  const pg = mk(['unit_genma_shiranui'], 'player');
  const eg = mk(['unit_capitao_jonin'], 'enemy');
  const rg = resolveCombatPairs([{ attackerUid: pg.board[0].uid, blockerUid: eg.board[0].uid }], 'player', pg, eg, A, 1);
  ok(rg.enemy.board[0]?.health === 3 && rg.enemy.board[0]?.poison === 1, `Genma Veneno 1 (G5): Capitão fica com 3 e envenenado (${rg.enemy.board[0]?.health}, poison ${rg.enemy.board[0]?.poison})`);
  ok(UNIT_CARDS.filter((u) => u.keywords.includes('Formação')).length === 4 && TOKEN_CARDS.token_genin_chuva.keywords.includes('Formação'), 'Formação nas 4 Unidades + Token Genin da Chuva');
}

console.log(fails ? `FALHAS: ${fails}` : 'TODOS OK');
process.exit(fails ? 1 : 0);
