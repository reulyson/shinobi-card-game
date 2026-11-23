// @ts-nocheck — teste rápido dos Grupos 2/3 (tsx), tipagem solta.
import { createInitialPlayerState, getEffectiveCost, canPayCard, getUnplayableReason, createBoardUnit, MIN_CARD_COST, MAX_TOTAL_DISCOUNT } from '../src/engine/battleEngine';
import { getCardById, JUTSU_CARDS, NINJA_CARDS } from '../src/data/cards';
let fails = 0; const ok = (c: boolean, m: string) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const naruto: any = getCardById('naruto_uzumaki');
const kakashi: any = getCardById('kakashi_hatake');
const st = createInitialPlayerState([]);
// (1) Ninja paga só Chakra principal
let s: any = { ...st, mana: naruto.cost - 1, spellMana: 3 };
ok(!canPayCard(naruto, s, 'arena_chunin'), 'Ninja não usa Reserva (mana=cost-1, reserva 3 → não pode)');
console.log('     motivo:', getUnplayableReason(naruto, s, 'arena_chunin'));
s = { ...st, mana: naruto.cost, spellMana: 0 };
ok(canPayCard(naruto, s, 'arena_chunin'), 'Ninja com Chakra principal suficiente → pode');
const u = createBoardUnit(naruto, 'player', 1, 'arena_chunin');
ok(u.evolutionLevel === 1 && !u.evolved, 'Ninja entra como Gennin (nível 1)');
// (2) Ninja Único
s = { ...st, mana: 10, board: [u] };
ok(!canPayCard(naruto, s, 'arena_chunin'), '2ª cópia bloqueada com o 1º em campo');
console.log('     motivo:', getUnplayableReason(naruto, s, 'arena_chunin'));
s = { ...st, mana: 10, board: [] };
ok(canPayCard(naruto, s, 'arena_chunin'), '2ª cópia liberada depois que o 1º morreu (campo vazio)');
// (3) custo mínimo / teto de desconto
const kUnit = { ...createBoardUnit(kakashi, 'player', 1, 'arena_chunin'), evolved: true };
const cheap: any = JUTSU_CARDS.filter((j: any) => j.cost === 1)[0];
s = { ...st, board: [kUnit], mana: 10 };
if (cheap) ok(getEffectiveCost(cheap, s, 'arena_chunin') === 1, `Jutsu custo 1 com Kakashi −1 continua 1 (${cheap.name})`);
const j3: any = JUTSU_CARDS.find((j: any) => j.cost === 3);
ok(getEffectiveCost(j3, s, 'arena_chunin') === 2, `Jutsu custo 3 com Kakashi −1 → 2 (${j3.name})`);
let minOk = true;
for (const c of [...JUTSU_CARDS, ...NINJA_CARDS] as any[]) if (c.cost >= 1 && getEffectiveCost(c, s, 'arena_chunin') < MIN_CARD_COST) minOk = false;
ok(minOk, 'Nenhuma carta abaixo de 1 após desconto');
ok(MAX_TOTAL_DISCOUNT === 2, 'Teto de desconto somado = −2');
s = { ...st, board: [kUnit], cursedHandIndices: { 0: 1 } };
ok(getEffectiveCost(j3, s, 'arena_chunin', 0) === 3, 'Maldição soma por cima do desconto (3−1+1=3)');
console.log(fails ? `FALHAS: ${fails}` : 'TODOS OK');
process.exit(fails ? 1 : 0);
