/**
 * Merge 4+5+6+7 · substitutos dos Grupos 6/7 trocados pelas mecânicas reais (G4 recurring, G5 palavras-chave).
 * Rodar: npx tsx tests/merge-4567.test.ts
 */
import { getCardById, JUTSU_CARDS, NINJA_CARDS, SIGNATURE_JUTSU_IDS } from '../src/data/cards';
import {
  createBoardUnit,
  createInitialPlayerState,
  evolveUnitIfReady,
  processBoardDeaths,
  resolveCombatPairs,
  resolveJutsuEffect,
} from '../src/engine/battleEngine';
import { applyNinjaEntry, applyNinjaRoundStart } from '../src/engine/ninjaEffects';
import { applyContinuousKeywordRules, applyRoundStartKeywords, GENJUTSU_UNTIL_KAI, isInGenjutsu } from '../src/engine/keywords';
import { runRecurringTrigger } from '../src/engine/recurringAbilities';
import type { BattleLogEntry, BoardUnit, CardDef, JutsuCardDef, NinjaCardDef, PlayerState } from '../src/types/game';

let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? 'OK  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const A = 'arena_chunin' as const;
const base = (): PlayerState => ({ ...createInitialPlayerState([]), hand: [], deck: ['jutsu_rasengan', 'jutsu_rasengan'] });
const unit = (id: string, side: 'player' | 'enemy' = 'player', level: 1 | 2 | 3 = 1): BoardUnit => {
  let u = createBoardUnit(getCardById(id) as CardDef as never, side, 1, A);
  while (u.evolutionLevel < level) u = evolveUnitIfReady({ ...u, evolutionProgress: u.evolutionTarget }, A);
  return u;
};
const ctx = () => ({ round: 1, arenaId: A, logs: [] as BattleLogEntry[] });
const def = (id: string) => getCardById(id) as NinjaCardDef;

// Kiba / Sakon: Parceiro real
{
  const kiba = unit('kiba_inuzuka');
  const r = applyNinjaEntry(def('kiba_inuzuka'), kiba.uid, 'player', { ...base(), board: [kiba] }, base(), ctx());
  const ak = r.owner.board.find((u) => u.cardId === 'token_akamaru');
  ok(Boolean(ak && ak.partnerOfUid === kiba.uid && ak.keywords.includes('Parceiro')), 'Kiba: Akamaru entra como Parceiro');
  const gone = applyContinuousKeywordRules({ ...r.owner, board: r.owner.board.filter((u) => u.uid !== kiba.uid) }, 1, 'player').state;
  ok(gone.board.length === 0, 'Parceiro: Akamaru sai junto com Kiba');
  const s = unit('sakon_ukon');
  const rs = applyNinjaEntry(def('sakon_ukon'), s.uid, 'player', { ...base(), board: [s] }, base(), ctx());
  ok(rs.owner.board.some((u) => u.cardId === 'token_ukon' && u.partnerOfUid === s.uid), 'Sakon: Ukon entra como Parceiro');
  const k2 = unit('kiba_inuzuka', 'player', 2);
  ok(!k2.keywords.includes('Patrulheiro' as never) && !JSON.stringify(def('kiba_inuzuka')).includes('Patrulheiro'), 'Kiba sem a palavra-chave cortada Patrulheiro');
}

// Kurenai: Genjutsu do Grupo 5
{
  const k = unit('kurenai_yuhi');
  const foe = unit('unit_anbu_konoha', 'enemy');
  const r = applyNinjaEntry(def('kurenai_yuhi'), k.uid, 'player', { ...base(), board: [k] }, { ...base(), board: [foe] }, ctx());
  const f = r.opp.board[0];
  ok(isInGenjutsu(f) && !f.stunned && f.genjutsu === 2, `Kurenai Entrada: Genjutsu (2 rodadas), não Paralisia (genjutsu=${f.genjutsu})`);
  const k2 = unit('kurenai_yuhi', 'player', 2);
  const r2 = applyNinjaRoundStart('player', { ...base(), board: [k2] }, { ...base(), board: [unit('unit_anbu_konoha', 'enemy')] }, ctx());
  ok(r2.opp.board[0].genjutsu === GENJUTSU_UNTIL_KAI, 'Kurenai Chuunin: Genjutsu que só sai com Kai');
  let e = r2.opp;
  for (let i = 0; i < 4; i++) e = applyRoundStartKeywords(e, 2 + i, 'enemy');
  ok(isInGenjutsu(e.board[0]), 'Genjutsu de Kurenai Chuunin não expira sozinho');
  // Sakura (Kai): remove Genjutsu
  const ally = { ...unit('unit_anbu_konoha'), genjutsu: GENJUTSU_UNTIL_KAI };
  const sak = unit('sakura_haruno');
  const rk = applyNinjaEntry(def('sakura_haruno'), sak.uid, 'player', { ...base(), board: [ally, sak] }, base(), ctx());
  ok(!isInGenjutsu(rk.owner.board[0]), 'Sakura (Kai) remove o Genjutsu do aliado');
}

// Kankurō Chuunin: Veneno do Grupo 5
{
  const k = unit('kankuro', 'player', 2);
  ok(k.keywords.includes('Veneno'), 'Kankurō Chuunin tem a palavra-chave Veneno');
  const foe = unit('unit_capitao_jonin', 'enemy');
  const r = resolveCombatPairs([{ attackerUid: k.uid, blockerUid: foe.uid }], 'player', { ...base(), board: [k] }, { ...base(), board: [foe] }, A, 1);
  const f = r.enemy.board.find((u) => u.uid === foe.uid);
  ok(!f || (f.poison ?? 0) === 1, `Kankurō envenena quem golpeia (poison=${f?.poison})`);
}

// Copiar: Sasuke Chuunin e Kakashi Chuunin/Jounnin
{
  const sas = unit('sasuke_uchiha', 'player', 2);
  const kak = unit('kakashi_hatake', 'player', 2);
  const kak3 = unit('kakashi_hatake', 'player', 3);
  ok(sas.keywords.includes('Copiar') && kak.keywords.includes('Copiar') && kak3.keywords.includes('Copiar'), 'Copiar em Sasuke Chuunin e Kakashi Chuunin/Jounnin');
  const j = JUTSU_CARDS.find((x) => !SIGNATURE_JUTSU_IDS.has(x.id) && x.category === 'Cura') as JutsuCardDef;
  const before = kak.evolutionProgress;
  const res = resolveJutsuEffect(j, 'enemy', undefined, { ...base(), board: [kak] }, { ...base(), board: [unit('unit_anbu_konoha', 'enemy')] }, A, 1);
  ok(res.player.hand.includes(j.id) && (res.player.fleetingHand ?? []).includes(j.id), `Kakashi copiou ${j.name} (cópia Fugaz)`);
  const k1 = res.player.board.find((u) => u.uid === kak.uid)!;
  ok(k1.evolutionProgress === before + 1, `cópia conta para a promoção de Kakashi (${before} → ${k1.evolutionProgress})`);
  const res2 = resolveJutsuEffect(j, 'enemy', undefined, res.player, res.enemy, A, 1);
  ok(res2.player.board.find((u) => u.uid === kak.uid)!.evolutionProgress === before + 1, '1 cópia por rodada');
}

// Recorrentes do G6 que viraram dados G4
{
  const haku = { ...unit('haku', 'player', 2), health: 0 };
  const st = { ...base(), hp: 10, board: [haku] };
  const d = processBoardDeaths(st, base(), 1, A, []);
  ok(d.ownerState.hp === 13, `Haku Chuunin Último Desejo: cura 3 da Vitalidade (hp ${d.ownerState.hp})`);
  const tay = { ...unit('tayuya', 'player', 2), health: 0 };
  const d2 = processBoardDeaths({ ...base(), board: [tay] }, { ...base(), board: [unit('unit_anbu_konoha', 'enemy')] }, 1, A, []);
  ok(d2.oppState.board[0].stunned, 'Tayuya Chuunin Último Desejo: paralisa 1 inimigo');
  const sak = unit('sakura_haruno', 'player', 2);
  const hurt = { ...unit('unit_capitao_jonin'), health: 2 };
  const r = runRecurringTrigger('fim_rodada', { ...base(), board: [sak, hurt] }, base(), { round: 1, arenaId: A });
  ok(r.owner.board[1].health === 3, 'Sakura Chuunin Fim da rodada: cura 1 de cada aliado ferido');
  const nar = unit('naruto_uzumaki', 'player', 3);
  const rn = runRecurringTrigger('inicio_rodada', { ...base(), board: [nar] }, base(), { round: 2, arenaId: A });
  ok(rn.owner.board.some((u) => u.cardId === 'token_kage_bunshin'), 'Naruto Jounnin Início da rodada: Clone das Sombras');
  const nrs = applyNinjaRoundStart('player', { ...base(), board: [nar] }, base(), ctx());
  ok(!nrs.owner.board.some((u) => u.cardId === 'token_kage_bunshin'), 'sem Clone em dobro (código antigo removido)');
}

// Nenhuma palavra-chave cortada sobrou nos Ninjas
{
  const cut = ['Patrulheiro', 'Espreitar', 'Instável', 'Pilhagem', 'Iniciativa', 'Sequência', 'Emboscada', 'Batedor'];
  const bad = NINJA_CARDS.filter((n) => {
    const d = n as NinjaCardDef;
    const kws = [...d.keywords, ...(d.chuuninKeywords ?? []), ...(d.jounninKeywords ?? [])] as string[];
    return kws.some((k) => cut.includes(k));
  });
  ok(bad.length === 0, `nenhum Ninja com palavra-chave cortada ${bad.map((b) => b.id).join(',')}`);
}

console.log(fails ? `FALHAS: ${fails}` : 'TODOS OK');
process.exit(fails ? 1 : 0);
