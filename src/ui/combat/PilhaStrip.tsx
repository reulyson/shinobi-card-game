import { STK_BAND, STK_CX, STK_D, STK_D_COMBAT, stkCx } from './grid';
import type { PilhaItem } from './types';

export function PilhaStrip({
  items,
  compact,
}: {
  items: PilhaItem[];
  /** Miniaturas 36px quando há combate ativo. */
  compact?: boolean;
}) {
  const diameter = compact ? STK_D_COMBAT : STK_D;
  const sorted = [...items].sort((a, b) => a.order - b.order);
  // order 1 = mais novo = direita = índice visual k=0 em stkCx
  const newestFirst = [...sorted].sort((a, b) => a.order - b.order);

  return (
    <div className="pointer-events-none absolute inset-0" data-pilha style={{ zIndex: 12 }}>
      {/* Linha de ponta a ponta do tabuleiro (205→1395), passa atrás do Histórico. */}
      <div
        className="absolute"
        style={{
          left: STK_BAND.x,
          top: STK_BAND.y - 1,
          width: STK_BAND.w,
          height: 3,
          background: 'linear-gradient(90deg,#F97316,#FFD23F,#F97316)',
          boxShadow: '0 0 10px rgba(255,210,63,0.55), 0 0 0 1px rgba(255,255,255,0.35)',
        }}
      />
      <div
        className="absolute font-display text-[12px] tracking-wider text-orange-300"
        style={{
          left: 300,
          top: STK_BAND.y - 28,
          textShadow: '0 1px 3px #000',
        }}
      >
        PILHA
        <span className="ml-2 font-sans text-[9px] font-semibold tracking-normal text-white/70">
          1 resolve primeiro
        </span>
      </div>

      {newestFirst.map((item, k) => {
        const cx = stkCx(k, newestFirst.length, diameter);
        const isNewest = item.order === 1;
        const ring = item.owner === 'player' ? '#F97316' : '#DC2626';
        return (
          <div
            key={item.uid}
            className="absolute"
            style={{
              left: cx - diameter / 2,
              top: STK_BAND.y - diameter / 2,
              width: diameter,
              height: diameter,
              zIndex: isNewest ? 3 : 1,
            }}
            title={item.name}
            data-pilha-item={item.uid}
            data-order={item.order}
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-full"
              style={{
                border: `3.5px solid ${ring}`,
                boxShadow: isNewest
                  ? `0 0 0 2px #fff, 0 0 18px 4px rgba(255,210,63,0.95)`
                  : '0 0 0 2px #fff, 0 4px 8px rgba(0,0,0,0.5)',
                background: '#0b1030',
              }}
            >
              {item.artUrl ? (
                <img src={item.artUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1a2340] font-display text-[10px] text-white">
                  {item.name.slice(0, 3)}
                </div>
              )}
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-gradient-to-b from-amber-300 to-orange-600 font-display text-[11px] text-white"
                style={{ boxShadow: '0 0 0 1px #fff' }}
              >
                {item.order}
              </span>
            </div>
            {isNewest && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-amber-300"
                style={{
                  top: -18,
                  fontSize: 16,
                  textShadow: '0 0 8px #FFD23F, 0 1px 2px #000',
                  filter: 'drop-shadow(0 0 4px #FFD23F)',
                }}
                aria-hidden
              >
                ▼
              </div>
            )}
          </div>
        );
      })}

      {newestFirst.length === 0 && (
        <div
          className="absolute"
          style={{ left: STK_CX - 40, top: STK_BAND.y - 10, width: 80, height: 1 }}
          aria-hidden
        />
      )}
    </div>
  );
}
