import React from 'react';
import { Lock } from 'lucide-react';
import type { NinjaCardDef } from '../../types/game';
import { getNinjaMaxRank } from '../../data/cards';

const TIERS: { rank: 1 | 2 | 3; label: string }[] = [
  { rank: 1, label: 'Gennin' },
  { rank: 2, label: 'Chuunin' },
  { rank: 3, label: 'Jounnin' },
];

interface NinjaRankStripProps {
  card: NinjaCardDef;
  rank: 1 | 2 | 3;
  onRankChange: (rank: 1 | 2 | 3) => void;
  /** false = só patentes jogáveis; true = permite ver arte/stats das 3 fichas */
  previewAllRanks?: boolean;
  className?: string;
}

export const NinjaRankStrip: React.FC<NinjaRankStripProps> = ({
  card,
  rank,
  onRankChange,
  previewAllRanks = false,
  className = '',
}) => {
  const maxRank = getNinjaMaxRank(card);

  return (
    <div
      className={`grid grid-cols-3 gap-1 ${className}`}
      role="group"
      aria-label={`Patentes de ${card.name}`}
    >
      {TIERS.map((tier) => {
        const playable = tier.rank <= maxRank;
        const locked = !playable;
        const isActive = rank === tier.rank;
        const canSelect = playable || previewAllRanks;

        return (
          <button
            key={tier.rank}
            type="button"
            disabled={!canSelect}
            onClick={(e) => {
              e.stopPropagation();
              if (canSelect) onRankChange(tier.rank);
            }}
            title={
              locked
                ? previewAllRanks
                  ? `${tier.label} — só prévia (patente máx. em duelo: ${maxRank === 1 ? 'Gennin' : maxRank === 2 ? 'Chuunin' : 'Jounnin'})`
                  : `${tier.label} não disponível nesta ficha`
                : tier.label
            }
            className={`py-1 px-1 rounded text-[9px] font-bold tracking-wide border transition-colors flex items-center justify-center gap-0.5 ${
              !canSelect
                ? 'opacity-35 cursor-not-allowed border-slate-800 text-slate-600'
                : isActive
                  ? tier.rank === 3
                    ? 'bg-orange-950/70 border-orange-400/80 text-orange-100'
                    : tier.rank === 2
                      ? 'bg-amber-950/60 border-amber-400/70 text-amber-100'
                      : 'bg-sky-950/60 border-sky-400/70 text-sky-100'
                  : locked
                    ? 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {locked && previewAllRanks && <Lock className="w-2.5 h-2.5 shrink-0 opacity-80" aria-hidden />}
            <span className="truncate">{tier.label}</span>
          </button>
        );
      })}
    </div>
  );
}