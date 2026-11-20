import { assetUrl } from './assetUrl';
import type { ArenaB4DemoId, ArenaB4Model, ArenaCardRef, FieldCardPreview } from './types';

function pv(
  power: number,
  vitality: number,
  basePower: number,
  baseVitality: number,
  chips?: string[],
  dying?: boolean
): FieldCardPreview {
  return {
    power,
    vitality,
    basePower,
    baseVitality,
    keywordChips: chips,
    dying: dying ?? vitality <= 0,
  };
}

const ART: Record<string, string> = {
  naruto: assetUrl('art/cards/naruto.jpg'),
  sasuke: assetUrl('art/cards/sasuke.jpg'),
  zabuza: assetUrl('art/cards/zabuza.jpg'),
  anbu: assetUrl('art/cards/anbu.jpg'),
  clone: assetUrl('art/cards/clone.jpg'),
  katon: assetUrl('art/cards/katon.jpg'),
  fuma: assetUrl('art/cards/fuma.jpg'),
  chidori: assetUrl('art/cards/chidori.jpg'),
};
function art(id: string): string | undefined {
  return ART[id];
}

function unit(
  partial: Omit<ArenaCardRef, 'preview'> & { preview?: FieldCardPreview }
): ArenaCardRef {
  return partial;
}

const HAND = [
  { cardId: 'naruto', name: 'Naruto', cost: 3, artUrl: art('naruto') },
  { cardId: 'sasuke', name: 'Sasuke', cost: 3, artUrl: art('sasuke') },
  { cardId: 'katon', name: 'Katon', cost: 2, artUrl: art('katon') },
  { cardId: 'fuma', name: 'Fūma Shuriken', cost: 2, artUrl: art('fuma') },
  { cardId: 'anbu', name: 'Anbu', cost: 2, artUrl: art('anbu') },
];

/** Fixtures visuais Part 3 — só layout/prévia; textos genéricos, sem inventar regras. */
export const ARENA_B4_FIXTURES: Record<ArenaB4DemoId, ArenaB4Model> = {
  // Espelha mockup S8 (meu ataque): 3 mortes — 2 bloqueadores rivais + 1 atacante meu.
  'meu-ataque': {
    round: 4,
    rivalVitality: { current: 18, predicted: 15 },
    myVitality: { current: 20 },
    rivalDeck: { remaining: 24, total: 30 },
    myDeck: { remaining: 21, total: 30 },
    rivalHandCount: 5,
    myHand: HAND,
    rivalBackrow: [],
    myBackrow: [],
    rivalCombat: [
      unit({
        uid: 'e1',
        cardId: 'anbu',
        artUrl: art('anbu'),
        name: 'Anbu',
        owner: 'enemy',
        column: 0,
        cost: 2,
        preview: pv(2, 0, 2, 2, undefined, true),
      }),
      unit({
        uid: 'e2',
        cardId: 'clone',
        artUrl: art('clone'),
        name: 'Clone',
        owner: 'enemy',
        column: 1,
        cost: 1,
        preview: pv(1, 0, 1, 1, ['CLONE'], true),
      }),
      unit({
        uid: 'e3',
        cardId: 'zabuza',
        artUrl: art('zabuza'),
        name: 'Zabuza',
        owner: 'enemy',
        column: 2,
        cost: 5,
        preview: pv(5, 3, 5, 5, ['GOLPE VELOZ']),
      }),
    ],
    myCombat: [
      unit({
        uid: 'p1',
        cardId: 'sasuke',
        artUrl: art('sasuke'),
        name: 'Sasuke',
        owner: 'player',
        column: 0,
        cost: 3,
        preview: pv(3, 2, 3, 2, ['GOLPE VELOZ']),
      }),
      unit({
        uid: 'p2',
        cardId: 'naruto',
        artUrl: art('naruto'),
        name: 'Naruto',
        owner: 'player',
        column: 1,
        cost: 3,
        preview: pv(4, 1, 3, 3, ['PERFURANTE +1']),
      }),
      unit({
        uid: 'p3',
        cardId: 'anbu',
        artUrl: art('anbu'),
        name: 'Anbu',
        owner: 'player',
        column: 2,
        cost: 2,
        preview: pv(2, 0, 2, 2, undefined, true),
      }),
      unit({
        uid: 'p4',
        cardId: 'clone',
        artUrl: art('clone'),
        name: 'Clone',
        owner: 'player',
        column: 3,
        cost: 1,
        preview: pv(1, 1, 1, 1, ['CLONE']),
      }),
    ],
    rivalOculto: 2,
    myOculto: 1,
    pilha: [],
    arrows: [
      { id: 'a0', fromCol: 0, direction: 'up', who: 'player', blocked: true },
      { id: 'a1', fromCol: 1, direction: 'up', who: 'player', blocked: true },
      { id: 'a2', fromCol: 2, direction: 'up', who: 'player', blocked: true },
      { id: 'a3', fromCol: 3, direction: 'up', who: 'player', blocked: false, unblockedDamage: 2 },
    ],
    previaLabel: 'PRÉVIA - NADA FOI APLICADO',
    myTurn: true,
    mainActionLabel: 'CONFIRMAR ATAQUE',
    rivalChakra: { current: 6, max: 8, reserve: 1 },
    myChakra: { current: 7, max: 9, reserve: 2 },
    historicoLines: [
      'R4 · Você declarou 4 ataques.',
      'R4 · Rival posicionou 3 bloqueios.',
      'Prévia: 3 mortes, 2 sobreviventes, 3 de dano à Vitalidade rival.',
      'Confirme para resolver pela ordem 1→4.',
    ],
    combatBusy: true,
  },

  preview: {
    round: 4,
    rivalVitality: { current: 18 },
    myVitality: { current: 20, predicted: 17 },
    rivalDeck: { remaining: 24, total: 30 },
    myDeck: { remaining: 21, total: 30 },
    rivalHandCount: 5,
    myHand: HAND,
    rivalBackrow: [],
    myBackrow: [],
    rivalCombat: [
      unit({
        uid: 'e1',
        cardId: 'zabuza',
        artUrl: art('zabuza'),
        name: 'Zabuza',
        owner: 'enemy',
        column: 0,
        cost: 5,
        preview: pv(5, 3, 5, 5, ['GOLPE VELOZ']),
      }),
      unit({
        uid: 'e2',
        cardId: 'naruto',
        artUrl: art('naruto'),
        name: 'Naruto',
        owner: 'enemy',
        column: 1,
        cost: 3,
        preview: pv(4, 1, 3, 3, ['PERFURANTE +1']),
      }),
      unit({
        uid: 'e3',
        cardId: 'clone',
        artUrl: art('clone'),
        name: 'Clone',
        owner: 'enemy',
        column: 2,
        cost: 1,
        preview: pv(1, 0, 1, 1, undefined, true),
      }),
      unit({
        uid: 'e4',
        cardId: 'anbu',
        artUrl: art('anbu'),
        name: 'Anbu',
        owner: 'enemy',
        column: 3,
        cost: 2,
        preview: pv(2, 2, 2, 2),
      }),
    ],
    myCombat: [
      unit({
        uid: 'p1',
        cardId: 'anbu',
        artUrl: art('anbu'),
        name: 'Anbu',
        owner: 'player',
        column: 0,
        cost: 2,
        preview: pv(2, 0, 2, 2, undefined, true),
      }),
      unit({
        uid: 'p2',
        cardId: 'clone',
        artUrl: art('clone'),
        name: 'Clone',
        owner: 'player',
        column: 1,
        cost: 1,
        preview: pv(1, 0, 1, 1, undefined, true),
      }),
      unit({
        uid: 'p3',
        cardId: 'sasuke',
        artUrl: art('sasuke'),
        name: 'Sasuke',
        owner: 'player',
        column: 2,
        cost: 3,
        preview: pv(3, 0, 3, 2, undefined, true),
      }),
    ],
    rivalOculto: 2,
    myOculto: 1,
    pilha: [
      { uid: 's1', cardId: 'katon', name: 'Katon', owner: 'player', order: 1, artUrl: art('katon') },
    ],
    arrows: [
      { id: 'a0', fromCol: 0, direction: 'down', who: 'enemy', blocked: true },
      { id: 'a1', fromCol: 1, direction: 'down', who: 'enemy', blocked: true },
      { id: 'a2', fromCol: 2, direction: 'down', who: 'enemy', blocked: true },
      { id: 'a3', fromCol: 3, direction: 'down', who: 'enemy', blocked: false, unblockedDamage: 2 },
    ],
    previaLabel: 'PRÉVIA - NADA FOI APLICADO',
    myTurn: true,
    mainActionLabel: 'CONFIRMAR BLOQUEIOS',
    rivalChakra: { current: 6, max: 8, reserve: 1 },
    myChakra: { current: 7, max: 9, reserve: 2 },
    historicoLines: [
      'R3 · Rival declarou 4 ataques.',
      'R3 · Você posicionou 3 bloqueios.',
      'Prévia: 3 mortes, 1 sobrevivente, 3 de dano à Vitalidade.',
      'Confirme para resolver pela ordem 1→4.',
    ],
    combatBusy: true,
  },

  pilha: {
    round: 6,
    rivalVitality: { current: 18 },
    myVitality: { current: 20, predicted: 17 },
    rivalDeck: { remaining: 24, total: 30 },
    myDeck: { remaining: 21, total: 30 },
    rivalHandCount: 5,
    myHand: HAND,
    rivalBackrow: [],
    myBackrow: [
      unit({
        uid: 'mb1',
        cardId: 'sasuke',
        artUrl: art('sasuke'),
        name: 'Sasuke',
        owner: 'player',
        column: 1,
        cost: 3,
        preview: pv(3, 4, 3, 2),
      }),
    ],
    rivalCombat: [
      unit({
        uid: 'e1',
        cardId: 'zabuza',
        artUrl: art('zabuza'),
        name: 'Zabuza',
        owner: 'enemy',
        column: 0,
        cost: 5,
        preview: pv(5, 2, 5, 5),
      }),
      unit({
        uid: 'e2',
        cardId: 'anbu',
        artUrl: art('anbu'),
        name: 'Anbu',
        owner: 'enemy',
        column: 2,
        cost: 2,
        preview: pv(2, 1, 2, 2),
      }),
    ],
    myCombat: [
      unit({
        uid: 'p1',
        cardId: 'naruto',
        artUrl: art('naruto'),
        name: 'Naruto',
        owner: 'player',
        column: 0,
        cost: 3,
        preview: pv(4, 3, 3, 3, ['PERFURANTE +1']),
      }),
      unit({
        uid: 'p2',
        cardId: 'clone',
        artUrl: art('clone'),
        name: 'Clone',
        owner: 'player',
        column: 2,
        cost: 1,
        preview: pv(1, 1, 1, 1),
      }),
    ],
    rivalOculto: 2,
    myOculto: 1,
    pilha: [
      { uid: 's9', cardId: 'chidori', name: 'Chidori', owner: 'enemy', order: 9, artUrl: art('chidori') },
      { uid: 's8', cardId: 'fuma', name: 'Fūma', owner: 'player', order: 8, artUrl: art('fuma') },
      { uid: 's7', cardId: 'katon', name: 'Katon', owner: 'enemy', order: 7, artUrl: art('katon') },
      { uid: 's6', cardId: 'chidori', name: 'Chidori', owner: 'player', order: 6, artUrl: art('chidori') },
      { uid: 's5', cardId: 'fuma', name: 'Fūma', owner: 'enemy', order: 5, artUrl: art('fuma') },
      { uid: 's4', cardId: 'katon', name: 'Katon', owner: 'player', order: 4, artUrl: art('katon') },
      { uid: 's3', cardId: 'chidori', name: 'Chidori', owner: 'enemy', order: 3, artUrl: art('chidori') },
      { uid: 's2', cardId: 'fuma', name: 'Fūma', owner: 'player', order: 2, artUrl: art('fuma') },
      { uid: 's1', cardId: 'katon', name: 'Katon', owner: 'enemy', order: 1, artUrl: art('katon') },
    ],
    arrows: [
      { id: 'a0', fromCol: 0, direction: 'up', who: 'player', blocked: true },
    ],
    previaLabel: 'PRÉVIA - NADA FOI APLICADO',
    myTurn: false,
    mainActionLabel: 'AGUARDE O RIVAL',
    rivalChakra: { current: 6, max: 8, reserve: 1 },
    myChakra: { current: 7, max: 9, reserve: 2 },
    historicoLines: [
      'R6 · Rival atacou com 5.',
      'R6 · Você bloqueou 4.',
      'R6 · Pilha com 9 itens (centrada, miniaturas 36px).',
    ],
    combatBusy: true,
  },
};

export function parseDemoId(raw: string | null | undefined): ArenaB4DemoId | null {
  if (raw === 'meu-ataque' || raw === 'preview' || raw === 'pilha') return raw;
  return null;
}
