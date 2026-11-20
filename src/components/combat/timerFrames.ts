import type { TurnSide } from './TurnCoin';

/**
 * Keyframes de `mockup/gen_timer.py` FR — mesma ordem de timer-00..13.
 * level = fração de laranja (baixo→cima); poof = progresso 0..1 da fumacinha.
 */
export interface TimerFrameSpec {
  level: number;
  /** Lado do líquido / ciclo (me→player, rv→rival). */
  side: TurnSide;
  /** Símbolo na moeda (gen_timer força kanji/swirl independente do nível). */
  symbol: 'kanji' | 'swirl';
  /** Botão: true = CONFIRMAR (laranja); false = AGUARDE O RIVAL (escuro). */
  buttonActive: boolean;
  poof: number | null;
}

/** Espelho de gen_timer.FR (label K/A → buttonActive, symbol kanji/swirl). */
export const TIMER_FRAMES: readonly TimerFrameSpec[] = [
  { level: 1, side: 'player', symbol: 'kanji', buttonActive: true, poof: null },
  { level: 0.66, side: 'player', symbol: 'kanji', buttonActive: true, poof: null },
  { level: 0.33, side: 'player', symbol: 'kanji', buttonActive: true, poof: null },
  { level: 0.06, side: 'player', symbol: 'kanji', buttonActive: true, poof: null },
  { level: 0, side: 'player', symbol: 'kanji', buttonActive: true, poof: 0.25 },
  { level: 0, side: 'player', symbol: 'swirl', buttonActive: false, poof: 0.55 },
  { level: 0, side: 'player', symbol: 'swirl', buttonActive: false, poof: 0.95 },
  { level: 0, side: 'rival', symbol: 'swirl', buttonActive: false, poof: null },
  { level: 0.33, side: 'rival', symbol: 'swirl', buttonActive: false, poof: null },
  { level: 0.66, side: 'rival', symbol: 'swirl', buttonActive: false, poof: null },
  { level: 1, side: 'rival', symbol: 'swirl', buttonActive: false, poof: null },
  { level: 1, side: 'rival', symbol: 'swirl', buttonActive: false, poof: 0.25 },
  { level: 1, side: 'rival', symbol: 'kanji', buttonActive: true, poof: 0.55 },
  { level: 1, side: 'rival', symbol: 'kanji', buttonActive: true, poof: 0.95 },
] as const;

export function getTimerFrame(index: number): TimerFrameSpec | null {
  if (!Number.isFinite(index) || index < 0 || index >= TIMER_FRAMES.length) return null;
  return TIMER_FRAMES[index]!;
}
