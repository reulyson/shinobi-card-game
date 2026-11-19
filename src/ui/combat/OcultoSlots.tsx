import CardBack from '../../components/CardBack';
import {
  MAX_OCULTO,
  OCULTO_MY_YS,
  OCULTO_RIVAL_YS,
  OCULTO_SLOT,
  OCULTO_X,
} from './grid';

/** Ocultos dentro do tabuleiro, à esquerda do Histórico. Máx. 3 por lado. */
export function OcultoSlots({ rivalCount, myCount }: { rivalCount: number; myCount: number }) {
  return (
    <>
      <OcultoColumn
        side="rival"
        count={rivalCount}
        ys={OCULTO_RIVAL_YS}
        labelY={134}
      />
      <OcultoColumn
        side="player"
        count={myCount}
        ys={OCULTO_MY_YS}
        labelY={670}
      />
    </>
  );
}

function OcultoColumn({
  side,
  count,
  ys,
  labelY,
}: {
  side: 'rival' | 'player';
  count: number;
  ys: readonly number[];
  labelY: number;
}) {
  const filled = Math.max(0, Math.min(MAX_OCULTO, count));
  return (
    <div data-oculto={side}>
      <div
        className="absolute font-display text-[10px] tracking-wide text-white"
        style={{
          left: OCULTO_X - 4,
          top: labelY,
          zIndex: 14,
          textShadow: '0 1px 3px #000',
        }}
      >
        OCULTO {filled}/{MAX_OCULTO}
      </div>
      {ys.map((y, i) => (
        <div
          key={`${side}-${i}`}
          className="absolute overflow-hidden rounded-sm"
          style={{
            left: OCULTO_X,
            top: y,
            width: OCULTO_SLOT.w,
            height: OCULTO_SLOT.h,
            zIndex: 14,
            border: i < filled ? '2px solid #111' : '2px dashed rgba(255,255,255,0.45)',
            background: i < filled ? undefined : 'rgba(11,16,48,0.45)',
            boxShadow: i < filled ? '0 0 0 1px #fff' : undefined,
          }}
        >
          {i < filled ? <CardBack className="h-full w-full" /> : null}
        </div>
      ))}
    </div>
  );
}
