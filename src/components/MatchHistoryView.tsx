import React, { useMemo, useState } from 'react';
import {
  Clock,
  Flame,
  Hourglass,
  MapPin,
  Play,
  Skull,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
  BarChart3,
} from 'lucide-react';
import { ARENAS } from '../data/arenas';
import { getCardById } from '../data/cards';
import { JutsuSpeed, MatchRecord } from '../types/game';
import {
  clearMatchHistory,
  computeMatchStats,
  formatDuration,
  loadMatchHistory,
} from '../utils/matchHistory';

interface MatchHistoryViewProps {
  onStartMatch: () => void;
}

const SPEED_ICON: Record<JutsuSpeed, React.ReactNode> = {
  Rapida: <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
  Lenta: <Hourglass className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  Imediata: <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  Focada: <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />,
  Oculta: <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({ onStartMatch }) => {
  const [records, setRecords] = useState<MatchRecord[]>(() => loadMatchHistory());
  const [confirmClear, setConfirmClear] = useState(false);

  const summary = useMemo(() => computeMatchStats(records), [records]);
  const maxJutsuCount = summary.topJutsus[0]?.count || 1;
  const topJutsu = summary.topJutsus[0];

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearMatchHistory();
    setRecords([]);
    setConfirmClear(false);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Histórico de Batalhas e Estatísticas</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe a duração dos últimos duelos, seus jutsus mais conjurados e a taxa de vitória por arena dinâmica.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              onBlur={() => setConfirmClear(false)}
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                confirmClear
                  ? 'bg-red-950/80 border-red-400 text-red-200'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500/60 hover:text-red-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmClear ? 'Confirmar Limpeza?' : 'Limpar Histórico'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartMatch}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Nova Batalha</span>
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111927] p-10 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-display font-bold text-white">
              Nenhuma batalha registrada ainda
            </h2>
            <p className="text-sm text-slate-400">
              Conclua um duelo na arena para registrar automaticamente duração, jutsus conjurados, promoções e desempenho por arena.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartMatch}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Primeira Batalha</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top KPI Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#111927] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taxa de Vitória Geral</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-num text-2xl font-bold text-white">
                  {summary.winRate}%
                </span>
                <span className="font-mono-num text-xs text-slate-400">
                  {summary.wins}V · {summary.losses}D ({summary.totalMatches} jogos)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${summary.winRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111927] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Duração Média</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-num text-2xl font-bold text-white">
                  {formatDuration(summary.avgDurationSeconds)}
                </span>
                <span className="font-mono-num text-xs text-slate-400">
                  ~{summary.avgRounds} rodadas/jogo
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono-num">
                {summary.totalEvolutions} promoções totais registradas
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111927] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Jutsu Mais Usado</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              {topJutsu ? (
                <>
                  <div className="text-lg font-display font-bold text-white truncate">
                    {topJutsu.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-num">
                    {topJutsu.count} conjurações · {summary.totalJutsus} jutsus no total
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">Nenhum jutsu registrado</div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111927] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Melhor Arena</span>
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              {summary.bestArena ? (
                <>
                  <div className="text-lg font-display font-bold text-white truncate">
                    {summary.bestArena.name}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono-num">
                    {summary.bestArena.winRate}% de vitórias ({summary.bestArena.wins}/
                    {summary.bestArena.matches})
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">—</div>
              )}
            </div>
          </section>

          {/* 2-Column Analytical Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Win Rate per Arena */}
            <section className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#111927] p-5 flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-display font-bold text-white">
                  Taxa de Vitória por Arena
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Desempenho contabilizado pela arena ativa no desfecho de cada partida.
                </p>
              </div>

              <div className="space-y-3">
                {summary.arenaStats.map((arena) => (
                  <div
                    key={arena.arenaId}
                    className="rounded-lg border border-slate-800/90 bg-slate-900/60 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={arena.imageUrl}
                          alt={arena.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-md object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">{arena.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono-num">
                            {arena.matches === 0
                              ? 'Sem partidas concluídas'
                              : `${arena.wins} vitória(s) · ${arena.losses} derrota(s)`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono-num text-base font-bold ${
                            arena.matches === 0
                              ? 'text-slate-500'
                              : arena.winRate >= 50
                                ? 'text-emerald-300'
                                : 'text-red-300'
                          }`}
                        >
                          {arena.matches === 0 ? '—' : `${arena.winRate}%`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono-num">
                          {arena.matches} {arena.matches === 1 ? 'duelo' : 'duelos'}
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${arena.matches === 0 ? 0 : arena.winRate}%`,
                          backgroundColor: arena.accentColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Most Used Jutsus */}
            <section className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#111927] p-5 flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-display font-bold text-white">
                  Jutsus Mais Usados
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Técnicas mais conjuradas por você ao longo das últimas batalhas.
                </p>
              </div>

              {summary.topJutsus.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500 py-8">
                  Nenhum jutsu foi conjurado nas partidas registradas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {summary.topJutsus.slice(0, 7).map((jutsu, idx) => {
                    const pct = Math.max(8, Math.round((jutsu.count / maxJutsuCount) * 100));
                    return (
                      <div
                        key={jutsu.cardId}
                        className="rounded-lg border border-slate-800/90 bg-slate-900/60 p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono-num text-[11px] font-bold text-slate-500 w-4">
                              #{idx + 1}
                            </span>
                            {SPEED_ICON[jutsu.speed]}
                            <span className="font-bold text-white truncate">{jutsu.name}</span>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              · {jutsu.category}
                            </span>
                          </div>
                          <span className="font-mono-num font-bold text-amber-300 shrink-0">
                            {jutsu.count}x
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Recent Battles List */}
          <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-display font-bold text-white">
                  Últimas Batalhas ({records.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro detalhado das partidas mais recentes (máx. 50).
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {records.map((match) => {
                const isWin = match.result === 'victory';
                const topMatchJutsuEntry = Object.entries(match.jutsuCounts || {}).sort(
                  (a, b) => b[1] - a[1]
                )[0];
                const topMatchJutsuName = topMatchJutsuEntry
                  ? getCardById(topMatchJutsuEntry[0])?.name
                  : undefined;
                const arenaChanged = match.initialArena !== match.finalArena;

                return (
                  <div
                    key={match.id}
                    className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                          isWin
                            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                            : 'bg-red-950/80 border-red-500/60 text-red-300'
                        }`}
                      >
                        {isWin ? <Trophy className="w-4 h-4" /> : <Skull className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-bold ${isWin ? 'text-emerald-300' : 'text-red-300'}`}
                          >
                            {isWin ? 'Vitória' : 'Derrota'}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-white font-semibold">
                            {arenaChanged
                              ? `${ARENAS[match.initialArena].name} → ${ARENAS[match.finalArena].name}`
                              : ARENAS[match.finalArena].name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono-num">{formatDateTime(match.playedAt)}</span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono-num">
                            Vitalidade: Você {match.playerHpRemaining} × Rival {match.enemyHpRemaining}
                          </span>
                          {topMatchJutsuName && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-sky-300">
                                Destaque: {topMatchJutsuName} ({topMatchJutsuEntry[1]}x)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono-num text-slate-300 shrink-0 pl-12 md:pl-0">
                      <div className="flex items-center gap-1" title="Duração da partida">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>{formatDuration(match.durationSeconds)}</span>
                      </div>
                      <div className="text-slate-400">{match.rounds} rod.</div>
                      <div className="text-amber-300">{match.evolutionsCount} promo.</div>
                      <div className="text-sky-300">{match.jutsusCastCount} jutsus</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
