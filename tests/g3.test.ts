// @ts-nocheck — teste rápido dos Grupos 2/3 (tsx), tipagem solta.
import { getNinjaPatenteCost, createInitialPlayerState, getEffectiveCost, createBoardUnit, evolveUnitIfReady, normalizeNinjaHand, onNinjaEnteredBoard, applySavedRank, drawCards, canPayCard } from '../src/engine/battleEngine';
import { getCardById, getNinjaDuplicateCardId, NINJA_CARDS } from '../src/data/cards';
let fails = 0; const ok = (c: boolean, m: string) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const naruto: any = getCardById('naruto_uzumaki');
const dup = getNinjaDuplicateCardId(naruto);
const A = 'arena_chunin' as any;
let s: any = { ...createInitialPlayerState([]), hand: ['naruto_uzumaki', 'naruto_uzumaki'], deck: ['naruto_uzumaki'], mana: 10 };
// joga 1ª cópia
let u = createBoardUnit(naruto, 'player', 1, A);
let prev = s;
s = { ...s, hand: ['naruto_uzumaki'], board: [u] };
s = onNinjaEnteredBoard(naruto, s, 1);
s = normalizeNinjaHand(prev, s, 'player', 1).state;
ok(!s.hand.includes('naruto_uzumaki') && s.hand.filter((c: string) => c === dup).length === 2, `2ª cópia na mão virou ${dup} (+ Exclusivo criado)`);
ok(s.ninjaCopies.naruto_uzumaki === 1, 'contagem de cópias transformadas = 1');
// cópia chega por retorno/geração: normalize transforma
prev = s; let s2 = normalizeNinjaHand(prev, { ...s, hand: [...s.hand, 'naruto_uzumaki'] }, 'player', 1).state;
ok(!s2.hand.includes('naruto_uzumaki') && s2.ninjaCopies!.naruto_uzumaki === 2, 'cópia gerada/devolvida com Ninja em campo vira o Exclusivo na hora');
// compra
let s3 = drawCards(s, 1);
ok(!s3.hand.includes('naruto_uzumaki') && s3.ninjaCopies!.naruto_uzumaki === 2, 'cópia comprada vira o Exclusivo');
// promove a Chuunin com progresso parcial
let pu = evolveUnitIfReady({ ...u, evolutionProgress: u.evolutionTarget }, A);
pu = { ...pu, evolutionProgress: 2 };
ok(pu.evolutionLevel === 2, 'promovido a Chuunin');
s = { ...s, board: [pu] };
// morre
prev = s; const r = normalizeNinjaHand(prev, { ...s, board: [] }, 'player', 3);
s = r.state;
ok(s.hand.filter((c: string) => c === 'naruto_uzumaki').length === 1 && s.hand.filter((c: string) => c === dup).length === 1, 'ao morrer: 1 cópia voltou a ser Naruto; o Exclusivo criado continua');
ok(s.ninjaMemory.naruto_uzumaki.level === 2 && s.ninjaMemory.naruto_uzumaki.progress === 2, `patente salva Chuunin 2/${pu.evolutionTarget}`);
console.log('     log:', r.logs.map(l => l.text).join(' | '));
const c = getEffectiveCost(naruto, s, A);
ok(c === naruto.cost + 1, `custo de retorno Chuunin = ${naruto.cost}+1 = ${c}`);
ok(!canPayCard(naruto, { ...s, mana: c - 1, spellMana: 3 }, A), 'custo de retorno só com Chakra principal');
const nu = applySavedRank(createBoardUnit(naruto, 'player', 4, A), s, A);
ok(nu.evolutionLevel === 2 && nu.evolutionProgress === 2, 'próxima cópia entra Chuunin com progresso 2');
ok(nu.attack >= naruto.chuuninAttack, 'stats de Chuunin aplicados');
// Jounnin
const ju = evolveUnitIfReady({ ...nu, evolutionProgress: nu.evolutionTarget }, A);
const sj = normalizeNinjaHand({ ...s, board: [ju], hand: [] }, { ...s, board: [], hand: [] }, 'player', 5).state;
ok(sj.ninjaMemory!.naruto_uzumaki.level === 3 && getEffectiveCost(naruto, sj, A) === getNinjaPatenteCost(naruto, 3), 'Jounnin salvo, custo da patente Jounnin (ficha do Grupo 6)');
// teto 10
let maxOk = true; for (const n of NINJA_CARDS as any[]) { const ss: any = { ...createInitialPlayerState([]), ninjaMemory: { [n.id]: { level: 3, progress: 0, target: 0, seq: 1 } } }; if (getEffectiveCost(n, ss, A) > 10 || getEffectiveCost(n, ss, A) < 1) maxOk = false; }
ok(maxOk, 'custos de patente entre 1 e 10');
// retorno à mão (bounce) não é morte
const sb = normalizeNinjaHand({ ...s, board: [nu], hand: [] }, { ...s, board: [], hand: ['naruto_uzumaki'] }, 'player', 5);
ok(sb.logs.length === 0, 'voltar para a mão não conta como morte');
console.log(fails ? `FALHAS: ${fails}` : 'TODOS OK'); process.exit(fails ? 1 : 0);
