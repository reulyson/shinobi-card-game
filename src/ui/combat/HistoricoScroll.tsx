import { ZONES } from './grid';

/**
 * Slot Part 4 — pergaminho Histórico (214×588 @ 1178,128).
 * Espelha gen_perg.scroll: papel inset 22px em cada lado (W-44) para as
 * faixas/linha da Pilha (205→1395) aparecerem nas laterais, como no mockup.
 */
export interface HistoricoScrollProps {
  lines?: string[];
  className?: string;
}

export function HistoricoScroll({ lines = [], className = '' }: HistoricoScrollProps) {
  const z = ZONES.historico;
  // gen_perg: paper left=22, width=W-44 → gap 22px cada lado.
  const sideGap = 22;
  const paperW = z.w - sideGap * 2;

  return (
    <div
      data-mount="HistoricoScroll"
      data-part4-slot="historico"
      className={`absolute ${className}`}
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 20 }}
      aria-label="Histórico (placeholder Part 4)"
    >
      {/* Rolo superior — largura total (caps passam do papel). */}
      <div
        className="absolute left-0 right-0 z-[2]"
        style={{
          top: -2,
          height: 22,
          background: 'linear-gradient(180deg,#1f4a3e 0%,#3f8070 22%,#2f6254 55%,#173a30 100%)',
          boxShadow: '0 5px 8px #000b, inset 0 -2px 0 #0006',
        }}
      />
      {/* Caps do rolo */}
      {[0, z.w - 22].map((cx) => (
        <div
          key={cx}
          className="absolute z-[3]"
          style={{
            left: cx,
            top: -6,
            width: 22,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 38%,#f3b6b0 0%,#d6615f 45%,#8f2a2c 100%)',
            border: '2px solid #4a1214',
            boxShadow: '0 3px 5px #000a',
            boxSizing: 'border-box',
          }}
        />
      ))}

      {/* Rolo inferior */}
      <div
        className="absolute left-0 right-0 z-[2]"
        style={{
          bottom: -2,
          height: 22,
          background: 'linear-gradient(180deg,#1f4a3e 0%,#3f8070 22%,#2f6254 55%,#173a30 100%)',
          boxShadow: '0 5px 8px #000b, inset 0 -2px 0 #0006',
        }}
      />
      {[0, z.w - 22].map((cx) => (
        <div
          key={`b-${cx}`}
          className="absolute z-[3]"
          style={{
            left: cx,
            bottom: -6,
            width: 22,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 38%,#f3b6b0 0%,#d6615f 45%,#8f2a2c 100%)',
            border: '2px solid #4a1214',
            boxShadow: '0 3px 5px #000a',
            boxSizing: 'border-box',
          }}
        />
      ))}

      {/* Papel washi — só o miolo opaco; laterais do footprint deixam ver faixas/linha. */}
      <div
        className="absolute top-[16px] bottom-[16px] flex flex-col overflow-hidden"
        style={{
          left: sideGap,
          width: paperW,
          background:
            'repeating-linear-gradient(90deg, transparent 0 3px, #8a6a3a10 3px 4px), repeating-linear-gradient(0deg, transparent 0 5px, #8a6a3a0c 5px 6px), linear-gradient(90deg,#d8c595,#f6ebd0 14%,#faf2dc 50%,#f1e4c3 86%,#d4bf90)',
          boxShadow: '0 6px 10px #000a, inset 0 12px 10px #00000035',
        }}
      >
        {/* Filetes laterais azul-escuro (como gen_perg) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 top-0 w-[9px]"
          style={{ background: 'linear-gradient(90deg,#14204a 7px,#e9d9ae 7px)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-[9px]"
          style={{ background: 'linear-gradient(270deg,#14204a 7px,#e9d9ae 7px)' }}
          aria-hidden
        />

        <div className="relative z-[1] flex items-end justify-between border-b-[3px] border-[#14204a] px-4 pb-1 pt-3">
          <span
            className="font-display text-[22px] leading-none tracking-wide text-[#17110c]"
            style={{ fontFamily: 'Bangers, Impact, sans-serif' }}
          >
            HISTÓRICO
          </span>
          <span
            className="mb-0.5 inline-block h-[18px] w-[18px] shrink-0 bg-[#B91C1C]"
            style={{ border: '2px solid #6b0f12', transform: 'rotate(-6deg)' }}
            aria-hidden
          />
        </div>
        <div className="relative z-[1] ml-4 mt-1 h-0.5 w-[52px] bg-[#B91C1C]" aria-hidden />
        <div className="relative z-[1] min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2 text-[12px] font-semibold leading-snug text-[#24160c]">
          {lines.length === 0 ? (
            <p className="italic text-[#5c5348]">Aguardando Part 4…</p>
          ) : (
            lines.map((line, i) => (
              <div
                key={`${i}-${line}`}
                className="flex gap-1.5 border-b border-dashed border-[#6a4b2455] pb-1.5"
              >
                <span className="mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#9B1C1C]" aria-hidden />
                <span>{line}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
