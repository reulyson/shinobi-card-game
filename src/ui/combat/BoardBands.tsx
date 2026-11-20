import { LINE_Y, STK_BAND } from './grid';

/**
 * Linha da Pilha 205→1395 (gen_b4grid) — z acima do board, atrás do papel do Histórico
 * (laterais do pergaminho transparentes). Faixas coloridas ficam DENTRO do CombatBoard.
 */
export function BoardBands() {
  return (
    <div className="pointer-events-none absolute inset-0" data-board-bands aria-hidden style={{ zIndex: 15 }}>
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
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </div>
  );
}
