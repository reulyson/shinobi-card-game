/**
 * Grupo 8 — regras decididas: Oculto, Fūma/Kai, limites, Vitalidade.
 * Rode: npx tsx tests/grupo8-rules.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ALL_CARDS,
  getCardById,
  OCULTO_JUTSU_CARDS,
  EQUIPMENT_CARDS,
  JUTSU_CARDS,
} from '../src/data/cards';
import {
  createBoardUnit,
  createInitialPlayerState,
  getMatchingTraps,
  getUnplayableReason,
  isOcultoArmable,
  MAX_BOARD_UNITS,
  MAX_HAND_SIZE,
  MAX_OCULTO_IN_PLAY,
  resolveJutsuEffect,
  resolveTrapEffect,
  STARTING_VITALIDADE,
} from '../src/engine/battleEngine';
import { applyGenjutsu, applyKai, isInGenjutsu } from '../src/engine/keywords';
import { isOcultoJutsu, KEYWORD_DISPLAY_NAME, SPEED_DISPLAY_NAME } from '../src/types/game';
import type { JutsuCardDef, UnitCardDef } from '../src/types/game';

const ARENA = 'arena_chunin' as const;

test('limites Grupo 8: mão 9, campo 5, Oculto 3, Vitalidade 20', () => {
  assert.equal(MAX_HAND_SIZE, 9);
  assert.equal(MAX_BOARD_UNITS, 5);
  assert.equal(MAX_OCULTO_IN_PLAY, 3);
  assert.equal(STARTING_VITALIDADE, 20);
  const st = createInitialPlayerState([]);
  assert.equal(st.hp, 20);
  assert.equal(st.maxHp, 20);
});

test('tipo Armadilha removido: nenhuma carta com kind armadilha', () => {
  for (const c of ALL_CARDS) {
    assert.notEqual((c as { kind: string }).kind, 'armadilha', c.id);
  }
});

test('Ocultos armáveis: ex-Armadilhas viraram Jutsu speed Oculta com gatilho', () => {
  assert.ok(OCULTO_JUTSU_CARDS.length >= 5);
  for (const c of OCULTO_JUTSU_CARDS) {
    assert.equal(c.kind, 'jutsu');
    assert.equal(c.speed, 'Oculta');
    assert.ok(c.triggerType, c.id);
    assert.equal(isOcultoArmable(c), true);
  }
  assert.equal(SPEED_DISPLAY_NAME.Oculta, 'Oculto');
});

test('Kawarimi e Kirigakure: listados Oculto (gatilho pendente)', () => {
  const kaw = getCardById('jutsu_substituicao') as JutsuCardDef;
  const kiri = getCardById('jutsu_kirigakure') as JutsuCardDef;
  assert.equal(kaw.speed, 'Oculta');
  assert.equal(kiri.speed, 'Oculta');
  assert.equal(isOcultoJutsu(kaw), true);
  assert.equal(isOcultoArmable(kaw), false, 'sem triggerType: não arma face-down ainda');
});

test('Fūma Shuriken: Taijutsu Rápido; não é mais Equipamento', () => {
  const fuma = getCardById('jutsu_fuma_shuriken') as JutsuCardDef;
  assert.ok(fuma);
  assert.equal(fuma.speed, 'Rapida');
  assert.equal(fuma.family, 'Taijutsu');
  assert.equal(getCardById('equip_shuriken'), undefined);
  assert.ok(!EQUIPMENT_CARDS.some((e) => e.name.includes('Fūma')));
});

test('Kai: Genjutsu Rápido remove Genjutsu e Selado', () => {
  const kai = getCardById('jutsu_kai') as JutsuCardDef;
  assert.ok(kai);
  assert.equal(kai.speed, 'Rapida');
  assert.equal(kai.family, 'Genjutsu');
  const unitDef = getCardById('unit_anbu_konoha') as UnitCardDef;
  const u = {
    ...createBoardUnit(unitDef, 'player', 1, ARENA),
    silenced: true,
  };
  const g = applyGenjutsu(u);
  assert.equal(isInGenjutsu(g), true);
  const cleared = applyKai(g);
  assert.equal(isInGenjutsu(cleared), false);
  assert.equal(cleared.silenced, false);

  const p = createInitialPlayerState([]);
  const e = createInitialPlayerState([]);
  p.board = [g];
  const r = resolveJutsuEffect(kai, 'player', g.uid, p, e, ARENA, 1);
  assert.equal(isInGenjutsu(r.player.board[0]), false);
  assert.equal(r.player.board[0].silenced, false);
});

test('máx. 3 Ocultos armados: getUnplayableReason', () => {
  const trap = OCULTO_JUTSU_CARDS[0];
  const st = {
    ...createInitialPlayerState([]),
    mana: 10,
    spellMana: 3,
    traps: [
      { uid: 'a', cardId: trap.id, owner: 'player' as const, armedRound: 1 },
      { uid: 'b', cardId: trap.id, owner: 'player' as const, armedRound: 1 },
      { uid: 'c', cardId: trap.id, owner: 'player' as const, armedRound: 1 },
    ],
  };
  const reason = getUnplayableReason(trap, st, ARENA);
  assert.match(reason ?? '', /3 Ocultos/);
});

test('Impacto exibe Ataque à Vitalidade', () => {
  assert.equal(KEYWORD_DISPLAY_NAME.Impacto, 'Ataque à Vitalidade');
});

test('Fūma resolve: causa 2 de dano (TODO valor)', () => {
  const fuma = getCardById('jutsu_fuma_shuriken') as JutsuCardDef;
  const unitDef = getCardById('unit_anbu_konoha') as UnitCardDef;
  const p = createInitialPlayerState([]);
  const e = createInitialPlayerState([]);
  const target = createBoardUnit(unitDef, 'enemy', 1, ARENA);
  target.health = 5;
  target.maxHealth = 5;
  e.board = [target];
  const r = resolveJutsuEffect(fuma, 'player', target.uid, p, e, ARENA, 1);
  assert.equal(r.enemy.board[0]?.health, 3);
});

// Sanity: JUTSU_CARDS includes novos
test('JUTSU_CARDS inclui Fūma e Kai', () => {
  assert.ok(JUTSU_CARDS.some((j) => j.id === 'jutsu_fuma_shuriken'));
  assert.ok(JUTSU_CARDS.some((j) => j.id === 'jutsu_kai'));
});

test('Kagemane no Jutsu: Oculto Ninjutsu, gatilho ataque, Paralisa (custo/efeito intactos)', () => {
  const card = getCardById('trap_possessao_sombras') as JutsuCardDef;
  assert.equal(card.kind, 'jutsu');
  assert.equal(card.speed, 'Oculta');
  assert.equal(card.family, 'Ninjutsu');
  assert.equal(card.category, 'Enfraquecer');
  assert.equal(card.cost, 2);
  assert.equal(card.triggerType, 'on_enemy_attack');
  assert.match(card.effectText, /Paralise o atacante mais forte/);
  assert.equal(isOcultoArmable(card), true);
  assert.doesNotMatch(card.effectText, /Armadilha|Portão/);

  const unitDef = getCardById('unit_anbu_konoha') as UnitCardDef;
  const p = createInitialPlayerState([]);
  const e = createInitialPlayerState([]);
  const att = createBoardUnit(unitDef, 'enemy', 1, ARENA);
  e.board = [att];
  p.traps = [{ uid: 'k1', cardId: card.id, owner: 'player', armedRound: 1 }];
  assert.equal(getMatchingTraps('attack', p).length, 1);
  const r = resolveTrapEffect(card.id, 'player', p, e, [{ attackerUid: att.uid, blockerUid: null }], ARENA, 1);
  assert.equal(r.enemy.board[0]?.stunned, true);
  assert.equal(r.attackPairs.length, 0);
  assert.ok(r.logs.some((l) => /Oculto · Kagemane/.test(l.text) && l.cardId === card.id));
});

test('Gogyō Fūin: Oculto Ninjutsu, gatilho jutsu, −2 Reserva / +2 Vitalidade (intactos)', () => {
  const card = getCardById('trap_selo_cinco_elementos') as JutsuCardDef;
  assert.equal(card.kind, 'jutsu');
  assert.equal(card.speed, 'Oculta');
  assert.equal(card.family, 'Ninjutsu');
  assert.equal(card.category, 'Enfraquecer');
  assert.equal(card.cost, 2);
  assert.equal(card.triggerType, 'on_enemy_jutsu');
  assert.match(card.effectText, /perde 2 de Reserva/);
  assert.match(card.effectText, /Vitalidade/);
  assert.doesNotMatch(card.effectText, /Armadilha|Portão/);
  assert.equal(isOcultoArmable(card), true);

  const p = { ...createInitialPlayerState([]), hp: 10, maxHp: 20 };
  const e = { ...createInitialPlayerState([]), spellMana: 3 };
  p.traps = [{ uid: 'g1', cardId: card.id, owner: 'player', armedRound: 1 }];
  assert.equal(getMatchingTraps('jutsu', p).length, 1);
  const r = resolveTrapEffect(card.id, 'player', p, e, [], ARENA, 1);
  assert.equal(r.enemy.spellMana, 1);
  assert.equal(r.player.hp, 12);
  assert.ok(r.logs.some((l) => /Oculto · Gogyō Fūin/.test(l.text) && /Vitalidade/.test(l.text)));
});
