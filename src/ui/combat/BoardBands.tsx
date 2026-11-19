import { BOARD, LINE_Y, MY_BACK_Y, RIVAL_BACK_Y, STK_BAND, ZONES } from './grid';

/**
 * Continuidade edge-to-edge atrás do Histórico (mockup gen_b4grid):
 * - Linha da Pilha 205→1395 com contorno branco/preto (como no HTML de referência).
 * - Faixas coloridas só na faixa do Histórico (x≳1170), sob as laterais transparentes
 *   do pergaminho — sem tapar as cartas de campo (z das cartas fica abaixo só no board).
 */
export function BoardBands() {
  const histLeft = ZONES.historico.x; // 1178 — papel começa em +22
  const histRight = STK_BAND.x + STK_BAND.w; // 1395
  const stripWidth = histRight - histLeft;

  return (
    <div className="pointer-events-none absolute inset-0" data-board-bands aria-hidden style={{ zIndex: 15 }}>
      {/* Linha central full-bleed — atrás do papel, visível nas laterais (gap 22px). */}
      <div
        data-pilha-line
        className="absolute box-border"
        style={{
          left: STK_BAND.x,
          top: LINE_Y - 4,
          width: STK_BAND.w,
          height: 8,
          background: 'linear-gradient(90deg,#F97316,#FFD23F 50%,#F97316)',
          border: '2px solid #111',
          boxShadow: '0 0 0 2px #fff, 0 0 14px rgba(255,210,63,0.55)',
        }}
      />

      {/* Faixas só sob/ao lado do Histórico (cartas ficam à esquerda). */}
      <div
        data-band="rival"
        className="absolute"
        style={{
          left: histLeft,
          top: RIVAL_BACK_Y,
          width: stripWidth,
          height: 144,
          background: 'rgba(185,28,28,0.34)',
        }}
      />
      <div
        data-band="combat"
        className="absolute"
        style={{
          left: histLeft,
          top: ZONES.combat.y,
          width: stripWidth,
          height: ZONES.combat.h,
          background: 'rgba(255,210,63,0.10)',
        }}
      />
      <div
        data-band="player"
        className="absolute"
        style={{
          left: histLeft,
          top: MY_BACK_Y,
          width: stripWidth,
          height: 144,
          background: 'rgba(29,95,214,0.34)',
        }}
      />
      {/* Âncora do footprint do board (debug/layout). */}
      <div
        className="absolute"
        style={{
          left: BOARD.x,
          top: BOARD.y,
          width: BOARD.w,
          height: BOARD.h,
          background: 'transparent',
        }}
      />
    </div>
  );
}
