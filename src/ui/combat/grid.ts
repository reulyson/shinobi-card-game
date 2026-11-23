/**
 * Grade fixa 1600×900 da Arena B4 — espelho de mockup/grid.py (autoritativo).
 * Todas as posições são em px na tela lógica; FixedStage escala para o viewport.
 */

import {
  MAX_BOARD_UNITS,
  MAX_HAND_SIZE,
  MAX_OCULTO_IN_PLAY,
} from '../../engine/limits';

export const SCREEN_W = 1600;
export const SCREEN_H = 900;

/**
 * CardFace size="field" nativo (aprovado): 119×165.
 * Slot B4 do mock: 95×132 — a carta entra só com `transform: scale` uniforme.
 */
export const FIELD_FACE_W = 119;
export const FIELD_FACE_H = 165;
export const SLOT_W = 95;
export const SLOT_H = 132;
export const SLOT_SCALE = SLOT_W / FIELD_FACE_W;
export const SLOT_ZOOM = SLOT_SCALE * 0.5; // vs card6 238×330
export const COL_PITCH = 135;

/** Centros das 5 colunas: 530, 665, 800, 935, 1070. */
export const COL_CX = [530, 665, 800, 935, 1070] as const;

export function colX(i: number): number {
  return COL_CX[i]! - Math.floor(SLOT_W / 2);
}

export const BOARD = { x: 200, y: 112, w: 1200, h: 612 } as const;

/** Linha central do tabuleiro (eixo de simetria vertical dos HUDs). */
export const LINE_Y = 416;
export const ATT_Y = 270;
export const BLK_Y = 430;
export const RIVAL_BACK_Y = 128;
export const MY_BACK_Y = 576;

export const OCULTO_SLOT = { w: 50, h: 70 } as const;
export const OCULTO_RIVAL_YS = [170, 246, 322] as const;
export const OCULTO_MY_YS = [440, 516, 592] as const;
export const OCULTO_X = 1123;

export const STK_D = 58;
export const STK_D_COMBAT = 36;
export const STK_CX = 800;
export const STK_BAND = { x: 205, y: LINE_Y, w: 1190 } as const;

export function stkStep(n: number, diameter = STK_D): number {
  if (n <= 1) return 0;
  return Math.min(70, (620 - diameter) / (n - 1));
}

/** k=0 = mais nova (direita); fila centrada em x=800. */
export function stkCx(k: number, n: number, diameter = STK_D): number {
  return Math.round(STK_CX + ((n - 1 - k) - (n - 1) / 2) * stkStep(n, diameter));
}

export const ZONES = {
  rivalHand: { x: 420, y: 0, w: 760, h: 108 },
  ocultoRival: { x: 1120, y: 134, w: 56, h: 258 },
  rivalBack: { x: 208, y: 120, w: 908, h: 144 },
  combat: { x: 208, y: 264, w: 908, h: 308 },
  myBack: { x: 208, y: 572, w: 908, h: 144 },
  pilha: { x: 490, y: 384, w: 620, h: 64 },
  historico: { x: 1178, y: 128, w: 214, h: 588 },
  hand: { x: 330, y: 724, w: 940, h: 176 },
  ocultoMeu: { x: 1120, y: 440, w: 56, h: 252 },
  infoLeft: { x: 208, y: 128, w: 214, h: 588 },
  hudLeft: { x: 0, y: 283, w: 200, h: 266 },
  hudRight: { x: 1452, y: 171, w: 148, h: 490 },
  myDeck: { x: 0, y: 732, w: 200, h: 168 },
  rivalDeck: { x: 1400, y: 0, w: 200, h: 168 },
} as const;

export type ZoneRect = { x: number; y: number; w: number; h: number };

/** Aliases de layout — valores vêm de `engine/limits` (fonte única de regra). */
export const MAX_UNITS_PER_SIDE = MAX_BOARD_UNITS;
export const MAX_HAND = MAX_HAND_SIZE;
export const MAX_OCULTO = MAX_OCULTO_IN_PLAY;
