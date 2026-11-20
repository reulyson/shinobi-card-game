import { STK_BAND, STK_D, STK_D_COMBAT, stkCx } from './grid';
import { TabLabel } from './TabLabel';
import type { PilhaItem } from './types';

/**
 * Miniaturas LoR da Pilha. A linha de ponta a ponta fica no CombatBoard
 * (atrás do Histórico); aqui só os thumbs + selo de ordem.
 */
export function PilhaStrip({
  items,
  compact,
}: {
  items: PilhaItem[];
  /** Miniaturas 36px quando há combate ativo. */
  compact?: boolean;
}) {
  const diameter = compact ? STK_D_COMBAT : STK_D;
  const newestFirst = [...items].sort((a, b) => a.order - b.order);

  if (newestFirst.length === 0) {
    return <div className="pointer-events-none absolute inset-0" data-pilha style={{ zIndex: 12 }} />;
  }

  return (
    <div className="pointer-events-none absolute inset-0" data-pilha style={{ zIndex: 12 }}>
      {newestFirst.length > 0 && (
        <div className="absolute" style={{ left: 300, top: STK_BAND.y - 12, zIndex: 2 }}>
          <TabLabel tone="o" size={12}>
            PILHA
          </TabLabel>
        </div>
      )}

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
            data-uid={`stack-${item.uid}`}
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-full"
              style={{
                border: `${diameter >= 50 ? 3.5 : 3}px solid ${ring}`,
                boxShadow: isNewest
                  ? '0 0 0 2px #fff, 0 2px 6px #000d, 0 0 0 4px #FFE55A, 0 0 16px 5px #FFD23Fcc'
                  : '0 0 0 2px #fff, 0 2px 6px #000d',
                background: '#000',
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
                className="absolute flex items-center justify-center rounded-full font-display text-white"
                style={{
                  left: -4,
                  top: -5,
                  width: diameter >= 50 ? 22 : 15,
                  height: diameter >= 50 ? 22 : 15,
                  fontSize: diameter >= 50 ? 14 : 11,
                  lineHeight: 1,
                  background: ring,
                  border: diameter >= 50 ? '2px solid #fff' : '1.5px solid #fff',
                  boxShadow: diameter >= 50 ? '0 0 0 1.5px #111' : undefined,
                }}
              >
                {item.order}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
