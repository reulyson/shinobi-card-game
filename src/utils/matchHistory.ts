import { ARENA_LIST } from '../data/arenas';
import { getCardById } from '../data/cards';
import { ArenaId, JutsuCategory, JutsuSpeed, MatchRecord } from '../types/game';

const STORAGE_HISTORY_KEY = 'shinobi_chronicles_match_history_v1';
const MAX_STORED_MATCHES = 50;

export function loadMatchHistory(): MatchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function recordMatchResult(record: MatchRecord): MatchRecord[] {
  const existing = loadMatchHistory();
  const updated = [record, ...existing].slice(0, MAX_STORED_MATCHES);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  }
  return updated;
}

export function clearMatchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
  } catch {
    // Ignore storage error
  }
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export interface ArenaWinRateStat {
  arenaId: ArenaId;
  name: string;
  imageUrl: string;
  accentColor: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface JutsuUsageStat {
  cardId: string;
  name: string;
  category: JutsuCategory;
  speed: JutsuSpeed;
  count: number;
}

export interface MatchHistorySummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgDurationSeconds: number;
  avgRounds: number;
  totalJutsus: number;
  totalEvolutions: number;
  arenaStats: ArenaWinRateStat[];
  bestArena: ArenaWinRateStat | null;
  topJutsus: JutsuUsageStat[];
}

export function computeMatchStats(records: MatchRecord[]): MatchHistorySummary {
  const totalMatches = records.length;
  const wins = records.filter((r) => r.result === 'victory').length;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const avgDurationSeconds =
    totalMatches > 0
      ? Math.round(records.reduce((acc, r) => acc + r.durationSeconds, 0) / totalMatches)
      : 0;
  const avgRounds =
    totalMatches > 0
      ? Math.round((records.reduce((acc, r) => acc + r.rounds, 0) / totalMatches) * 10) / 10
      : 0;

  const totalJutsus = records.reduce((acc, r) => acc + r.jutsusCastCount, 0);
  const totalEvolutions = records.reduce((acc, r) => acc + r.evolutionsCount, 0);

  const arenaStats: ArenaWinRateStat[] = ARENA_LIST.map((arena) => {
    const arenaMatches = records.filter((r) => r.finalArena === arena.id);
    const arenaWins = arenaMatches.filter((r) => r.result === 'victory').length;
    const arenaLosses = arenaMatches.length - arenaWins;
    return {
      arenaId: arena.id,
      name: arena.name,
      imageUrl: arena.imageUrl,
      accentColor: arena.accentColor,
      matches: arenaMatches.length,
      wins: arenaWins,
      losses: arenaLosses,
      winRate: arenaMatches.length > 0 ? Math.round((arenaWins / arenaMatches.length) * 100) : 0,
    };
  });

  const playedArenas = arenaStats.filter((a) => a.matches > 0);
  const bestArena =
    playedArenas.length > 0
      ? [...playedArenas].sort((a, b) => {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.matches - a.matches;
        })[0]
      : null;

  const jutsuMap = new Map<string, number>();
  for (const r of records) {
    for (const [cardId, count] of Object.entries(r.jutsuCounts || {})) {
      jutsuMap.set(cardId, (jutsuMap.get(cardId) || 0) + count);
    }
  }

  const topJutsus: JutsuUsageStat[] = Array.from(jutsuMap.entries())
    .map(([cardId, count]) => {
      const def = getCardById(cardId);
      if (!def || def.kind !== 'jutsu') return null;
      return {
        cardId,
        name: def.name,
        category: def.category,
        speed: def.speed,
        count,
      };
    })
    .filter((item): item is JutsuUsageStat => Boolean(item))
    .sort((a, b) => b.count - a.count);

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    avgDurationSeconds,
    avgRounds,
    totalJutsus,
    totalEvolutions,
    arenaStats,
    bestArena,
    topJutsus,
  };
}
