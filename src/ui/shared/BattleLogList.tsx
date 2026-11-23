import React from 'react';
import { Bot, Info, User } from 'lucide-react';
import type { BattleLogEntry } from '../../types/game';

const TONE_COLOR: Record<BattleLogEntry['tone'], string> = {
  evolution: 'text-amber-300',
  trap: 'text-purple-300',
  equip: 'text-cyan-300',
  combat: 'text-red-300',
  jutsu: 'text-sky-300',
  arena: 'text-emerald-300',
  info: 'text-slate-300',
};

/** Deduz quem agiu quando a entrada não informa (linguagem simples no Registro). */
export function getLogActor(entry: BattleLogEntry): 'player' | 'enemy' | 'system' {
  if (entry.actor) return entry.actor;
  const t = entry.text;
  if (/^(Você|Seu|Sua)\b/.test(t) || /\(Você\)/.test(t)) return 'player';
  if (/^(O oponente|Oponente|Rival|IA)\b/.test(t) || /\((Rival|Oponente)\)/.test(t)) return 'enemy';
  return 'system';
}

const ACTOR_META = {
  player: { icon: User, label: 'Você', cls: 'bg-emerald-900/70 border-emerald-500/60 text-emerald-200' },
  enemy: { icon: Bot, label: 'Oponente', cls: 'bg-red-900/70 border-red-500/60 text-red-200' },
  system: { icon: Info, label: 'Jogo', cls: 'bg-slate-800 border-slate-600 text-slate-300' },
} as const;

/** Registro de Combate em ordem cronológica; a última linha (ação atual) fica destacada. */
const BattleLogList: React.FC<{ logs: BattleLogEntry[] }> = ({ logs }) => (
  <ol className="space-y-1">
    {logs.map((entry, i) => {
      const actor = getLogActor(entry);
      const meta = ACTOR_META[actor];
      const Icon = meta.icon;
      const isLatest = i === logs.length - 1;
      return (
        <li
          key={entry.id}
          className={`flex items-start gap-1.5 rounded-md px-1.5 py-1 text-[11px] leading-snug ${
            isLatest ? 'bg-amber-500/10 ring-1 ring-amber-400/50' : 'border-b border-slate-800/60'
          }`}
        >
          <span
            className={`mt-px w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${meta.cls}`}
            title={meta.label}
            aria-label={meta.label}
          >
            <Icon className="w-2.5 h-2.5" />
          </span>
          <span className="min-w-0">
            <span className="font-mono-num text-slate-500 mr-1">R{entry.round}</span>
            <span className={TONE_COLOR[entry.tone]}>{entry.text}</span>
          </span>
        </li>
      );
    })}
  </ol>
);

export default BattleLogList;
