import assert from 'node:assert/strict';
import {
  BOARD,
  COL_CX,
  LINE_Y,
  MAX_HAND,
  MAX_OCULTO,
  MAX_UNITS_PER_SIDE,
  SCREEN_H,
  SCREEN_W,
  SLOT_H,
  SLOT_W,
  ZONES,
  colX,
  stkCx,
  stkStep,
} from '../src/ui/combat/grid';
import { statTone } from '../src/ui/combat/combatPreview';
import { ARENA_B4_FIXTURES } from '../src/ui/combat/fixtures';

assert.equal(SCREEN_W, 1600);
assert.equal(SCREEN_H, 900);
assert.deepEqual([...COL_CX], [530, 665, 800, 935, 1070]);
assert.equal(SLOT_W, 95);
assert.equal(SLOT_H, 132);
assert.deepEqual(BOARD, { x: 200, y: 112, w: 1200, h: 612 });
assert.equal(LINE_Y, 416);
assert.equal(ZONES.historico.w, ZONES.infoLeft.w);
assert.equal(ZONES.historico.h, ZONES.infoLeft.h);
assert.equal(ZONES.myDeck.x, 0);
assert.equal(ZONES.myDeck.y, 732);
assert.equal(ZONES.rivalDeck.x, 1400);
assert.equal(ZONES.rivalHand.w, 760);
assert.equal(MAX_UNITS_PER_SIDE, 5);
assert.equal(MAX_HAND, 9);
assert.equal(MAX_OCULTO, 3);
assert.equal(colX(2), 800 - 47);

assert.equal(stkStep(1), 0);
assert.ok(stkStep(9) <= 70);
assert.equal(stkCx(0, 1), 800);

assert.equal(statTone(4, 3), 'above');
assert.equal(statTone(2, 5), 'below');
assert.equal(statTone(3, 3), 'base');

assert.ok(ARENA_B4_FIXTURES['meu-ataque'].arrows.some((a) => a.direction === 'up'));
assert.ok(ARENA_B4_FIXTURES.preview.arrows.some((a) => a.direction === 'down'));
assert.ok(ARENA_B4_FIXTURES.pilha.pilha.length >= 5);

console.log('arena-b4-grid.test.ts OK');
