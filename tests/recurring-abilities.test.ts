/* Testes do Grupo 4 (habilidades recorrentes). Rodar: npx tsx tests/recurring-abilities.test.ts */
import {
  createBoardUnit,
  createInitialPlayerState,
  processBoardDeaths,
  resolveCombatPairs,
  resolveJutsuEffect,
} from '../src/engine/battleEngine';
import {
  describeRecurringAbility,
  getRecurringAbilities,
  mergeRecurringAbilityLines,
  runEndOfRoundTriggers,
  runRecurringTrigger,
} from '../src/engine/recurringAbilities';
import { getCardById, JUTSU_CARDS, EQUIPMENT_CARDS } from '../src/data/cards';
import { splitAbilityText, getTriggerHelp } from '../src/data/keywordHelp';
import type { RecurringAbility } from '../src/types/game';

let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? 'OK  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const A = 'arena_chunin' as any;
const R = 3;
const anbu: any = getCardById('unit_anbu_konoha');
const medico: any = getCardById('unit_medico_campo');
const naruto: any = getCardById('naruto_uzumaki');
const set = (card: any, rec: RecurringAbility[] | undefined) => {
  card.recurring = rec;
};
const setNinja = (card: any, rec: any) => {
  card.recurring = rec;
};
const st = (board: any[] = [], extra: any = {}) => ({ ...createInitialPlayerState([]), board, ...extra });
const mk = (card: any, owner: 'player' | 'enemy', over: any = {}) => ({ ...createBoardUnit(card, owner, 1, A), ...over });
const reset = () => {
  set(anbu, undefined);
  set(medico, undefined);
  setNinja(naruto, undefined);
};

// 1) Início da rodada: dano ao inimigo mais forte
reset();
set(anbu, [{ trigger: 'inicio_rodada', effects: [{ type: 'damage', target: 'strongest_enemy', amount: 1 }] }]);
{
  const src = mk(anbu, 'player');
  const weak = mk(medico, 'enemy', { attack: 1 });
  const strong = mk(medico, 'enemy', { attack: 5 });
  const r = runRecurringTrigger('inicio_rodada', st([src]), st([weak, strong]), { round: R, arenaId: A });
  const s2 = r.opp.board.find((u: any) => u.uid === strong.uid)!;
  ok(r.fired === 1 && s2.health === strong.health - 1, 'Início da rodada: 1 de dano no inimigo mais forte');
  ok(r.logs[0]?.text.startsWith('Início da rodada · '), `log em pt-BR: "${r.logs[0]?.text}"`);
  // gatilho diferente não dispara
  ok(runRecurringTrigger('fim_rodada', st([src]), st([strong]), { round: R, arenaId: A }).fired === 0, 'outro gatilho não dispara');
  // Selado não dispara
  ok(runRecurringTrigger('inicio_rodada', st([{ ...src, silenced: true }]), st([strong]), { round: R, arenaId: A }).fired === 0, 'Selado não dispara');
  // Contra-Jutsu anula e é consumido
  const sh = { ...strong, hasSpellShield: true };
  const r2 = runRecurringTrigger('inicio_rodada', st([src]), st([sh]), { round: R, arenaId: A });
  const sh2 = r2.opp.board[0];
  ok(sh2.health === sh.health && !sh2.hasSpellShield, 'Contra-Jutsu anula o efeito inimigo e é consumido');
}

// 2) 1 vez por rodada + condição de aliados (Formação-like)
reset();
set(anbu, [{ trigger: 'ao_conjurar', oncePerRound: true, condition: { minAllies: 2 }, effects: [{ type: 'draw', amount: 1 }] }]);
{
  const src = mk(anbu, 'player');
  const ally = mk(medico, 'player');
  const own = st([src], { deck: ['unit_anbu_konoha', 'unit_anbu_konoha'] });
  ok(runRecurringTrigger('ao_conjurar', own, st(), { round: R, arenaId: A }).fired === 0, 'condição "2+ aliados" não cumprida → não dispara');
  const own2 = { ...own, board: [src, ally] };
  const r1 = runRecurringTrigger('ao_conjurar', own2, st(), { round: R, arenaId: A });
  const r2 = runRecurringTrigger('ao_conjurar', r1.owner, r1.opp, { round: R, arenaId: A });
  ok(r1.fired === 1 && r2.fired === 0 && r1.owner.hand.length === 1, '1 vez por rodada: compra 1 e não repete');
}

// 3) Último Desejo + Vingança + morte em cadeia
reset();
set(anbu, [{ trigger: 'vinganca', effects: [{ type: 'buff', target: 'self', attack: 1, health: 1, permanent: true }, { type: 'damage', target: 'all_enemies', amount: 1 }] }]);
set(medico, [{ trigger: 'ultimo_desejo', effects: [{ type: 'gate_heal', amount: 2 }] }]);
{
  const avenger = mk(anbu, 'player');
  const dying = mk(medico, 'player', { health: 0 });
  const foe = mk(medico, 'enemy', { health: 1, maxHealth: 3 }); // morre pela Vingança e dispara Último Desejo do rival
  const logs: any[] = [];
  const owner = st([avenger, dying], { hp: 10 });
  const opp = st([foe], { hp: 10 });
  const r = processBoardDeaths(owner, opp, R, A, logs);
  const av = r.ownerState.board.find((u: any) => u.uid === avenger.uid)!;
  ok(r.ownerState.hp === 12, 'Último Desejo: Vitalidade curado em 2');
  ok(av.attack === avenger.attack + 1 && av.maxHealth === avenger.maxHealth + 1, 'Vingança: +1/+1 permanente no aliado');
  ok(r.oppState.board.length === 0 && r.oppState.hp === 12, 'Morte em cadeia: inimigo morreu pela Vingança e o Último Desejo dele disparou');
  ok(logs.some((l) => l.text.startsWith('Vingança · ')) && logs.some((l) => l.text.startsWith('Último Desejo · ')), 'logs de Vingança e Último Desejo');
  // Segunda Chance não conta como morte
  const imm = mk(medico, 'player', { health: 0, keywords: ['Renascer'] });
  const r2 = processBoardDeaths(st([avenger, imm], { hp: 10 }), st(), R, A, []);
  ok(r2.ownerState.hp === 10 && r2.ownerState.board.length === 2, 'Segunda Chance: sem Último Desejo/Vingança');
}

// 4) Combate: Ao bloquear, Ao golpear, Repouso (agiu)
reset();
set(medico, [{ trigger: 'ao_bloquear', effects: [{ type: 'damage', target: 'combat_enemy', amount: 1 }] }]);
set(anbu, [{ trigger: 'ao_golpear', effects: [{ type: 'gate_heal', amount: 1 }] }]);
{
  const att = mk(anbu, 'player', { attack: 2, health: 3, maxHealth: 3 });
  const blk = mk(medico, 'enemy', { attack: 1, health: 5, maxHealth: 5 });
  const P = st([att], { hp: 10 });
  const E = st([blk], { hp: 20 });
  const res = resolveCombatPairs([{ attackerUid: att.uid, blockerUid: blk.uid }], 'player', P, E, A, R);
  const a2 = res.player.board.find((u: any) => u.uid === att.uid)!;
  const b2 = res.enemy.board.find((u: any) => u.uid === blk.uid)!;
  ok(a2.health === 3 - 1 - 1, `Ao bloquear: atacante sofreu 1 antes do golpe (+1 do golpe) → ${a2.health}`);
  ok(b2.health === 5 - 2, 'golpe normal após Ao bloquear');
  ok(res.player.hp === 11, 'Ao golpear: atacante curou 1 da Vitalidade');
  ok(Boolean(a2.actedThisRound) && Boolean(b2.actedThisRound), 'atacante e bloqueador marcados como "agiu"');
  // Ao bloquear mata o atacante → sem golpes
  const frag = mk(anbu, 'player', { attack: 4, health: 1, maxHealth: 1 });
  const res2 = resolveCombatPairs([{ attackerUid: frag.uid, blockerUid: blk.uid }], 'player', st([frag], { hp: 10 }), st([blk], { hp: 20 }), A, R);
  ok(res2.player.board.length === 0 && res2.enemy.board[0].health === 5 && res2.player.hp === 10, 'Ao bloquear que mata o atacante cancela o combate do par');
  // Golpe na Vitalidade (sem bloqueio)
  const res3 = resolveCombatPairs([{ attackerUid: att.uid, blockerUid: null }], 'player', st([att], { hp: 10 }), st([], { hp: 20 }), A, R);
  ok(res3.player.hp === 11 && res3.enemy.hp === 18, 'Ao golpear também dispara golpeando a Vitalidade');
}

// 5) Fim da rodada e Repouso
reset();
set(anbu, [{ trigger: 'repouso', effects: [{ type: 'heal', target: 'self', amount: 2 }] }]);
set(medico, [{ trigger: 'fim_rodada', effects: [{ type: 'reserve', amount: 5 }] }]);
{
  const rested = mk(anbu, 'player', { health: 1 });
  const acted = mk(anbu, 'player', { health: 1, actedThisRound: true });
  const med = mk(medico, 'enemy');
  const r = runEndOfRoundTriggers(st([rested, acted]), st([med], { spellMana: 0 }), { round: R, arenaId: A });
  ok(r.first.board.find((u: any) => u.uid === rested.uid)!.health === Math.min(rested.maxHealth, 3), 'Repouso: quem não agiu cura 2');
  ok(r.first.board.find((u: any) => u.uid === acted.uid)!.health === 1, 'Repouso: quem atacou/bloqueou não dispara');
  ok(r.second.spellMana === 3, 'Fim da rodada: Reserva respeita o teto 3');
}

// 6) Ao conjurar via resolveJutsuEffect
reset();
set(anbu, [{ trigger: 'ao_conjurar', effects: [{ type: 'buff', target: 'self', attack: 1, health: 0 }] }]);
{
  const src = mk(anbu, 'player');
  const jutsu: any = JUTSU_CARDS.find((j: any) => j.targetMode === 'none' && j.category === 'Cura') ?? JUTSU_CARDS[0];
  const res = resolveJutsuEffect(jutsu, 'player', undefined, st([src], { hp: 10 }), st([mk(medico, 'enemy')]), A, R);
  const u = res.player.board.find((x: any) => x.uid === src.uid)!;
  ok(u.tempAttackBonus >= 1, `Ao conjurar (${jutsu.name}): +1/+0 nesta rodada`);
}

// 7) Patente: Ninja só usa a lista da patente atual; Equipamento dá gatilho ao portador
reset();
setNinja(naruto, { 2: [{ trigger: 'ao_atacar', effects: [{ type: 'gate_damage', amount: 1 }] }] });
{
  const g = mk(naruto, 'player');
  const c = { ...g, evolutionLevel: 2 };
  ok(getRecurringAbilities(g).length === 0 && getRecurringAbilities(c).length === 1, 'Ninja: habilidades por patente (Gennin 0, Chuunin 1)');
  const r = runRecurringTrigger('ao_atacar', st([c]), st([], { hp: 20 }), { round: R, arenaId: A, sourceUids: [c.uid] });
  ok(r.opp.hp === 19 && r.owner.damagedEnemyNexusThisRound, 'Investida: 1 de dano à Vitalidade rival');
  ok(runRecurringTrigger('ao_atacar', st([c]), st([], { hp: 20 }), { round: R, arenaId: A, sourceUids: [] }).fired === 0, 'Investida só para atacantes declarados');
  const eq: any = EQUIPMENT_CARDS[0];
  const prev = eq.recurring;
  eq.recurring = [{ trigger: 'inicio_rodada', effects: [{ type: 'gate_heal', amount: 1 }] }];
  const holder = mk(anbu, 'player', { equippedCardId: eq.id });
  ok(getRecurringAbilities(holder).length === 1, `Equipamento (${eq.name}) dá gatilho ao portador`);
  eq.recurring = prev;
}

// 8) Invocação respeita 5 no campo
reset();
set(anbu, [{ trigger: 'inicio_rodada', effects: [{ type: 'summon', tokenId: 'token_kage_bunshin' }] }]);
{
  const full = [mk(anbu, 'player'), mk(medico, 'player'), mk(medico, 'player'), mk(medico, 'player')];
  const r = runRecurringTrigger('inicio_rodada', st(full), st(), { round: R, arenaId: A });
  ok(r.owner.board.length === 5, 'Invoca Clone até o limite de 5');
  const r2 = runRecurringTrigger('inicio_rodada', r.owner, st(), { round: R, arenaId: A });
  ok(r2.owner.board.length === 5, 'Campo cheio: não invoca');
}

// 9) Textos pt-BR
{
  const a: RecurringAbility = { trigger: 'vinganca', condition: { minAllies: 3 }, effects: [{ type: 'buff', target: 'self', attack: 1, health: 1, permanent: true }] };
  const t = describeRecurringAbility(a);
  ok(t === 'Vingança: Com 3+ aliados em campo, esta unidade ganha +1/+1.', `texto gerado: "${t}"`);
  const lines = mergeRecurringAbilityLines(splitAbilityText('Vingança: ganha +1/+1.'), [a]);
  ok(lines.length === 1, 'sem linha duplicada quando o texto já tem o gatilho');
  const lines2 = mergeRecurringAbilityLines(splitAbilityText('Entrada: compre 1 carta.'), [a]);
  ok(lines2.length === 2 && lines2[1].trigger === 'Vingança', 'linha extra gerada para gatilho só nos dados');
  ok(splitAbilityText('Repouso: cure 2. Ao conjurar: +1/+0.').map((l) => l.trigger).join(',') === 'Repouso,Ao conjurar', 'gatilhos novos em negrito no texto');
  ok(Boolean(getTriggerHelp('Repouso')) && Boolean(getTriggerHelp('Investida')) && Boolean(getTriggerHelp('Ao atacar')), 'ajuda de 1 linha dos gatilhos');
}

reset();
console.log(fails ? `FALHAS: ${fails}` : 'TODOS OK');
process.exit(fails ? 1 : 0);
