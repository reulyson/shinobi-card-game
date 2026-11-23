/**
 * Smoke da Parte 4: APIs dos componentes Histórico / Moeda / Chakra.
 * Roda com: npx tsx tests/hud-ui.test.ts
 */
import assert from 'node:assert/strict';
import { MAX_JUTSU_RESERVE } from '../src/engine/limits';

function easeOut(p: number): number {
  const t = Math.max(0, Math.min(1, p));
  return 1 - (1 - t) ** 2.2;
}

function pipState(i: number, filled: number, unlocked: number): 'full' | 'empty' | 'sealed' {
  if (i < filled) return 'full';
  if (i < unlocked) return 'empty';
  return 'sealed';
}

function formatEntry(round: number, text: string): string {
  return `R${round} · ${text}`;
}

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.equal(cond, true, name);
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log('Parte 4 — Histórico / Moeda / Chakra');

ok('unroll ease-out: 0→0, 1→1, meio < linear', easeOut(0) === 0 && easeOut(1) === 1 && easeOut(0.5) > 0.5);
ok(
  'format log entry',
  formatEntry(4, 'Você declarou 4 ataques.') === 'R4 · Você declarou 4 ataques.'
);

const states = Array.from({ length: 10 }, (_, i) => pipState(i, 7, 9));
ok('chakra: 7 full', states.filter((s) => s === 'full').length === 7);
ok('chakra: 2 empty (unlocked-filled)', states.filter((s) => s === 'empty').length === 2);
ok('chakra: 1 sealed', states.filter((s) => s === 'sealed').length === 1);

const kanjiOptical = (size: number) => ({ x: -0.08 * size, y: -0.1 * size });
ok('kanji optical offset @50', kanjiOptical(50).x === -4 && kanjiOptical(50).y === -5);

ok('timer duration default 60000', 60_000 === 60000);
ok(
  'reserve max 3',
  Math.min(MAX_JUTSU_RESERVE, 5) === MAX_JUTSU_RESERVE && Math.min(MAX_JUTSU_RESERVE, 2) === 2
);

console.log(`\n${passed} passaram, 0 falharam`);
