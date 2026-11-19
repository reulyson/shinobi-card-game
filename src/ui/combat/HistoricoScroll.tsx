import { ZONES } from './grid';

/**
 * Slot de montagem Part 4 — pergaminho Histórico (214×588 @ 1178,128).
 * Camada acima das faixas/linha da Pilha (sem painel escuro que as “corte”).
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
      className={`absolute ${className}`}
      style={{ left: z.x, top: z.y, width: z.w, height: z.h, zIndex: 20 }}
      aria-label="Histórico (placeholder Part 4)"
    >
      {/* Fundo transparente: as faixas do tabuleiro continuam visíveis nas laterais/atrás. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden />

      {/* Rolo superior */}
      <div
        className="absolute left-1/2 z-[2] -translate-x-1/2"
        style={{
          top: -6,
          width: z.w - 10,
          height: 18,
          borderRadius: 9,
          background: 'linear-gradient(180deg,#3f7a3a,#1f4d28)',
          boxShadow: 'inset 0 2px 0 #9be08a55, 0 2px 4px #0008',
          border: '2px solid #5a1f28',
        }}
      />
      {/* Rolo inferior */}
      <div
        className="absolute left-1/2 z-[2] -translate-x-1/2"
        style={{
          bottom: -6,
          width: z.w - 10,
          height: 18,
          borderRadius: 9,
          background: 'linear-gradient(180deg,#3f7a3a,#1f4d28)',
          boxShadow: 'inset 0 2px 0 #9be08a55, 0 2px 4px #0008',
          border: '2px solid #5a1f28',
        }}
      />

      {/* Papel washi — opaco no miolo, sem caixa escura atrás */}
      <div
        className="absolute inset-x-[6px] top-[10px] bottom-[10px] flex flex-col overflow-hidden"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0 7px, #00000008 7px 8px), linear-gradient(180deg,#f7ecd4,#efe0bc 55%,#e8d4a8)',
          borderLeft: '10px solid #0B1030',
          borderRight: '10px solid #0B1030',
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
        }}
      >
        <div className="flex items-center gap-2 border-b border-[#c4a574]/70 px-2 py-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-700" aria-hidden />
          <span className="font-display text-sm tracking-wider text-red-800">HISTÓRICO</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2 text-[11px] leading-snug text-[#1a1520]">
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
