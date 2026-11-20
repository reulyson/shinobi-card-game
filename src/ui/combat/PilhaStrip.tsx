import { CardFace } from '../../components/card/CardFace';
import { getCardById } from '../../data/cards';
import { FIELD_FACE_H, FIELD_FACE_W, STK_BAND, STK_D, STK_D_COMBAT, stkCx } from './grid';
import { TabLabel } from './TabLabel';
import type { PilhaItem } from './types';

/**
 * Pilha: o mesmo CardFace size="field" aprovado, só com scale uniforme
 * para caber na faixa (STK_D / STK_D_COMBAT). Sem thumb circular legado.
 */
export function PilhaStrip({
  items,
  compact,
}: {
  items: PilhaItem[];
  /** Miniaturas menores quando há combate ativo. */
  compact?: boolean;
}) {
  const footprintH = compact ? STK_D_COMBAT : STK_D;
  const scale = footprintH / FIELD_FACE_H;
  const footprintW = Math.round(FIELD_FACE_W * scale);
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
        const cx = stkCx(k, newestFirst.length, footprintW);
        const isNewest = item.order === 1;
        const ring = item.owner === 'player' ? '#F97316' : '#DC2626';
        const def = getCardById(item.cardId);
        return (
          <div
            key={item.uid}
            className="absolute"
            style={{
              left: cx - footprintW / 2,
              top: STK_BAND.y - footprintH / 2,
              width: footprintW,
              height: footprintH,
              zIndex: isNewest ? 3 : 1,
            }}
            title={item.name}
            data-pilha-item={item.uid}
            data-order={item.order}
            data-uid={`stack-${item.uid}`}
            data-arena-card="pilha"
          >
            <div
              className="relative overflow-visible"
              style={{
                width: footprintW,
                height: footprintH,
                boxShadow: isNewest
                  ? `0 0 0 2px ${ring}, 0 0 0 3px #FFE55A, 0 0 12px 3px #FFD23Fcc`
                  : `0 0 0 1.5px ${ring}, 0 2px 6px #000a`,
              }}
            >
              <div
                className="pointer-events-none origin-top-left"
                style={{
                  width: FIELD_FACE_W,
                  height: FIELD_FACE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {def ? (
                  <CardFace card={def} size="field" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[#1a2340] font-display text-[22px] text-white"
                    style={{ width: FIELD_FACE_W, height: FIELD_FACE_H }}
                  >
                    {item.name.slice(0, 3)}
                  </div>
                )}
              </div>
              <span
                className="absolute flex items-center justify-center rounded-full font-display text-white"
                style={{
                  left: -4,
                  top: -5,
                  width: footprintH >= 50 ? 18 : 14,
                  height: footprintH >= 50 ? 18 : 14,
                  fontSize: footprintH >= 50 ? 11 : 9,
                  lineHeight: 1,
                  background: ring,
                  border: '1.5px solid #fff',
                  zIndex: 4,
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
