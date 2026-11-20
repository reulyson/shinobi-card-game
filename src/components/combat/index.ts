/**
 * Parte 4 — Histórico (pergaminho), moeda de turno e anel de chakra.
 *
 * APIs:
 *
 * `<HistoricoScroll entries open progress? unrollMs? />`
 *   - 214×588; `entries: (string | BattleLogEntry)[]`
 *   - `open` dispara unroll ao iniciar a batalha; respeita reduced-motion
 *
 * `<TurnCoin ref side confirmLabel paused resetKey onConfirm onTimeout />`
 *   - Timer 1 min sem números; poof na troca; `ref.pause/resume/reset`
 *
 * `<ChakraRing player rival>{coin}</ChakraRing>`
 *   - Opção B: arcos vermelho/azul + losangos de reserva no arco externo
 *
 * `<TurnChakraHud>` — composição pronta (anel + moeda + botão) para a coluna direita.
 */
export { HistoricoScroll, type HistoricoScrollProps, type HistoricoLine } from './HistoricoScroll';
export {
  TurnCoin,
  TurnCoinButton,
  type TurnCoinProps,
  type TurnCoinHandle,
  type TurnCoinPreview,
  type TurnCoinVisualState,
  type TurnSide,
  type ConfirmLabel,
} from './TurnCoin';
export {
  ChakraRing,
  type ChakraRingProps,
  type ChakraSideStats,
  type ChakraDotState,
} from './ChakraRing';
export { TurnChakraHud, type TurnChakraHudProps } from './TurnChakraHud';
export { TIMER_FRAMES, getTimerFrame, type TimerFrameSpec } from './timerFrames';
