import { ZONES } from './grid';

/**
 * Slot de montagem Part 4 — pergaminho Histórico (214×588 @ 1178,128).
 * Part 3 só reserva o footprint; o visual/animação ficam para Part 4.
 */
export interface HistoricoScrollProps {
  lines?: string[];
  className?: string;
}

export function HistoricoScroll({ lines = [], className = '' }: HistoricoScrollProps) {
  const z = ZONES.historico;
  return (
    <div
      data-mount="HistoricoScroll"
      data-part4-slot="historico"
      className={`absolute overflow-hidden ${className}`}
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 20 }}
      aria-label="Histórico (placeholder Part 4)"
    >
      <div
        className="flex h-full flex-col rounded-sm border-2 border-[#1e3a5f] bg-[#f3e6c8]/95"
        style={{
          boxShadow: '0 0 0 2px #0b1030, 0 8px 18px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex items-center gap-2 border-b border-[#c4a574]/80 px-3 py-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-700" aria-hidden />
          <span className="font-display text-sm tracking-wider text-red-800">HISTÓRICO</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2 text-[11px] leading-snug text-[#1a1520]">
          {lines.length === 0 ? (
            <p className="italic text-[#5c5348]">Aguardando Part 4…</p>
          ) : (
            lines.map((line, i) => (
              <div key={`${i}-${line}`} className="flex gap-1.5">
                <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-red-800/80" aria-hidden />
                <span>{line}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
