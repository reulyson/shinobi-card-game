import { UzumakiCardBack } from './UzumakiCardBack';
import {
  MAX_OCULTO,
  OCULTO_MY_YS,
  OCULTO_RIVAL_YS,
  OCULTO_SLOT,
  OCULTO_X,
} from './grid';

/** Ocultos dentro do tabuleiro — gen_b4grid.oc_stack. */
export function OcultoSlots({ rivalCount, myCount }: { rivalCount: number; myCount: number }) {
  return (
    <>
      <OcultoColumn side="rival" count={rivalCount} ys={OCULTO_RIVAL_YS} labelY={134} />
      <OcultoColumn side="player" count={myCount} ys={OCULTO_MY_YS} labelY={670} />
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
  const col = side === 'rival' ? '#FCA5A5' : '#FFD23F';
  const cx = OCULTO_X;

  return (
    <div data-oculto={side}>
      <div
        className="absolute text-center text-[9px] font-extrabold leading-tight tracking-wide"
        style={{
          left: cx - 6,
          top: labelY,
          width: 62,
          zIndex: 14,
          color: col,
          textShadow: '0 1px 3px #000, 0 0 2px #000',
        }}
      >
        OCULTO
        <br />
        {filled}/{MAX_OCULTO}
      </div>
      {ys.map((y, i) => (
        <div
          key={`${side}-${i}`}
          className="absolute overflow-hidden rounded-[5px]"
          style={{
            left: cx,
            top: y,
            width: OCULTO_SLOT.w,
            height: OCULTO_SLOT.h,
            zIndex: 14,
            border: i < filled ? '2px solid #111' : '2px dashed #fff9',
            background: i < filled ? undefined : '#0B103077',
            boxShadow: i < filled ? '0 0 0 1px #fff' : undefined,
            boxSizing: 'border-box',
          }}
        >
          {i < filled ? <UzumakiCardBack className="h-full w-full" /> : null}
        </div>
      ))}
    </div>
  );
}
