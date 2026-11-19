import React from 'react';
import { MapPin } from 'lucide-react';
import { ARENAS, ARENA_EFFECTS_ENABLED } from '../data/arenas';
import { ArenaId } from '../types/game';

interface ArenaBannerProps {
  activeArenaId: ArenaId;
  /** Versão curta (dentro do HUD em telas baixas): só o nome; o resto fica no tooltip. */
  compact?: boolean;
}

/**
 * Faixa da arena na batalha. A arena é só cenário sorteado (sem escolha/troca pelo jogador);
 * o texto de regra só aparece se ARENA_EFFECTS_ENABLED for reativado.
 */
export const ArenaBanner: React.FC<ArenaBannerProps> = ({ activeArenaId, compact = false }) => {
  const arena = ARENAS[activeArenaId];
  const detail = ARENA_EFFECTS_ENABLED ? arena.ruleSummary : arena.subtitle;
  return (
    <div
      className={`flex items-center rounded-lg glass-panel border border-slate-700/70 min-w-0 ${
        compact ? 'gap-1.5 px-2 py-1' : 'gap-2.5 px-3 py-1.5'
      }`}
      title={`${arena.name} · ${detail} (cenário sorteado)`}
    >
      <MapPin className="w-4 h-4 shrink-0" style={{ color: arena.accentColor }} />
      <div className="flex items-center gap-2 hud-text text-xs font-semibold text-white min-w-0">
        <span className="font-display tracking-wide truncate">{arena.name}</span>
        {!compact && (
          <>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-slate-300 font-normal truncate">{detail}</span>
          </>
        )}
      </div>
    </div>
  );
};
