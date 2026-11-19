import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Shield,
  Swords,
  Sparkles,
  RotateCcw,
  EyeOff,
  ScrollText,
  Trophy,
  Skull,
  X,
  Layers,
  Sun,
  Moon,
  Megaphone,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
  ScrollText as LogIcon,
  Eye,
} from 'lucide-react';
import { ARENAS, ARENA_LIST, ARENA_EFFECTS_ENABLED, DEFAULT_ARENA_ID, activeArenaRule } from '../data/arenas';
import { DECK_PRESETS, getCardById, getNinjaDuplicateCardId, JUTSU_CARDS, TOKEN_CARDS } from '../data/cards';
import { applyUnitEntryEffect } from '../engine/unitEffects';
import {
  ArenaId,
  BattleLogEntry,
  BoardUnit,
  CardDef,
  CombatPair,
  CombatVisualFX,
  EquipmentCardDef,
  JutsuCardDef,
  NinjaCardDef,
  PlayerState,
  StackEntry,
  TrapCardDef,
  SPEED_DISPLAY_NAME,
  TurnPhase,
  UnitCardDef,
} from '../types/game';
import {
  applyDamageToUnit,
  applyGloomToUnit,
  attachEquipmentToUnit,
  canBlockAttacker,
  canPayCard,
  canUnitAttack,
  checkEnemyTrapsOnEvent,
  chooseBestTrap,
  createBoardUnit,
  createInitialPlayerState,
  drawCards,
  evolveUnitIfReady,
  getEffectiveCost,
  getUnplayableReason,
  getMatchingTraps,
  getUnitHealth,
  getUnitPower,
  healUnit,
  nextUid,
  normalizeNinjaHand,
  onNinjaEnteredBoard,
  applySavedRank,
  getSavedRank,
  processBoardDeaths,
  resolveCombatPairs,
  resolveJutsuEffect,
  resolveTrapEffect,
  spendManaForCard,
  summonUnitByEffect,
} from '../engine/battleEngine';
import { resetRecurringRoundState, runEndOfRoundTriggers, runRecurringTrigger } from '../engine/recurringAbilities';
import {
  FIRST_CARD_BONUS_IDS,
  LATER_CARD_BONUS_IDS,
  applyContinuousKeywordRules,
  applyRoundStartKeywords,
  isOutOfCombat,
} from '../engine/keywords';
import {
  applyNinjaAttackTriggers,
  applyNinjaEntry,
  applyNinjaEquipHooks,
  applyNinjaRoundEnd,
  applyNinjaRoundStart,
} from '../engine/ninjaEffects';
import type { TrapSlot } from '../types/game';
import { formatKeywords } from '../types/game';
import { CardView } from './CardView';
import CardBack from './CardBack';
import BattleLogList from './BattleLogList';
import CinematicOverlay, { StackTargetArrows } from './CinematicOverlay';
import { CardInspector } from './CardInspector';
import { AnimePortrait } from './AnimePortrait';
import { ArenaBanner } from './ArenaBanner';
import { AudioMixerPopover } from './AudioMixerPopover';
import { getNinjaLevelUpQuote } from '../data/voiceLines';
import { formatDuration, recordMatchResult } from '../utils/matchHistory';
import { soundFX } from '../utils/sound';
import { OFFICIAL_ART, villageOfFaction, VillageKey } from '../data/officialArt';
import { OfficialImage, VillageSymbol } from './OfficialImage';
import { ArenaB4Screen } from '../ui/combat/ArenaB4Screen';
import { mapBattleToArenaB4 } from '../ui/combat/mapBattleToArenaB4';
import type { ArenaCardRef } from '../ui/combat/types';


interface BattleArenaProps {
  playerDeckIds: string[];
  initialArena: ArenaId;
  onExitToBuilder: () => void;
  /** Sair da batalha (a batalha ocupa a tela toda, sem o cabeçalho do site). */
  onExit?: () => void;
  onOpenHistory: () => void;
}

interface PendingTargetCast {
  card: JutsuCardDef | EquipmentCardDef;
  handIndex: number;
}

type DragPayload =
  | { type: 'hand_card'; cardId: string; handIndex: number }
  | { type: 'board_unit'; unitUid: string };

interface PendingTrapChoice {
  eventType: 'attack' | 'jutsu' | 'summon';
  matchingTraps: TrapSlot[];
  attackerSide: 'player' | 'enemy';
  pState: PlayerState;
  eState: PlayerState;
  pairs: CombatPair[];
  summonedUnitUid?: string;
  returnPhaseAfterStack: 'MAIN' | 'DECLARE_BLOCK';
  returnTurnAfterStack: 'player' | 'enemy';
  pendingCombatAttackerSide?: 'player' | 'enemy';
  existingStack: StackEntry[];
}

const EMPTY_FX: CombatVisualFX = { unitFx: {} };

/** Velocidade das animações/ritmo da partida (salva em localStorage). */
type BattleSpeed = 'lenta' | 'normal' | 'rapida';
const BATTLE_SPEED_KEY = 'shinobi.battleSpeed';
const SPEED_MULTIPLIER: Record<BattleSpeed, number> = { lenta: 1.6, normal: 1, rapida: 0.45 };
const SPEED_LABEL: Record<BattleSpeed, string> = { lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' };

/** Uma "cena" exibida como overlay, uma por vez. */
interface Cinematic {
  id: string;
  /** reveal/trap/stack/created/effect = carta grande no centro; pass/stage/combat = faixa curta. */
  kind: 'reveal' | 'trap' | 'stack' | 'created' | 'effect' | 'pass' | 'stage' | 'combat' | 'round' | 'flash';
  side: 'player' | 'enemy' | 'system';
  title: string;
  cardId?: string;
  text?: string;
  /** Unidade de origem (destacada) e alvos (setas). */
  originUid?: string;
  targetUids?: string[];
  /** Projétil do atacante até o Portão (data-uid 'gate-player' | 'gate-enemy'). */
  projectileTo?: string;
  /** Banner de rodada: a Ficha de Ataque voa até este elemento. */
  tokenTo?: string;
  /** Duração na velocidade Normal (ms). */
  baseMs: number;
  onStart?: () => void;
  onDone?: () => void;
}

/** Texto curto (1–2 frases) para a revelação de uma carta. */
function shortCardText(card: CardDef | undefined): string {
  if (!card) return '';
  const raw =
    card.kind === 'jutsu' || card.kind === 'armadilha' || card.kind === 'equipamento'
      ? card.effectText
      : card.abilityText;
  let clean = (raw || '').replace(/\s+/g, ' ').trim();
  if (!clean && 'keywords' in card && card.keywords.length > 0) clean = formatKeywords(card.keywords);
  if (clean.length <= 140) return clean;
  const cut = clean.slice(0, 140);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (lastStop > 60 ? cut.slice(0, lastStop + 1) : cut.replace(/\s\S*$/, '')) + '…';
}

let cineSeq = 0;
const cineId = (p: string) => `${p}_${Date.now().toString(36)}_${(cineSeq++).toString(36)}`;

/**
 * Combate resolvido "par a par": uma faixa "Combate!" e depois cada par destacado
 * (seta atacante → bloqueador/Portão) com pausa; a última cena aplica o resultado.
 */
interface StackStep {
  entry: StackEntry;
  status: 'ok' | 'fizzle' | 'nullified';
  beforeP: PlayerState;
  beforeE: PlayerState;
  afterP: PlayerState;
  afterE: PlayerState;
  fx: CombatVisualFX;
}
interface StackResolution {
  steps: StackStep[];
  nextP: PlayerState;
  nextE: PlayerState;
  nextPairs: CombatPair[];
  nextArena: ArenaId;
  allLogs: BattleLogEntry[];
  mergedFx: CombatVisualFX;
  evolves: Array<[BoardUnit, NinjaCardDef]>;
}

const MAIN_ACTION_TONE: Record<'amber' | 'red' | 'sky' | 'green' | 'gray' | 'violet', string> = {
  amber: 'bg-orange-500 hover:bg-orange-400 text-slate-950 border border-orange-300/60 disabled:opacity-50',
  red: 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50',
  sky: 'bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50',
  violet: 'bg-violet-500 hover:bg-violet-400 text-white disabled:opacity-50',
  green: 'bg-emerald-500 text-slate-950',
  gray: 'bg-slate-700 text-slate-300 border border-slate-600',
};

/** Vila do símbolo no Portão: facção mais frequente entre os Ninjas do baralho (desempate: Konoha). */
function deckVillage(cardIds: string[]): VillageKey {
  const count = new Map<VillageKey, number>();
  for (const id of cardIds) {
    const c = getCardById(id);
    if (!c || c.kind !== 'ninja') continue;
    const v = villageOfFaction(c.faction);
    count.set(v, (count.get(v) ?? 0) + 1);
  }
  let best: VillageKey = 'konoha';
  let bestN = count.get('konoha') ?? 0;
  for (const [v, n] of count) if (n > bestN) { best = v; bestN = n; }
  return best;
}

/** Tempo de "pensar" humano: aleatório, maior em decisões complexas. */
function thinkDelayMs(complexity: 'simple' | 'normal' | 'complex'): number {
  const [min, max] = complexity === 'complex' ? [1400, 2500] : complexity === 'normal' ? [1000, 2000] : [800, 1400];
  return min + Math.random() * (max - min);
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerDeckIds,
  initialArena,
  onExitToBuilder,
  onExit,
  onOpenHistory,
}) => {
  const enemyDeckRef = useRef<string[]>([]);
  const pickEnemyDeck = () => {
    const idx = Math.floor(Math.random() * DECK_PRESETS.length);
    enemyDeckRef.current = DECK_PRESETS[idx].cardIds;
    return DECK_PRESETS[idx].cardIds;
  };

  const [round, setRound] = useState(1);
  const [arenaId, setArenaId] = useState<ArenaId>(initialArena);
  const [playerUsedArenaShift, setPlayerUsedArenaShift] = useState(false);
  const [player, setPlayerRaw] = useState<PlayerState>(() => createInitialPlayerState(playerDeckIds));
  const [enemy, setEnemyRaw] = useState<PlayerState>(() => createInitialPlayerState(pickEnemyDeck()));
  // Grupos 2/3: toda mudança de estado de um lado passa pelas regras de mão do Ninja
  // (memória de patente, reversão de cópias e cópia que chega à mão com o Ninja em campo).
  const playerLatestRef = useRef<PlayerState>(player);
  const enemyLatestRef = useRef<PlayerState>(enemy);
  const roundLatestRef = useRef(1);
  const ninjaLogSinkRef = useRef<(entries: BattleLogEntry[]) => void>(() => {});
  const setPlayer = useCallback((next: PlayerState) => {
    const res = normalizeNinjaHand(playerLatestRef.current, next, 'player', roundLatestRef.current);
    // Grupo 5: Parceiro e Formação (regras contínuas de palavra-chave).
    const kw = applyContinuousKeywordRules(res.state, roundLatestRef.current, 'player');
    playerLatestRef.current = kw.state;
    setPlayerRaw(kw.state);
    const allLogs = [...res.logs, ...kw.logs];
    if (allLogs.length) ninjaLogSinkRef.current(allLogs);
  }, []);
  const setEnemy = useCallback((next: PlayerState) => {
    const res = normalizeNinjaHand(enemyLatestRef.current, next, 'enemy', roundLatestRef.current);
    const kw = applyContinuousKeywordRules(res.state, roundLatestRef.current, 'enemy');
    enemyLatestRef.current = kw.state;
    setEnemyRaw(kw.state);
    const allLogs = [...res.logs, ...kw.logs];
    if (allLogs.length) ninjaLogSinkRef.current(allLogs);
  }, []);

  const [coinWinner, setCoinWinner] = useState<'player' | 'enemy'>(() =>
    Math.random() < 0.5 ? 'player' : 'enemy'
  );
  const [mulliganSelection, setMulliganSelection] = useState<number[]>([]);
  const [attackTokenOwner, setAttackTokenOwner] = useState<'player' | 'enemy'>(coinWinner);
  const [hasAttackToken, setHasAttackToken] = useState(true);
  const [activeTurn, setActiveTurn] = useState<'player' | 'enemy'>(coinWinner);
  const [phase, setPhase] = useState<TurnPhase>('MULLIGAN');
  const [phaseBeforeStack, setPhaseBeforeStack] = useState<'MAIN' | 'DECLARE_BLOCK'>('MAIN');
  const [pendingCombatAttackerSide, setPendingCombatAttackerSide] = useState<'player' | 'enemy' | null>(null);
  const [pendingTrapChoice, setPendingTrapChoice] = useState<PendingTrapChoice | null>(null);

  const [stagedAttackers, setStagedAttackers] = useState<string[]>([]);
  const [stagedChallenges, setStagedChallenges] = useState<Record<string, string>>({});
  const [selectedChallengerUid, setSelectedChallengerUid] = useState<string | null>(null);
  const [combatPairs, setCombatPairs] = useState<CombatPair[]>([]);
  const [jutsuStack, setJutsuStack] = useState<StackEntry[]>([]);
  const [selectedBlockerUid, setSelectedBlockerUid] = useState<string | null>(null);

  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [pendingCast, setPendingCast] = useState<PendingTargetCast | null>(null);
  const [combatFX, setCombatFX] = useState<CombatVisualFX>(EMPTY_FX);

  const [blockNotice, setBlockNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!blockNotice) return;
    const t = window.setTimeout(() => setBlockNotice(null), 3600);
    return () => window.clearTimeout(t);
  }, [blockNotice]);
  const [inspected, setInspected] = useState<{ card: CardDef | null; unit?: BoardUnit }>({
    card: getCardById(playerDeckIds[0]) || JUTSU_CARDS[0],
  });
  const [logs, setLogs] = useState<BattleLogEntry[]>([
    {
      id: 'init_1',
      round: 1,
      text: `Sorteio inicial: ${
        coinWinner === 'player'
          ? 'Você começa com a Ficha de Ataque.'
          : 'O oponente começa com a Ficha de Ataque.'
      }${ARENA_EFFECTS_ENABLED ? ` Arena: ${ARENAS[initialArena].name}.` : ''}`,
      tone: 'arena',
    },
  ]);
  const [evolutionBanner, setEvolutionBanner] = useState<{
    name: string;
    rankLabel: string;
    evolvedTitle: string;
    quote: string;
    owner: 'player' | 'enemy';
  } | null>(null);
  const [evolutionsCount, setEvolutionsCount] = useState(0);
  const [jutsusCastCount, setJutsusCastCount] = useState(0);
  const [lastMatchDuration, setLastMatchDuration] = useState(0);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const aiTimerRef = useRef<number | null>(null);
  const fxTimerRef = useRef<number | null>(null);
  const evoBannerTimerRef = useRef<number | null>(null);
  const matchStartRef = useRef<number>(Date.now());
  const matchRecordedRef = useRef<boolean>(false);
  const matchInitialArenaRef = useRef<ArenaId>(initialArena);
  const playerJutsuCountsRef = useRef<Record<string, number>>({});

  const triggerFX = useCallback((fx: CombatVisualFX) => {
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
    setCombatFX(fx);
    fxTimerRef.current = window.setTimeout(() => {
      setCombatFX(EMPTY_FX);
    }, 1250);
  }, []);

  // Clone (Efêmero): ao sair de campo, mostra a carta desvanecendo por um instante.
  const [cloneGhosts, setCloneGhosts] = useState<Array<{ uid: string; cardId: string; owner: 'player' | 'enemy' }>>([]);
  const prevBoardsRef = useRef<BoardUnit[]>([]);
  useEffect(() => {
    const current = [...player.board, ...enemy.board];
    const currentIds = new Set(current.map((u) => u.uid));
    const vanished = prevBoardsRef.current.filter(
      (u) => !currentIds.has(u.uid) && !u.silenced && u.keywords.includes('Efêmero')
    );
    prevBoardsRef.current = current;
    if (vanished.length === 0) return;
    const ghosts = vanished.map((u) => ({ uid: u.uid, cardId: u.cardId, owner: u.owner }));
    setCloneGhosts((prev) => [...prev, ...ghosts]);
    window.setTimeout(() => {
      setCloneGhosts((prev) => prev.filter((g) => !ghosts.some((x) => x.uid === g.uid)));
    }, 950);
  }, [player.board, enemy.board]);

  const renderCloneGhosts = (owner: 'player' | 'enemy') =>
    cloneGhosts
      .filter((g) => g.owner === owner)
      .map((g) => (
        <div key={`ghost-${g.uid}`} className="relative" aria-hidden="true">
          <CardView card={getCardById(g.cardId)} size="board" vanishing keywordBursts={['clone']} />
        </div>
      ));

  const playCombatImpactAudio = useCallback((fx: CombatVisualFX) => {
    if (fx.playerGateLabel || fx.enemyGateLabel) {
      soundFX.playImpact('critical');
      return;
    }
    const entries = Object.values(fx.unitFx);
    if (entries.some((e) => e.label === 'Substituição!' || e.label === 'Contra-Jutsu!')) {
      soundFX.playBlockClang();
    }
    const hitEntries = entries.filter((e) => e.type === 'hit');
    if (hitEntries.length > 0) {
      const hasHeavy = hitEntries.some((e) => {
        const num = Number.parseInt((e.label || '').replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(num) && num >= 4;
      });
      soundFX.playImpact(hasHeavy ? 'heavy' : 'light');
    }
  }, []);

  const addLogs = useCallback((entries: BattleLogEntry[]) => {
    if (entries.length === 0) return;
    setLogs((prev) => [...prev, ...entries].slice(-60));
  }, []);
  ninjaLogSinkRef.current = addLogs;
  roundLatestRef.current = round;

  // ───────────────── Ritmo / "diretor" de cena (inspirado no LoR) ─────────────────
  // Tudo o que acontece "do nada" passa por uma fila de cenas exibidas UMA POR VEZ como
  // overlay (posição absoluta, sem empurrar o layout). A IA só age com a fila vazia.
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(() => {
    try {
      const v = window.localStorage.getItem(BATTLE_SPEED_KEY);
      return v === 'lenta' || v === 'rapida' || v === 'normal' ? v : 'normal';
    } catch {
      return 'normal';
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(BATTLE_SPEED_KEY, battleSpeed);
    } catch {
      /* localStorage indisponível: mantém só em memória */
    }
  }, [battleSpeed]);
  const speedMulRef = useRef(SPEED_MULTIPLIER[battleSpeed]);
  speedMulRef.current = SPEED_MULTIPLIER[battleSpeed];

  const [cineQueue, setCineQueue] = useState<Cinematic[]>([]);
  const currentCine = cineQueue[0];
  const doneCineRef = useRef(new Set<string>());
  const enqueueCine = useCallback((items: Cinematic[]) => {
    if (items.length === 0) return;
    setCineQueue((q) => [...q, ...items]);
  }, []);
  const completeCine = useCallback((c: Cinematic) => {
    if (doneCineRef.current.has(c.id)) return;
    doneCineRef.current.add(c.id);
    setCineQueue((q) => (q[0]?.id === c.id ? q.slice(1) : q.filter((x) => x.id !== c.id)));
    c.onDone?.();
  }, []);
  useEffect(() => {
    if (!currentCine) return;
    currentCine.onStart?.();
    const t = window.setTimeout(() => completeCine(currentCine), currentCine.baseMs * speedMulRef.current);
    return () => window.clearTimeout(t);
  }, [currentCine, completeCine]);

  const [activeCombatPairUid, setActiveCombatPairUid] = useState<string | null>(null);
  /** Combate par a par: estado final já calculado, mostrado par a par (esquerda → direita). */
  const [combatPreview, setCombatPreview] = useState<Record<string, BoardUnit | 'dead'>>({});
  const [impactUids, setImpactUids] = useState<string[]>([]);
  const [gatePreview, setGatePreview] = useState<{ player: number; enemy: number }>({ player: 0, enemy: 0 });
  /** Os dois passaram: botão mostra "Fim de rodada" (verde) enquanto a rodada fecha. */
  const [roundEnding, setRoundEnding] = useState(false);
  /** Pilha: item em destaque (brilho/resolução/falha) e itens que já resolveram (somem da fila). */
  const [stackFx, setStackFx] = useState<{ uid: string; mode: 'glow' | 'resolve' | 'fizzle' } | null>(null);
  const [stackGone, setStackGone] = useState<string[]>([]);
  /** Unidades do oponente avançando (uma a uma) para a Zona de Combate antes da declaração. */
  const [enemyStaging, setEnemyStaging] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  /** Há uma cena em andamento: a IA espera e as ações do jogador ficam bloqueadas. */
  const isBusy = cineQueue.length > 0;
  const [phaseBanner, setPhaseBanner] = useState<{ id: string; text: string; tone: 'player' | 'enemy' | 'combat' | 'stack' } | null>(null);

  const handleEvolutionNotify = useCallback(
    (unit: BoardUnit, card: NinjaCardDef) => {
      setEvolutionsCount((c) => c + 1);
      const isJounnin = unit.evolutionLevel === 3;
      const rankLabel = isJounnin ? 'Jounnin' : 'Chuunin';
      const newTitle = isJounnin ? card.jounninTitle : card.chuuninTitle;
      const newStats = isJounnin
        ? `${card.jounninAttack}/${card.jounninHealth}`
        : `${card.chuuninAttack}/${card.chuuninHealth}`;
      const quoteInfo = getNinjaLevelUpQuote(card.id, isJounnin ? 3 : 2);
      soundFX.playLevelUp(card.id, isJounnin ? 3 : 2);

      setEvolutionBanner({
        name: card.name,
        rankLabel,
        evolvedTitle: newTitle,
        quote: quoteInfo.text,
        owner: unit.owner,
      });
      addLogs([
        {
          id: nextUid('evo'),
          round,
          text: `${card.name} virou ${rankLabel} (${newStats}): "${quoteInfo.text}"`,
          tone: 'evolution',
        },
      ]);
      if (evoBannerTimerRef.current) clearTimeout(evoBannerTimerRef.current);
      evoBannerTimerRef.current = window.setTimeout(() => {
        setEvolutionBanner(null);
      }, 2800);
    },
    [addLogs, round]
  );

  // Dynamic background music synced to active arena
  useEffect(() => {
    soundFX.setArenaTheme(arenaId);
  }, [arenaId]);

  useEffect(() => {
    soundFX.startArenaMusic(arenaId);
    return () => {
      if (evoBannerTimerRef.current) clearTimeout(evoBannerTimerRef.current);
      soundFX.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      phase !== 'GAME_OVER' &&
      (player.hp <= 0 || enemy.hp <= 0 || player.deckOut || enemy.deckOut)
    ) {
      setPhase('GAME_OVER');
      const isVictory = enemy.hp <= 0 || Boolean(enemy.deckOut);
      if (isVictory) {
        soundFX.playVictory();
      }
      if (!matchRecordedRef.current) {
        matchRecordedRef.current = true;
        const durationSeconds = Math.max(1, Math.round((Date.now() - matchStartRef.current) / 1000));
        setLastMatchDuration(durationSeconds);
        recordMatchResult({
          id: nextUid('match'),
          playedAt: new Date().toISOString(),
          result: isVictory ? 'victory' : 'defeat',
          initialArena: matchInitialArenaRef.current,
          finalArena: arenaId,
          durationSeconds,
          rounds: round,
          playerHpRemaining: Math.max(0, player.hp),
          enemyHpRemaining: Math.max(0, enemy.hp),
          evolutionsCount,
          jutsusCastCount,
          jutsuCounts: { ...playerJutsuCountsRef.current },
        });
      }
    }
  }, [
    player.hp,
    enemy.hp,
    player.deckOut,
    enemy.deckOut,
    phase,
    initialArena,
    arenaId,
    round,
    evolutionsCount,
    jutsusCastCount,
  ]);

  const performMulliganForState = useCallback((st: PlayerState, indicesToSwap: number[]): PlayerState => {
    if (indicesToSwap.length === 0) return st;
    const swapSet = new Set(indicesToSwap);
    const kept: string[] = [];
    const returned: string[] = [];
    st.hand.forEach((id, i) => {
      if (swapSet.has(i)) returned.push(id);
      else kept.push(id);
    });
    const combinedDeck = [...st.deck, ...returned];
    for (let i = combinedDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedDeck[i], combinedDeck[j]] = [combinedDeck[j], combinedDeck[i]];
    }
    const replacements = combinedDeck.slice(0, returned.length);
    const nextDeck = combinedDeck.slice(returned.length);
    return {
      ...st,
      hand: [...kept, ...replacements],
      deck: nextDeck,
    };
  }, []);

  const confirmMulligan = useCallback(
    (keepAll = false) => {
      if (phase !== 'MULLIGAN') return;
      const pSwap = keepAll ? [] : mulliganSelection;
      const nextP = performMulliganForState(player, pSwap);

      const enemySwapIndices = enemy.hand
        .map((id, idx) => ({ card: getCardById(id), idx }))
        .filter((item) => (item.card?.cost ?? 0) >= 5)
        .map((item) => item.idx);
      const nextE = performMulliganForState(enemy, enemySwapIndices);

      setPlayer(nextP);
      setEnemy(nextE);
      setMulliganSelection([]);
      setPhase('MAIN');
      setActiveTurn(coinWinner);
      enqueueCine([
        {
          id: cineId('round'),
          kind: 'round',
          side: coinWinner,
          title: 'Rodada 1',
          text: coinWinner === 'player' ? 'Você ataca nesta rodada' : 'O oponente ataca nesta rodada',
          tokenTo: coinWinner === 'player' ? 'gate-player' : 'gate-enemy',
          baseMs: 2000,
        },
      ]);
      addLogs([
        {
          id: nextUid('mull'),
          round: 1,
          text: `Você trocou ${pSwap.length} carta(s); o oponente trocou ${enemySwapIndices.length}. ${
            coinWinner === 'player' ? 'Sua vez!' : 'O oponente joga primeiro.'
          }`,
          tone: 'info',
        },
      ]);
    },
    [phase, mulliganSelection, player, enemy, coinWinner, performMulliganForState, addLogs, enqueueCine]
  );

  const resetMatch = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
    const nextRandomArena = ARENA_EFFECTS_ENABLED
      ? ARENA_LIST[Math.floor(Math.random() * ARENA_LIST.length)].id
      : DEFAULT_ARENA_ID;
    const nextCoinWinner: 'player' | 'enemy' = Math.random() < 0.5 ? 'player' : 'enemy';
    matchStartRef.current = Date.now();
    matchRecordedRef.current = false;
    matchInitialArenaRef.current = nextRandomArena;
    playerJutsuCountsRef.current = {};
    setLastMatchDuration(0);
    setRound(1);
    setArenaId(nextRandomArena);
    setPlayerUsedArenaShift(false);
    // Nova partida: estado limpo, sem passar pelas regras de mão (não herda memória da anterior).
    const freshP = createInitialPlayerState(playerDeckIds);
    const freshE = createInitialPlayerState(pickEnemyDeck());
    playerLatestRef.current = freshP;
    enemyLatestRef.current = freshE;
    setPlayerRaw(freshP);
    setEnemyRaw(freshE);
    setCoinWinner(nextCoinWinner);
    setMulliganSelection([]);
    setAttackTokenOwner(nextCoinWinner);
    setHasAttackToken(true);
    setActiveTurn(nextCoinWinner);
    setPhase('MULLIGAN');
    setPhaseBeforeStack('MAIN');
    setPendingCombatAttackerSide(null);
    setPendingTrapChoice(null);
    setStagedAttackers([]);
    setStagedChallenges({});
    setSelectedChallengerUid(null);
    setCombatPairs([]);
    setJutsuStack([]);
    setSelectedBlockerUid(null);
    setPendingCast(null);
    setDragPayload(null);
    setCombatFX(EMPTY_FX);
    // Cenas pendentes da partida anterior não podem disparar na nova.
    setCineQueue([]);
    setRoundEnding(false);
    setStackFx(null);
    setStackGone([]);
    setCombatPreview({});
    setImpactUids([]);
    setGatePreview({ player: 0, enemy: 0 });
    setActiveCombatPairUid(null);
    setEnemyStaging([]);
    setEvolutionsCount(0);
    setJutsusCastCount(0);
    setLogs([
      {
        id: nextUid('init'),
        round: 1,
        text: `Nova partida em ${ARENAS[nextRandomArena].name}! Sorteio inicial: ${
          nextCoinWinner === 'player' ? 'Você começa!' : 'Oponente começa!'
        }`,
        tone: 'arena',
      },
    ]);
  };

  // Start Next Round (handles Efêmero, Regeneração, Frozen reset, Spell Mana reserve, Fluxo)
  const startNextRound = useCallback(
    (currPlayer: PlayerState, currEnemy: PlayerState) => {
      const nextRound = round + 1;
      const newMaxMana = Math.min(10, nextRound);

      const nextArena = arenaId;
      const newLogs: BattleLogEntry[] = [];
      const recFx: CombatVisualFX = { unitFx: {} };

      // Habilidades recorrentes (Grupo 4): Fim da rodada e Repouso da rodada que acabou,
      // começando por quem tinha a Ficha de Ataque.
      {
        const tokenIsPlayer = attackTokenOwner === 'player';
        const er = runEndOfRoundTriggers(tokenIsPlayer ? currPlayer : currEnemy, tokenIsPlayer ? currEnemy : currPlayer, {
          round,
          arenaId: nextArena,
          onEvolve: handleEvolutionNotify,
          fx: recFx,
          logs: newLogs,
        });
        let p0 = tokenIsPlayer ? er.first : er.second;
        let e0 = tokenIsPlayer ? er.second : er.first;
        if (er.fired > 0) {
          const d1 = processBoardDeaths(p0, e0, round, nextArena, newLogs, handleEvolutionNotify);
          const d2 = processBoardDeaths(d1.oppState, d1.ownerState, round, nextArena, newLogs, handleEvolutionNotify);
          p0 = d2.oppState;
          e0 = d2.ownerState;
        }
        currPlayer = p0;
        currEnemy = e0;
      }

      const prepSide = (st: PlayerState, opp: PlayerState): [PlayerState, PlayerState] => {
        const storedSpell = Math.min(3, st.spellMana + st.mana);
        const arenaBonusSpell = activeArenaRule(nextArena) === 'telhados_konoha' ? 1 : 0;
        let nextSt: PlayerState = {
          ...st,
          maxMana: newMaxMana,
          mana: newMaxMana,
          spellMana: Math.min(3, storedSpell + arenaBonusSpell),
          passed: false,
          cardsPlayedThisRound: 0,
          spellsCastLastRound: st.spellsCastThisRound,
          spellsCastThisRound: 0,
          damagedEnemyNexusThisRound: false,
          scoutAttackUsedThisRound: false,
          board: st.board.map((u) => {
            if (!u.silenced && u.keywords.includes('Efêmero')) {
              return { ...u, health: -999 };
            }
            // Palavras-chave "nesta rodada" (Investida gain_keyword) saem aqui.
            const reset = resetRecurringRoundState(u);
            const restoredKeywords = reset.keywords;
            let nextU: BoardUnit = {
              ...reset,
              tempAttackBonus: 0,
              tempHealthBonus: 0,
              hasBarrier: false,
              stunned: false,
              frozen: false,
              destinedTriggeredThisRound: false,
              canAttackThisRound: true,
              activatedTrigger: undefined,
              keywords: restoredKeywords,
            };
            if (!nextU.silenced && nextU.keywords.includes('Regeneração')) {
              nextU = healUnit(nextU, nextU.maxHealth);
            }
            return nextU;
          }),
        };

        const deathRes = processBoardDeaths(nextSt, opp, nextRound, nextArena, newLogs, handleEvolutionNotify);
        nextSt = deathRes.ownerState;
        let nextOpp = deathRes.oppState;

        nextSt = drawCards(nextSt, 1);

        if (activeArenaRule(nextArena) === 'floresta_da_morte' && nextSt.board.length > 0) {
          const injured = nextSt.board
            .filter((u) => u.health < u.maxHealth && !u.keywords.includes('Regeneração'))
            .sort((a, b) => a.health - b.health);
          if (injured.length > 0) {
            const targetUid = injured[0].uid;
            nextSt.board = nextSt.board.map((u) =>
              u.uid === targetUid ? applyDamageToUnit(u, 1).unit : u
            );
            const flDeaths = processBoardDeaths(nextSt, nextOpp, nextRound, nextArena, newLogs, handleEvolutionNotify);
            nextSt = flDeaths.ownerState;
            nextOpp = flDeaths.oppState;
          }
        }

        return [nextSt, nextOpp];
      };

      let nextP = currPlayer;
      let nextE = currEnemy;
      // Ninjas: habilidades de Fim da rodada (antes de zerar os bônus e processar as mortes).
      {
        const endCtx = { round, arenaId: nextArena, logs: newLogs, onEvolve: handleEvolutionNotify };
        const pEnd = applyNinjaRoundEnd('player', nextP, nextE, endCtx);
        nextP = pEnd.owner;
        nextE = pEnd.opp;
        const eEnd = applyNinjaRoundEnd('enemy', nextE, nextP, endCtx);
        nextE = eEnd.owner;
        nextP = eEnd.opp;
      }
      // Grupo 5: cópias Fugazes somem, Veneno causa dano e Genjutsu perde 1 rodada (antes de Cura Natural).
      [nextP, nextE] = prepSide(applyRoundStartKeywords(nextP, nextRound, 'player', newLogs), nextE);
      [nextE, nextP] = prepSide(applyRoundStartKeywords(nextE, nextRound, 'enemy', newLogs), nextP);

      // Ninjas: habilidades de Início da rodada (Shikamaru, Shino, Kurenai, Naruto, Sakura, Tsunade...).
      {
        const startCtx = { round: nextRound, arenaId: nextArena, logs: newLogs, onEvolve: handleEvolutionNotify };
        const pStart = applyNinjaRoundStart('player', nextP, nextE, startCtx);
        nextP = pStart.owner;
        nextE = pStart.opp;
        const eStart = applyNinjaRoundStart('enemy', nextE, nextP, startCtx);
        nextE = eStart.owner;
        nextP = eStart.opp;
        const pd = processBoardDeaths(nextP, nextE, nextRound, nextArena, newLogs, handleEvolutionNotify);
        nextP = pd.ownerState;
        nextE = pd.oppState;
        const ed = processBoardDeaths(nextE, nextP, nextRound, nextArena, newLogs, handleEvolutionNotify);
        nextE = ed.ownerState;
        nextP = ed.oppState;
      }

      // Habilidades recorrentes (Grupo 4): Início da rodada, começando por quem recebe a Ficha de Ataque.
      {
        const tokenNext: 'player' | 'enemy' = attackTokenOwner === 'player' ? 'enemy' : 'player';
        const order: Array<'player' | 'enemy'> = tokenNext === 'player' ? ['player', 'enemy'] : ['enemy', 'player'];
        let fired = 0;
        for (const side of order) {
          const r = runRecurringTrigger(
            'inicio_rodada',
            side === 'player' ? nextP : nextE,
            side === 'player' ? nextE : nextP,
            { round: nextRound, arenaId: nextArena, onEvolve: handleEvolutionNotify, fx: recFx, logs: newLogs }
          );
          fired += r.fired;
          if (side === 'player') {
            nextP = r.owner;
            nextE = r.opp;
          } else {
            nextE = r.owner;
            nextP = r.opp;
          }
        }
        if (fired > 0) {
          const d1 = processBoardDeaths(nextP, nextE, nextRound, nextArena, newLogs, handleEvolutionNotify);
          const d2 = processBoardDeaths(d1.oppState, d1.ownerState, nextRound, nextArena, newLogs, handleEvolutionNotify);
          nextP = d2.oppState;
          nextE = d2.ownerState;
        }
        if (Object.keys(recFx.unitFx).length > 0) triggerFX(recFx);
      }

      const nextTokenOwner = attackTokenOwner === 'player' ? 'enemy' : 'player';
      setRound(nextRound);
      setArenaId(nextArena);
      setPlayer(nextP);
      setEnemy(nextE);
      setAttackTokenOwner(nextTokenOwner);
      setHasAttackToken(true);
      setActiveTurn(nextTokenOwner);
      setPhase('MAIN');
      setPhaseBeforeStack('MAIN');
      setPendingCombatAttackerSide(null);
      setStagedAttackers([]);
      setStagedChallenges({});
      setSelectedChallengerUid(null);
      setCombatPairs([]);
      setJutsuStack([]);
      setSelectedBlockerUid(null);
      setPendingCast(null);

      newLogs.push({
        id: nextUid('rnd'),
        round: nextRound,
        text: `Rodada ${nextRound} · ${
          nextTokenOwner === 'player'
            ? 'Você ataca nesta rodada.'
            : 'O oponente ataca nesta rodada.'
        }`,
        tone: 'info',
      });
      enqueueCine([
        {
          id: cineId('round'),
          kind: 'round',
          side: nextTokenOwner,
          title: `Rodada ${nextRound}`,
          text: nextTokenOwner === 'player' ? 'Você ataca nesta rodada' : 'O oponente ataca nesta rodada',
          tokenTo: nextTokenOwner === 'player' ? 'gate-player' : 'gate-enemy',
          baseMs: 2000,
        },
      ]);
      addLogs(newLogs);
    },
    [round, arenaId, attackTokenOwner, addLogs, handleEvolutionNotify, enqueueCine, triggerFX]
  );

  /** Passe duplo: mostra "Fim de rodada" (botão verde) e só então começa a próxima rodada. */
  const endRoundFlow = useCallback(
    (currPlayer: PlayerState, currEnemy: PlayerState) => {
      setRoundEnding(true);
      enqueueCine([
        {
          id: cineId('rend'),
          kind: 'pass',
          side: 'system',
          title: 'Os dois passaram · Fim de rodada',
          baseMs: 1100,
          onDone: () => {
            setRoundEnding(false);
            startNextRound(currPlayer, currEnemy);
          },
        },
      ]);
    },
    [enqueueCine, startNextRound]
  );

  // Summon Ninja or Unidade
  const executeSummon = useCallback(
    (
      side: 'player' | 'enemy',
      card: NinjaCardDef | UnitCardDef,
      handIdx: number,
      pState: PlayerState,
      eState: PlayerState
    ) => {
      soundFX.playSummon();
      let caster = side === 'player' ? { ...pState } : { ...eState };
      let opp = side === 'player' ? { ...eState } : { ...pState };
      let nextArena = arenaId;
      const newLogs: BattleLogEntry[] = [];
      const fx: CombatVisualFX = { unitFx: {} };

      const isDawn = caster.cardsPlayedThisRound === 0;
      const isNightfall = caster.cardsPlayedThisRound >= 1;
      const isPlunder = caster.damagedEnemyNexusThisRound;
      // Ninja Único: se este Ninja já está em campo, a carta vira o Jutsu Exclusivo dele.
      if (card.kind === 'ninja' && caster.board.some((u) => u.cardId === card.id)) {
        const sig = getCardById(getNinjaDuplicateCardId(card));
        caster.hand = caster.hand.map((id, i) => (i === handIdx && sig ? sig.id : id));
        if (sig) caster.ninjaCopies = { ...(caster.ninjaCopies ?? {}), [card.id]: (caster.ninjaCopies?.[card.id] ?? 0) + 1 };
        if (side === 'player') setPlayer(caster);
        else setEnemy(caster);
        addLogs([
          {
            id: nextUid('unico'),
            round,
            text: `${card.name} já está em campo, então a carta virou ${
              sig?.name || 'o Jutsu Exclusivo'
            } na mão.`,
            tone: 'info',
          },
        ]);
        return;
      }

      const triggersDawn = isDawn && FIRST_CARD_BONUS_IDS.has(card.id);
      const triggersNightfall = isNightfall && LATER_CARD_BONUS_IDS.has(card.id);

      caster = spendManaForCard(caster, card, nextArena, handIdx);
      caster.hand = caster.hand.filter((_, i) => i !== handIdx);
      caster.passed = false;
      caster.cardsPlayedThisRound += 1;

      // Memória de patente: o Ninja entra na patente salva (custo já cobrado por getEffectiveCost).
      let newUnit =
        card.kind === 'ninja'
          ? applySavedRank(createBoardUnit(card, side, round, nextArena), caster, nextArena)
          : createBoardUnit(card, side, round, nextArena);
      if (triggersDawn) {
        newUnit = { ...newUnit, activatedTrigger: 'dawn' };
        const dawnLabel =
          card.id === 'asuma_sarutobi'
            ? '1ª carta! +1/+0'
            : card.id === 'unit_policia_uchiha'
              ? '1ª carta! Substituição'
              : '1ª carta!';
        fx.unitFx[newUnit.uid] = { type: 'dawn', label: dawnLabel };
        soundFX.playDawn();
        newLogs.push({
          id: nextUid('dawn'),
          round,
          text: `${card.name} foi a 1ª carta da rodada e ganhou o bônus.`,
          tone: 'evolution',
        });
      } else if (triggersNightfall) {
        newUnit = { ...newUnit, activatedTrigger: 'nightfall' };
        const nightLabel =
          card.id === 'kurenai_yuhi'
            ? 'Bônus! Bloq. Chakra'
            : card.id === 'tayuya'
              ? 'Bônus! 2 Alvos'
              : card.id === 'unit_raiz_ne'
                ? 'Bônus! +1/+1'
                : 'Bônus!';
        fx.unitFx[newUnit.uid] = { type: 'nightfall', label: nightLabel };
        soundFX.playNightfall();
        newLogs.push({
          id: nextUid('night'),
          round,
          text: `${card.name} ativou o bônus (você já tinha jogado outra carta nesta rodada).`,
          tone: 'jutsu',
        });
      } else {
        fx.unitFx[newUnit.uid] = { type: 'jutsu', label: 'Invocado' };
      }

      // Sintonia: +1 Spell Mana on summon
      if (card.keywords.includes('Sintonia')) {
        caster.spellMana = Math.min(3, caster.spellMana + 1);
      }

      caster.board = [...caster.board, newUnit];

      // Jutsu Exclusivo: criado na mão quando o Ninja entra em campo (não vem do baralho).
      if (card.kind === 'ninja') {
        caster = onNinjaEnteredBoard(card, caster, round, newLogs, side);
      }

      // Fotografia antes do efeito de Entrada (para destacar origem → alvos e cartas geradas).
      const entryOppBefore = new Map(opp.board.map((u) => [u.uid, u]));
      const entryAllyBefore = new Map(caster.board.map((u) => [u.uid, u]));
      const entryHandBefore = caster.hand.length;
      const entryHpBefore = caster.hp;

      // On-Play: Entrada dos Ninjas (Grupo 6, ver engine/ninjaEffects.ts) e das Unidades.
      if (card.kind === 'ninja') {
        const entry = applyNinjaEntry(card, newUnit.uid, side, caster, opp, {
          round,
          arenaId: nextArena,
          logs: newLogs,
          onEvolve: handleEvolutionNotify,
        });
        caster = entry.owner;
        opp = entry.opp;
      }

      // Entrada das Unidades (Grupo 7): efeitos por carta em engine/unitEffects.ts.
      if (card.kind === 'unidade') {
        const entry = applyUnitEntryEffect({
          card,
          side,
          unitUid: newUnit.uid,
          caster,
          opp,
          round,
          arenaId: nextArena,
          logs: newLogs,
          fx,
        });
        caster = entry.caster;
        opp = entry.opp;
      }

      // Destaque do efeito de Entrada: quem foi afetado e quais cartas foram geradas.
      {
        const changed = (a: BoardUnit | undefined, b: BoardUnit) =>
          !a ||
          a.health !== b.health ||
          a.attack !== b.attack ||
          a.maxHealth !== b.maxHealth ||
          a.stunned !== b.stunned ||
          a.frozen !== b.frozen ||
          a.tempAttackBonus !== b.tempAttackBonus ||
          a.hasBarrier !== b.hasBarrier ||
          a.keywords.length !== b.keywords.length;
        const targetUids = [
          ...opp.board.filter((u) => entryOppBefore.has(u.uid) && changed(entryOppBefore.get(u.uid), u)),
          ...caster.board.filter(
            (u) => u.uid !== newUnit.uid && entryAllyBefore.has(u.uid) && changed(entryAllyBefore.get(u.uid), u)
          ),
        ].map((u) => u.uid);
        const handGain = Math.max(0, caster.hand.length - entryHandBefore);
        const sigId = card.kind === 'ninja' ? card.signatureJutsuId : undefined;
        // O Jutsu Exclusivo já tem aviso próprio; aqui só as outras cartas geradas/compradas.
        const extraGain = handGain - (sigId && caster.hand.includes(sigId) ? 1 : 0);
        const hpGain = caster.hp - entryHpBefore;
        const parts: string[] = [];
        if (targetUids.length > 0) {
          parts.push(
            `afetou ${targetUids
              .map((uid) => getCardById([...opp.board, ...caster.board].find((u) => u.uid === uid)?.cardId ?? '')?.name)
              .filter(Boolean)
              .join(', ')}`
          );
        }
        if (hpGain > 0) parts.push(`curou ${hpGain} do Portão`);
        if (extraGain > 0) {
          const lastId = caster.hand[caster.hand.length - 1];
          parts.push(
            side === 'player'
              ? `criou ${getCardById(lastId)?.name ?? 'uma carta'} na sua mão`
              : `deu ${extraGain} carta(s) ao oponente`
          );
        }
        if (parts.length > 0) {
          newLogs.push({
            id: nextUid('entry'),
            round,
            text: `${side === 'enemy' ? 'Oponente · ' : ''}Entrada de ${card.name}: ${parts.join('; ')}.`,
            tone: 'info',
            actor: side,
            cardId: card.id,
            cine: 'effect',
            originUid: newUnit.uid,
            targetUids,
          });
        }
      }

      // Process any deaths caused by summon damage (Orochimaru/Tenten/Tayuya/Anko)
      const oppDeaths = processBoardDeaths(opp, caster, round, nextArena, newLogs, handleEvolutionNotify);
      opp = oppDeaths.ownerState;
      caster = oppDeaths.oppState;

      newLogs.push({
        id: nextUid('sum'),
        round,
        text: `${side === 'player' ? 'Você invocou' : 'O oponente invocou'} ${card.name} (${card.attack}/${card.health}).`,
        tone: 'info',
      });

      const nextPlayerState = side === 'player' ? caster : opp;
      const nextEnemyState = side === 'player' ? opp : caster;
      const matchingTraps = getMatchingTraps('summon', opp);

      triggerFX(fx);
      setArenaId(nextArena);
      addLogs(newLogs);

      if (matchingTraps.length > 0) {
        const defenderSide: 'player' | 'enemy' = side === 'player' ? 'enemy' : 'player';
        if (defenderSide === 'player' && matchingTraps.length > 1) {
          setPlayer(nextPlayerState);
          setEnemy(nextEnemyState);
          setPendingTrapChoice({
            eventType: 'summon',
            matchingTraps,
            attackerSide: side,
            pState: nextPlayerState,
            eState: nextEnemyState,
            pairs: [],
            summonedUnitUid: newUnit.uid,
            returnPhaseAfterStack: 'MAIN',
            returnTurnAfterStack: side === 'player' ? 'enemy' : 'player',
            existingStack: jutsuStack,
          });
          return;
        }
        const chosen =
          chooseBestTrap(matchingTraps, defenderSide, nextPlayerState, nextEnemyState, [], arenaId, round, {
            summonedUnitUid: newUnit.uid,
          }) || matchingTraps[0];
        const updatedDef = {
          ...opp,
          traps: opp.traps.filter((t) => t.uid !== chosen.uid),
        };
        const pAfterTrap = defenderSide === 'player' ? updatedDef : caster;
        const eAfterTrap = defenderSide === 'player' ? caster : updatedDef;
        const trapEntry: StackEntry = {
          uid: nextUid('trpstk'),
          cardId: chosen.cardId,
          caster: defenderSide,
          kind: 'trap_trigger',
          trapTriggerContext: { eventType: 'summon', summonedUnitUid: newUnit.uid },
        };
        setPlayer(pAfterTrap);
        setEnemy(eAfterTrap);
        setPhaseBeforeStack('MAIN');
        setJutsuStack([...jutsuStack, trapEntry]);
        setPhase('STACK_RESPONSE');
        setActiveTurn(side);
        addLogs([
          {
            id: nextUid('trpq'),
            round,
            text: `Armadilha! ${getCardById(chosen.cardId)?.name} disparou porque ${card.name} entrou.`,
            tone: 'trap',
            actor: defenderSide,
            cardId: chosen.cardId,
            cine: 'trap',
          },
        ]);
        return;
      }

      setPlayer(nextPlayerState);
      setEnemy(nextEnemyState);
      setActiveTurn(side === 'player' ? 'enemy' : 'player');
    },
    [arenaId, round, jutsuStack, addLogs, handleEvolutionNotify, triggerFX]
  );

  // Equip Attachment
  const executeEquip = useCallback(
    (
      side: 'player' | 'enemy',
      equip: EquipmentCardDef,
      handIdx: number,
      targetUid: string,
      pState: PlayerState,
      eState: PlayerState
    ) => {
      soundFX.playEquip();
      let caster = side === 'player' ? { ...pState } : { ...eState };
      const opp = side === 'player' ? eState : pState;
      const targetUnit = caster.board.find((u) => u.uid === targetUid);
      if (!targetUnit) return;

      caster = spendManaForCard(caster, equip, arenaId, handIdx);
      caster.hand = caster.hand.filter((_, i) => i !== handIdx);
      caster.passed = false;
      caster.cardsPlayedThisRound += 1;

      const res = attachEquipmentToUnit(equip, targetUnit, caster);
      caster = applyNinjaEquipHooks(res.ownerState, { arenaId, onEvolve: handleEvolutionNotify });

      triggerFX({
        unitFx: {
          [targetUid]: {
            type: 'heal',
            label: `+${equip.bonusAttack}/+${equip.bonusHealth}`,
          },
        },
      });

      addLogs([
        {
          id: nextUid('eq'),
          round,
          text: `${side === 'player' ? 'Você equipou' : 'O oponente equipou'} ${equip.name} em ${
            getCardById(targetUnit.cardId)?.name
          }.`,
          tone: 'equip',
        },
      ]);

      if (side === 'player') {
        setPlayer(caster);
        setEnemy(opp);
        setActiveTurn('enemy');
      } else {
        setEnemy(caster);
        setPlayer(opp);
        setActiveTurn('player');
      }
    },
    [arenaId, round, addLogs, triggerFX]
  );

  // Arm Hidden Trap
  const executeArmTrap = useCallback(
    (
      side: 'player' | 'enemy',
      trap: TrapCardDef,
      handIdx: number,
      pState: PlayerState,
      eState: PlayerState
    ) => {
      soundFX.playTrap();
      let caster = side === 'player' ? { ...pState } : { ...eState };
      caster = spendManaForCard(caster, trap, arenaId, handIdx);
      caster.hand = caster.hand.filter((_, i) => i !== handIdx);
      caster.passed = false;
      caster.cardsPlayedThisRound += 1;
      caster.traps = [
        ...caster.traps,
        { uid: nextUid('trap'), cardId: trap.id, owner: side, armedRound: round },
      ];
      addLogs([
        {
          id: nextUid('trp'),
          round,
          text:
            side === 'player'
              ? `Você armou a armadilha secreta ${trap.name}.`
              : 'Oponente armou uma Armadilha oculta!',
          tone: 'trap',
        },
      ]);

      if (side === 'player') {
        setPlayer(caster);
        setEnemy(eState);
        setActiveTurn('enemy');
      } else {
        setEnemy(caster);
        setPlayer(pState);
        setActiveTurn('player');
      }
    },
    [arenaId, round, addLogs, handleEvolutionNotify]
  );

  /**
   * Combate estilo LoR: calcula o resultado (motor, regras intactas) e mostra par a par,
   * da esquerda para a direita (~1s por par): aproximação → impacto (tremor, números,
   * projétil ao Portão se não bloqueado). O estado real é aplicado no fim.
   */
  const buildCombatCinematics = useCallback(
    (
      pairs: CombatPair[],
      attackerSide: 'player' | 'enemy',
      pNow: PlayerState,
      eNow: PlayerState,
      apply: (resolved: ReturnType<typeof resolveCombatPairs>) => void
    ): Cinematic[] => {
      const evolves: Array<[BoardUnit, NinjaCardDef]> = [];
      const resolved = resolveCombatPairs(pairs, attackerSide, pNow, eNow, arenaId, round, (u, c) =>
        evolves.push([u, c])
      );
      const attBefore = attackerSide === 'player' ? pNow : eNow;
      const defBefore = attackerSide === 'player' ? eNow : pNow;
      const attAfter = attackerSide === 'player' ? resolved.player : resolved.enemy;
      const defAfter = attackerSide === 'player' ? resolved.enemy : resolved.player;
      const defGate: 'player' | 'enemy' = attackerSide === 'player' ? 'enemy' : 'player';
      const totalGate = Math.max(0, defBefore.hp - defAfter.hp);

      // Parte do dano ao Portão de cada par (simulação isolada só para exibir; soma = total real).
      const share: Record<string, number> = {};
      let remaining = totalGate;
      pairs.forEach((p) => {
        let v = 0;
        try {
          const sim = resolveCombatPairs([p], attackerSide, pNow, eNow, arenaId, round);
          v = Math.max(0, defBefore.hp - (attackerSide === 'player' ? sim.enemy.hp : sim.player.hp));
        } catch {
          v = 0;
        }
        v = Math.min(v, remaining);
        share[p.attackerUid] = v;
        remaining -= v;
      });
      if (remaining > 0 && pairs.length > 0) {
        const last = [...pairs].reverse().find((p) => !p.blockerUid) ?? pairs[pairs.length - 1];
        share[last.attackerUid] = (share[last.attackerUid] ?? 0) + remaining;
      }

      const nameOf = (u?: BoardUnit) => (u ? getCardById(u.cardId)?.name ?? '' : '');
      const pairUids = new Set<string>();
      const items: Cinematic[] = [
        { id: cineId('cmb'), kind: 'combat', side: attackerSide, title: 'Combate!', baseMs: 600 },
      ];
      pairs.forEach((p) => {
        const att = attBefore.board.find((u) => u.uid === p.attackerUid);
        if (!att) return;
        const blk = p.blockerUid ? defBefore.board.find((u) => u.uid === p.blockerUid) : undefined;
        const here = [att.uid, ...(blk ? [blk.uid] : [])];
        here.forEach((uid) => pairUids.add(uid));
        const gateTxt = attackerSide === 'enemy' ? 'seu Portão' : 'Portão Rival';
        const title = `${nameOf(att)} (${getUnitPower(att)}/${getUnitHealth(att)}) ⚔ ${
          blk ? `${nameOf(blk)} (${getUnitPower(blk)}/${getUnitHealth(blk)})` : gateTxt
        }`;
        const g = share[att.uid] ?? 0;
        items.push({
          id: cineId('pair'),
          kind: 'combat',
          side: attackerSide,
          title,
          originUid: att.uid,
          targetUids: blk ? [blk.uid] : [],
          baseMs: 380,
          onStart: () => setActiveCombatPairUid(att.uid),
        });
        items.push({
          id: cineId('hit'),
          kind: 'combat',
          side: attackerSide,
          title: blk
            ? g > 0
              ? `${title} · ${g} passam para o Portão`
              : title
            : g > 0
              ? `${nameOf(att)} acerta ${gateTxt}: −${g}`
              : `${nameOf(att)} não causa dano a ${gateTxt}`,
          originUid: att.uid,
          projectileTo: !blk || g > 0 ? `gate-${defGate}` : undefined,
          baseMs: 620,
          onStart: () => {
            setActiveCombatPairUid(att.uid);
            setCombatPreview((prev) => {
              const next = { ...prev };
              for (const uid of here) {
                next[uid] =
                  attAfter.board.find((u) => u.uid === uid) ?? defAfter.board.find((u) => u.uid === uid) ?? 'dead';
              }
              return next;
            });
            setImpactUids(here);
            const sub: CombatVisualFX = { unitFx: {}, keywordFx: {} };
            for (const uid of here) {
              if (resolved.fx.unitFx[uid]) sub.unitFx[uid] = resolved.fx.unitFx[uid];
              const kw = resolved.fx.keywordFx?.[uid];
              if (kw && sub.keywordFx) sub.keywordFx[uid] = kw;
            }
            if (g > 0) {
              if (defGate === 'enemy') sub.enemyGateLabel = `-${g}`;
              else sub.playerGateLabel = `-${g}`;
              setGatePreview((prev) => ({ ...prev, [defGate]: prev[defGate] + g }));
            }
            triggerFX(sub);
            soundFX.playStrike();
            window.setTimeout(() => playCombatImpactAudio(sub), 110);
          },
        });
      });
      items.push({
        id: cineId('cmbres'),
        kind: 'combat',
        side: attackerSide,
        title: 'Fim do combate',
        baseMs: 350,
        onDone: () => {
          setActiveCombatPairUid(null);
          setCombatPreview({});
          setImpactUids([]);
          setGatePreview({ player: 0, enemy: 0 });
          const rest: CombatVisualFX = { unitFx: {}, keywordFx: {} };
          for (const [uid, f] of Object.entries(resolved.fx.unitFx)) if (!pairUids.has(uid)) rest.unitFx[uid] = f;
          for (const [uid, f] of Object.entries(resolved.fx.keywordFx ?? {}))
            if (!pairUids.has(uid) && rest.keywordFx) rest.keywordFx[uid] = f;
          if (Object.keys(rest.unitFx).length > 0 || Object.keys(rest.keywordFx ?? {}).length > 0) triggerFX(rest);
          evolves.forEach(([u, c]) => handleEvolutionNotify(u, c));
          apply(resolved);
        },
      });
      return items;
    },
    [arenaId, round, triggerFX, playCombatImpactAudio, handleEvolutionNotify]
  );

  const finalizePlayerAttackCombat = useCallback(
    (
      pairsToResolve: CombatPair[],
      currP: PlayerState,
      currE: PlayerState,
      extraLogs: BattleLogEntry[] = []
    ) => {
      if (pairsToResolve.length === 0) {
        setPlayer(currP);
        setEnemy(currE);
        setCombatPairs([]);
        setPhase('MAIN');
        setActiveTurn('enemy');
        addLogs(extraLogs);
        return;
      }

      // IA escolhe bloqueadores como uma pessoa: prefere quem sobrevive ou mata o atacante,
      // só "se sacrifica" com o Portão baixo, e não é 100% previsível.
      const usedBlockers = new Set(pairsToResolve.map((p) => p.blockerUid).filter(Boolean));
      const availableDefenders = currE.board.filter((u) => !usedBlockers.has(u.uid));
      const finalPairs = pairsToResolve.map((pair) => {
        if (pair.blockerUid) return pair;
        const attUnit = currP.board.find((u) => u.uid === pair.attackerUid);
        if (!attUnit) return pair;
        const candidates = availableDefenders.filter(
          (d) => !usedBlockers.has(d.uid) && canBlockAttacker(d, attUnit).ok
        );
        if (candidates.length === 0) return pair;
        const attPower = getUnitPower(attUnit);
        const attHealth = getUnitHealth(attUnit);
        const scored = candidates
          .map((d) => {
            const survives = getUnitHealth(d) > attPower || d.hasBarrier;
            const kills = getUnitPower(d) >= attHealth;
            let score = (survives ? 4 : 0) + (kills ? 3 : 0) - (getCardById(d.cardId)?.cost ?? 0) * 0.3 + Math.random() * 1.2;
            if (!survives && !kills) score -= currE.hp <= Math.max(6, attPower * 2) ? 0 : 6;
            return { d, score };
          })
          .sort((a, b) => b.score - a.score);
        const best = scored[0];
        if (!best || best.score < 0.5 || (attPower <= 1 && currE.hp > 10 && Math.random() < 0.6)) return pair;
        usedBlockers.add(best.d.uid);
        return { ...pair, blockerUid: best.d.uid };
      });

      // Mostra o ataque montado e os bloqueios escolhidos UM POR UM, depois o combate par a par.
      setPlayer(currP);
      setEnemy(currE);
      setCombatPairs(pairsToResolve);
      addLogs(extraLogs);
      const applyResolved = (resolved: ReturnType<typeof resolveCombatPairs>) => {
        setPlayer(resolved.player);
        setEnemy(resolved.enemy);
        setCombatPairs([]);
        if (resolved.rallyGranted) setHasAttackToken(true);
        setPhase('MAIN');
        setActiveTurn('enemy');
        addLogs(resolved.logs);
      };
      const blockItems: Cinematic[] = [
        {
          id: cineId('aiblk'),
          kind: 'stage',
          side: 'enemy',
          title: 'Oponente está escolhendo bloqueadores…',
          baseMs: thinkDelayMs('complex'),
        },
      ];
      const newBlocks = finalPairs.filter(
        (fp) => fp.blockerUid && !pairsToResolve.find((p) => p.attackerUid === fp.attackerUid)?.blockerUid
      );
      newBlocks.forEach((fp) => {
        const att = currP.board.find((u) => u.uid === fp.attackerUid);
        const blk = currE.board.find((u) => u.uid === fp.blockerUid);
        blockItems.push({
          id: cineId('aiblk'),
          kind: 'stage',
          side: 'enemy',
          title: `Oponente bloqueia ${getCardById(att?.cardId ?? '')?.name} com ${getCardById(blk?.cardId ?? '')?.name}`,
          originUid: fp.blockerUid ?? undefined,
          targetUids: [fp.attackerUid],
          baseMs: 950,
          onStart: () =>
            setCombatPairs((prev) =>
              prev.map((p) => (p.attackerUid === fp.attackerUid ? { ...p, blockerUid: fp.blockerUid } : p))
            ),
        });
      });
      if (newBlocks.length === 0) {
        blockItems.push({
          id: cineId('aiblk'),
          kind: 'stage',
          side: 'enemy',
          title: 'Oponente não bloqueia',
          baseMs: 800,
        });
      }
      enqueueCine([
        ...blockItems,
        ...buildCombatCinematics(finalPairs, 'player', currP, currE, applyResolved),
      ]);
    },
    [addLogs, enqueueCine, buildCombatCinematics]
  );

  // Resolve entire Jutsu/Trap Stack (LIFO) — cálculo separado da apresentação.
  const computeStackResolution = useCallback(
    (stackToResolve: StackEntry[], currPlayer: PlayerState, currEnemy: PlayerState): StackResolution => {
      let nextP = { ...currPlayer };
      let nextE = { ...currEnemy };
      let nextPairs = [...combatPairs];
      let nextArena = arenaId;
      const allLogs: BattleLogEntry[] = [];
      const mergedFx: CombatVisualFX = { unitFx: {} };
      const steps: StackStep[] = [];
      const evolves: Array<[BoardUnit, NinjaCardDef]> = [];
      const onEvolve = (u: BoardUnit, c: NinjaCardDef) => {
        evolves.push([u, c]);
      };

      // LIFO: last pushed resolves first!
      const ordered = [...stackToResolve].reverse();
      for (const entry of ordered) {
        const beforeP = nextP;
        const beforeE = nextE;
        if (entry.kind === 'trap_trigger') {
          const res = resolveTrapEffect(
            entry.cardId,
            entry.caster,
            nextP,
            nextE,
            nextPairs,
            nextArena,
            round,
            entry.trapTriggerContext,
            onEvolve
          );
          nextP = res.player;
          nextE = res.enemy;
          nextPairs = res.attackPairs;
          Object.assign(mergedFx.unitFx, res.fx.unitFx);
          if (res.fx.playerGateLabel) mergedFx.playerGateLabel = res.fx.playerGateLabel;
          if (res.fx.enemyGateLabel) mergedFx.enemyGateLabel = res.fx.enemyGateLabel;
          allLogs.push(...res.logs);
          steps.push({ entry, status: 'ok', beforeP, beforeE, afterP: nextP, afterE: nextE, fx: res.fx });
          continue;
        }

        const card = getCardById(entry.cardId);
        if (!card || card.kind !== 'jutsu') continue;

        // Alvo escolhido já saiu de campo: o Jutsu falha (sem efeito), como no LoR.
        if (
          entry.targetUid &&
          card.targetMode !== 'none' &&
          !nextP.board.some((u) => u.uid === entry.targetUid) &&
          !nextE.board.some((u) => u.uid === entry.targetUid)
        ) {
          allLogs.push({
            id: nextUid('fzl'),
            round,
            text: `${card.name} falhou: o alvo já tinha saído.`,
            tone: 'jutsu',
            actor: entry.caster,
          });
          steps.push({ entry, status: 'fizzle', beforeP, beforeE, afterP: nextP, afterE: nextE, fx: { unitFx: {} } });
          continue;
        }

        const res = resolveJutsuEffect(card, entry.caster, entry.targetUid, nextP, nextE, nextArena, round, onEvolve);
        nextP = res.player;
        nextE = res.enemy;
        nextArena = res.arenaId;
        nextPairs = nextPairs.filter((p) => {
          const pool = pendingCombatAttackerSide === 'enemy' ? nextE.board : nextP.board;
          return pool.some((u) => u.uid === p.attackerUid);
        });
        Object.assign(mergedFx.unitFx, res.fx.unitFx);
        if (res.fx.playerGateLabel) mergedFx.playerGateLabel = res.fx.playerGateLabel;
        if (res.fx.enemyGateLabel) mergedFx.enemyGateLabel = res.fx.enemyGateLabel;
        // Só Jutsus de alvo único contam como "anulados" (em área o Contra-Jutsu protege só uma unidade).
        const nullified = card.targetMode !== 'none' && res.logs.some((l) => l.text.includes('Contra-Jutsu'));
        allLogs.push(
          {
            id: nextUid('stkr'),
            round,
            text: nullified ? `${card.name} foi anulado.` : `${card.name} resolveu.`,
            tone: 'jutsu',
            actor: entry.caster,
          },
          ...res.logs
        );
        steps.push({
          entry,
          status: nullified ? 'nullified' : 'ok',
          beforeP,
          beforeE,
          afterP: nextP,
          afterE: nextE,
          fx: res.fx,
        });
      }
      return { steps, nextP, nextE, nextPairs, nextArena, allLogs, mergedFx, evolves };
    },
    [arenaId, round, combatPairs, pendingCombatAttackerSide]
  );

  const applyStackResolution = useCallback(
    (
      res: StackResolution,
      returnPhase: 'MAIN' | 'DECLARE_BLOCK',
      nextTurnAfterStack: 'player' | 'enemy',
      showFx: boolean
    ) => {
      const { nextP, nextE, nextPairs, nextArena, allLogs, mergedFx } = res;
      if (showFx) {
        triggerFX(mergedFx);
        playCombatImpactAudio(mergedFx);
      }
      res.evolves.forEach(([u, c]) => handleEvolutionNotify(u, c));
      setArenaId(nextArena);
      setJutsuStack([]);

      const pendingSide = pendingCombatAttackerSide;
      setPendingCombatAttackerSide(null);

      if (pendingSide === 'player') {
        addLogs(allLogs);
        finalizePlayerAttackCombat(nextPairs, nextP, nextE);
        return;
      }

      if (pendingSide === 'enemy') {
        setPlayer(nextP);
        setEnemy(nextE);
        if (nextPairs.length === 0) {
          setCombatPairs([]);
          setPhase('MAIN');
          setActiveTurn('player');
          addLogs(allLogs);
        } else {
          setCombatPairs(nextPairs);
          setSelectedBlockerUid(null);
          setPhase('DECLARE_BLOCK');
          setActiveTurn('player');
          addLogs([
            ...allLogs,
            {
              id: nextUid('blk'),
              round,
              text: `O oponente atacou com ${nextPairs.length} unidade(s). Arraste quem vai bloquear.`,
              tone: 'combat',
            },
          ]);
        }
        return;
      }

      setPlayer(nextP);
      setEnemy(nextE);
      setCombatPairs(nextPairs);
      setPhase(returnPhase);
      // Correção do travamento "Vez do Rival": se a Pilha foi aberta enquanto você escolhia bloqueadores
      // (Jutsu Rápido/Lento ou Armadilha durante o bloqueio), a vez volta para você terminar os bloqueios.
      // Antes, quando o rival passava, a vez ficava com ele em DECLARE_BLOCK, e a IA não age nessa fase.
      setActiveTurn(returnPhase === 'DECLARE_BLOCK' ? 'player' : nextTurnAfterStack);
      addLogs(allLogs);
    },
    [
      round,
      pendingCombatAttackerSide,
      addLogs,
      handleEvolutionNotify,
      triggerFX,
      playCombatImpactAudio,
      finalizePlayerAttackCombat,
    ]
  );

  /**
   * Resolve a Pilha como no LoR: da mais nova (direita) para a mais antiga, ~2s por item.
   * Cada item brilha, solta o projétil até o alvo, mostra os números e some;
   * se o alvo já saiu, a carta treme, solta fumaça e some sem efeito.
   */
  const resolveStackPresented = useCallback(
    (
      stackToResolve: StackEntry[],
      currPlayer: PlayerState,
      currEnemy: PlayerState,
      returnPhase: 'MAIN' | 'DECLARE_BLOCK',
      nextTurnAfterStack: 'player' | 'enemy'
    ) => {
      if (stackToResolve.length === 0) return;
      const res = computeStackResolution(stackToResolve, currPlayer, currEnemy);
      if (res.steps.length === 0) {
        applyStackResolution(res, returnPhase, nextTurnAfterStack, true);
        return;
      }
      const unitSig = (u: BoardUnit) =>
        [getUnitPower(u), getUnitHealth(u), u.stunned, u.frozen, u.silenced, u.hasBarrier, u.hasSpellShield, u.keywords.join(',')].join('|');
      const items: Cinematic[] = [];
      res.steps.forEach((step, i) => {
        const { entry } = step;
        const c = getCardById(entry.cardId);
        const name = c?.name ?? '';
        const isTrap = entry.kind === 'trap_trigger';
        const stackUid = `stack-${entry.uid}`;
        const before = [...step.beforeP.board, ...step.beforeE.board];
        const after = [...step.afterP.board, ...step.afterE.board];
        const changed = before
          .filter((u) => {
            const a = after.find((x) => x.uid === u.uid);
            return !a || unitSig(a) !== unitSig(u);
          })
          .map((u) => u.uid);
        const onBoard = (uid?: string) => Boolean(uid && before.some((u) => u.uid === uid));
        const target = step.status === 'fizzle' ? undefined : onBoard(entry.targetUid) ? entry.targetUid : changed[0];
        const gateHit =
          step.afterP.hp !== step.beforeP.hp ? 'gate-player' : step.afterE.hp !== step.beforeE.hp ? 'gate-enemy' : undefined;
        const isLast = i === res.steps.length - 1;
        items.push({
          id: cineId('stkA'),
          kind: 'effect',
          side: entry.caster,
          title: `${isTrap ? 'Armadilha resolve' : 'Resolvendo'}: ${name}`,
          text: shortCardText(c),
          originUid: stackUid,
          targetUids: target ? [target] : [],
          projectileTo: step.status === 'ok' ? target ?? gateHit : undefined,
          baseMs: 700,
          onStart: () => setStackFx({ uid: entry.uid, mode: 'glow' }),
        });
        items.push({
          id: cineId('stkB'),
          kind: 'effect',
          side: entry.caster,
          title:
            step.status === 'fizzle'
              ? `${name} falhou: o alvo já tinha saído`
              : step.status === 'nullified'
                ? `Anulado! ${name} bateu no Contra-Jutsu`
                : `${name} resolveu`,
          originUid: stackUid,
          targetUids: step.status === 'fizzle' ? [] : changed,
          baseMs: 1200,
          onStart: () => {
            if (step.status === 'fizzle') {
              setStackFx({ uid: entry.uid, mode: 'fizzle' });
              soundFX.playBlockClang();
              return;
            }
            setStackFx({ uid: entry.uid, mode: 'resolve' });
            setCombatPreview((prev) => {
              const next = { ...prev };
              for (const uid of changed) next[uid] = after.find((u) => u.uid === uid) ?? 'dead';
              return next;
            });
            setGatePreview({ player: currPlayer.hp - step.afterP.hp, enemy: currEnemy.hp - step.afterE.hp });
            triggerFX(step.fx);
            soundFX.playJutsu();
            window.setTimeout(() => playCombatImpactAudio(step.fx), 90);
          },
          onDone: () => {
            setStackGone((prev) => [...prev, entry.uid]);
            setStackFx(null);
            if (isLast) {
              setCombatPreview({});
              setGatePreview({ player: 0, enemy: 0 });
              setStackGone([]);
              applyStackResolution(res, returnPhase, nextTurnAfterStack, false);
            }
          },
        });
      });
      enqueueCine(items);
    },
    [enqueueCine, computeStackResolution, applyStackResolution, triggerFX, playCombatImpactAudio]
  );

  // Cast Jutsu (Imediata/Focada resolves instantly keeping turn; Rápida/Lenta goes on Stack)
  const executeJutsu = useCallback(
    (
      side: 'player' | 'enemy',
      jutsu: JutsuCardDef,
      handIdx: number,
      targetUid: string | undefined,
      pState: PlayerState,
      eState: PlayerState
    ) => {
      let nextP = { ...pState };
      let nextE = { ...eState };

      if (side === 'player') {
        nextP = spendManaForCard(nextP, jutsu, arenaId, handIdx);
        nextP.hand = nextP.hand.filter((_, i) => i !== handIdx);
        nextP.passed = false;
        nextP.cardsPlayedThisRound += 1;
        playerJutsuCountsRef.current[jutsu.id] =
          (playerJutsuCountsRef.current[jutsu.id] || 0) + 1;
      } else {
        nextE = spendManaForCard(nextE, jutsu, arenaId, handIdx);
        nextE.hand = nextE.hand.filter((_, i) => i !== handIdx);
        nextE.passed = false;
        nextE.cardsPlayedThisRound += 1;
      }

      setJutsusCastCount((c) => c + 1);

      const defenderSide: 'player' | 'enemy' = side === 'player' ? 'enemy' : 'player';
      const defenderState = defenderSide === 'player' ? nextP : nextE;
      const matchingTraps = getMatchingTraps('jutsu', defenderState);

      // IMEDIATA or FOCADA: resolves instantly, opponent cannot respond before it, caster keeps turn!
      if (jutsu.speed === 'Imediata' || jutsu.speed === 'Focada') {
        if (
          jutsu.id === 'jutsu_rajada_shuriken' ||
          jutsu.id === 'jutsu_suna_shuriken' ||
          jutsu.id === 'jutsu_lamina_vento'
        ) {
          soundFX.playKunaiDraw();
        } else {
          soundFX.playJutsu();
        }
        const res = resolveJutsuEffect(
          jutsu,
          side,
          targetUid,
          nextP,
          nextE,
          arenaId,
          round,
          handleEvolutionNotify
        );
        triggerFX(res.fx);
        window.setTimeout(() => playCombatImpactAudio(res.fx), 75);
        setArenaId(res.arenaId);
        if (side === 'player') {
          // Instantâneo/Concentrado: flash curto da carta; resolve na hora, mesmo com Pilha pendente.
          enqueueCine([
            {
              id: cineId('imm'),
              kind: 'flash',
              side,
              title: `${SPEED_DISPLAY_NAME[jutsu.speed]}: ${jutsu.name}`,
              cardId: jutsu.id,
              targetUids: targetUid ? [targetUid] : undefined,
              baseMs: 750,
            },
          ]);
        }
        addLogs([
          {
            id: nextUid('imm'),
            round,
            text: `${side === 'player' ? 'Você usou' : 'O oponente usou'} ${jutsu.name}.`,
            tone: 'jutsu',
          },
          ...res.logs,
        ]);

        const postDefState = defenderSide === 'player' ? res.player : res.enemy;
        const postTraps = getMatchingTraps('jutsu', postDefState);
        if (postTraps.length > 0) {
          const chosen =
            chooseBestTrap(postTraps, defenderSide, res.player, res.enemy, [], res.arenaId, round) || postTraps[0];
          const strippedDef = {
            ...postDefState,
            traps: postDefState.traps.filter((t) => t.uid !== chosen.uid),
          };
          const pWithTrap = defenderSide === 'player' ? strippedDef : res.player;
          const eWithTrap = defenderSide === 'player' ? res.enemy : strippedDef;
          const trapEntry: StackEntry = {
            uid: nextUid('trpstk'),
            cardId: chosen.cardId,
            caster: defenderSide,
            kind: 'trap_trigger',
            trapTriggerContext: { eventType: 'jutsu' },
          };
          if (phase !== 'STACK_RESPONSE') {
            setPhaseBeforeStack(phase === 'DECLARE_BLOCK' ? 'DECLARE_BLOCK' : 'MAIN');
          }
          setPlayer(pWithTrap);
          setEnemy(eWithTrap);
          setJutsuStack([...jutsuStack, trapEntry]);
          setPhase('STACK_RESPONSE');
          setActiveTurn(side);
          addLogs([
            {
              id: nextUid('trpq'),
              round,
              text: `Armadilha! ${getCardById(chosen.cardId)?.name} disparou contra ${jutsu.name}.`,
              tone: 'trap',
              actor: defenderSide,
              cardId: chosen.cardId,
              cine: 'trap',
            },
          ]);
          return;
        }

        setPlayer(res.player);
        setEnemy(res.enemy);
        return;
      }

      // RÁPIDA / LENTA: enters Stack, opponent gets response priority
      if (
        jutsu.id === 'jutsu_rajada_shuriken' ||
        jutsu.id === 'jutsu_suna_shuriken' ||
        jutsu.id === 'jutsu_lamina_vento'
      ) {
        soundFX.playKunaiDraw();
      } else {
        soundFX.playSummon();
      }
      const entry: StackEntry = {
        uid: nextUid('stk'),
        cardId: jutsu.id,
        caster: side,
        targetUid,
        kind: 'jutsu',
      };
      let updatedStack = [...jutsuStack, entry];

      if (matchingTraps.length > 0) {
        const chosen =
          chooseBestTrap(matchingTraps, defenderSide, nextP, nextE, [], arenaId, round) || matchingTraps[0];
        if (defenderSide === 'player') {
          nextP = { ...nextP, traps: nextP.traps.filter((t) => t.uid !== chosen.uid) };
        } else {
          nextE = { ...nextE, traps: nextE.traps.filter((t) => t.uid !== chosen.uid) };
        }
        updatedStack = [
          ...updatedStack,
          {
            uid: nextUid('trpstk'),
            cardId: chosen.cardId,
            caster: defenderSide,
            kind: 'trap_trigger',
            trapTriggerContext: { eventType: 'jutsu' },
          },
        ];
        addLogs([
          {
            id: nextUid('trpq'),
            round,
            text: `Armadilha! ${getCardById(chosen.cardId)?.name} disparou contra ${jutsu.name}.`,
            tone: 'trap',
            actor: defenderSide,
            cardId: chosen.cardId,
            cine: 'trap',
          },
        ]);
      }

      if (phase !== 'STACK_RESPONSE') {
        setPhaseBeforeStack(phase === 'DECLARE_BLOCK' ? 'DECLARE_BLOCK' : 'MAIN');
      }
      setPlayer(nextP);
      setEnemy(nextE);
      setJutsuStack(updatedStack);
      setPhase('STACK_RESPONSE');
      setActiveTurn(side === 'player' ? 'enemy' : 'player');
      addLogs([
        {
          id: nextUid('q'),
          round,
          text: `${side === 'player' ? 'Você jogou' : 'O oponente jogou'} ${jutsu.name} — aguardando resposta.`,
          tone: 'jutsu',
        },
      ]);
    },
    [arenaId, round, phase, jutsuStack, addLogs, handleEvolutionNotify, triggerFX, playCombatImpactAudio, enqueueCine]
  );

  // Trigger Attack Declaration
  const triggerAttackDeclaration = useCallback(
    (
      attackerSide: 'player' | 'enemy',
      attackerUids: string[],
      pState: PlayerState,
      eState: PlayerState
    ) => {
      if (attackerUids.length === 0) return;
      soundFX.playStrike();

      let nextP = { ...pState };
      let nextE = { ...eState };
      let pairs: CombatPair[] = attackerUids.map((uid) => ({
        attackerUid: uid,
        blockerUid: null,
      }));
      const newLogs: BattleLogEntry[] = [];

      const applyAttackTriggers = (
        att: PlayerState,
        def: PlayerState
      ): [PlayerState, PlayerState] => {
        let a = { ...att };
        let d = { ...def };
        // Investida / "Ao atacar" dos Ninjas (Grupo 6, ver engine/ninjaEffects.ts).
        {
          const trig = applyNinjaAttackTriggers(attackerUids, attackerSide, a, d, {
            round,
            arenaId,
            logs: newLogs,
            onEvolve: handleEvolutionNotify,
          });
          a = trig.owner;
          d = trig.opp;
          const attDeathRes = processBoardDeaths(a, d, round, arenaId, newLogs, handleEvolutionNotify);
          a = attDeathRes.ownerState;
          d = attDeathRes.oppState;
          pairs = pairs.filter((pr) => a.board.some((u) => u.uid === pr.attackerUid));
        }

        // Habilidades recorrentes (Grupo 4): Investida (ao atacar) dos atacantes declarados.
        {
          const r = runRecurringTrigger('ao_atacar', a, d, {
            round,
            arenaId,
            sourceUids: attackerUids,
            attackerCount: attackerUids.length,
            onEvolve: handleEvolutionNotify,
            logs: newLogs,
          });
          a = r.owner;
          d = r.opp;
          if (r.fired > 0) {
            const own = processBoardDeaths(a, d, round, arenaId, newLogs, handleEvolutionNotify);
            a = own.ownerState;
            d = own.oppState;
          }
        }

        const defDeathRes = processBoardDeaths(d, a, round, arenaId, newLogs, handleEvolutionNotify);
        d = defDeathRes.ownerState;
        a = defDeathRes.oppState;

        // Provocar / Exposto: quem escolhe o bloqueador é sempre o ATACANTE.
        // Humano: escolhe clicando/arrastando no inimigo (stagedChallenges).
        // IA atacante: heurística — prefere um bloqueador que ela abate sem morrer.
        const usedForced = new Set<string>();
        const canBeForced = (du: BoardUnit) =>
          !usedForced.has(du.uid) &&
          !isOutOfCombat(du) &&
          !(!du.silenced && (du.keywords.includes('Não Bloqueia') || du.keywords.includes('Imóvel')));
        for (let i = 0; i < pairs.length; i++) {
          const attUnit = a.board.find((u) => u.uid === pairs[i].attackerUid);
          if (!attUnit) continue;
          const hasProvoke = !attUnit.silenced && attUnit.keywords.includes('Desafiador');
          if (attackerSide === 'player') {
            const forcedId = stagedChallenges[attUnit.uid];
            if (!forcedId) continue;
            const targetDef = d.board.find((du) => du.uid === forcedId && canBeForced(du));
            if (!targetDef) continue;
            const targetExposed = !targetDef.silenced && targetDef.keywords.includes('Vulnerável');
            if (!hasProvoke && !targetExposed) continue;
            usedForced.add(targetDef.uid);
            pairs[i] = { ...pairs[i], blockerUid: targetDef.uid, forced: true };
            newLogs.push({
              id: nextUid('chal'),
              round,
              text: `${getCardById(attUnit.cardId)?.name} usou ${
                hasProvoke ? 'Provocar' : 'Exposto'
              } e forçou ${getCardById(targetDef.cardId)?.name} a bloquear.`,
              tone: 'combat',
            });
            continue;
          }

          // IA atacante
          const attPow = getUnitPower(attUnit);
          const attHp = getUnitHealth(attUnit);
          let bestBlocker: BoardUnit | null = null;
          let bestScore = -Infinity;
          for (const du of d.board) {
            if (!canBeForced(du)) continue;
            const exposed = !du.silenced && du.keywords.includes('Vulnerável');
            if (!hasProvoke && !exposed) continue;
            if (hasProvoke && !exposed && !canBlockAttacker(du, attUnit).ok) continue;
            const kills = !du.hasBarrier && attPow >= getUnitHealth(du);
            const survives = attUnit.hasBarrier || getUnitPower(du) < attHp;
            if (!kills && !survives) continue;
            const value = getUnitPower(du) + getUnitHealth(du);
            const score =
              (kills ? 10 + value : 0) + (survives ? 6 : 0) + (exposed ? 1 : 0) + getUnitPower(du) * 0.5;
            if (score > bestScore) {
              bestScore = score;
              bestBlocker = du;
            }
          }
          if (bestBlocker) {
            usedForced.add(bestBlocker.uid);
            pairs[i] = { ...pairs[i], blockerUid: bestBlocker.uid, forced: true };
            newLogs.push({
              id: nextUid('chal'),
              round,
              text: `${getCardById(attUnit.cardId)?.name} usou ${
                hasProvoke ? 'Provocar' : 'Exposto'
              } e forçou ${getCardById(bestBlocker.cardId)?.name} a bloquear.`,
              tone: 'combat',
            });
          }
        }

        return [a, d];
      };

      if (attackerSide === 'player') {
        [nextP, nextE] = applyAttackTriggers(nextP, nextE);
      } else {
        [nextE, nextP] = applyAttackTriggers(nextE, nextP);
      }

      setHasAttackToken(false);
      setStagedAttackers([]);
      setStagedChallenges({});
      setSelectedChallengerUid(null);

      const defenderSide: 'player' | 'enemy' = attackerSide === 'player' ? 'enemy' : 'player';
      const defenderState = defenderSide === 'player' ? nextP : nextE;
      const matchingTraps = getMatchingTraps('attack', defenderState);

      if (matchingTraps.length > 0 && pairs.length > 0) {
        if (defenderSide === 'player' && matchingTraps.length > 1) {
          setPlayer(nextP);
          setEnemy(nextE);
          setCombatPairs(pairs);
          setPendingTrapChoice({
            eventType: 'attack',
            matchingTraps,
            attackerSide,
            pState: nextP,
            eState: nextE,
            pairs,
            returnPhaseAfterStack: attackerSide === 'enemy' ? 'DECLARE_BLOCK' : 'MAIN',
            returnTurnAfterStack: attackerSide,
            pendingCombatAttackerSide: attackerSide,
            existingStack: jutsuStack,
          });
          addLogs(newLogs);
          return;
        }
        const chosen =
          chooseBestTrap(matchingTraps, defenderSide, nextP, nextE, pairs, arenaId, round, {
            attackerUids: pairs.map((p) => p.attackerUid),
          }) || matchingTraps[0];
        if (defenderSide === 'player') {
          nextP = { ...nextP, traps: nextP.traps.filter((t) => t.uid !== chosen.uid) };
        } else {
          nextE = { ...nextE, traps: nextE.traps.filter((t) => t.uid !== chosen.uid) };
        }
        const trapEntry: StackEntry = {
          uid: nextUid('trpstk'),
          cardId: chosen.cardId,
          caster: defenderSide,
          kind: 'trap_trigger',
          trapTriggerContext: {
            eventType: 'attack',
            attackerUids: pairs.map((p) => p.attackerUid),
          },
        };
        setPlayer(nextP);
        setEnemy(nextE);
        setCombatPairs(pairs);
        setPhaseBeforeStack(attackerSide === 'enemy' ? 'DECLARE_BLOCK' : 'MAIN');
        setPendingCombatAttackerSide(attackerSide);
        setJutsuStack([...jutsuStack, trapEntry]);
        setPhase('STACK_RESPONSE');
        setActiveTurn(attackerSide);
        addLogs([
          ...newLogs,
          {
            id: nextUid('trpq'),
            round,
            text: `Armadilha! ${getCardById(chosen.cardId)?.name} disparou porque ${
              pairs.map((p) => getCardById((attackerSide === 'player' ? nextP : nextE).board.find((u) => u.uid === p.attackerUid)?.cardId ?? '')?.name).filter(Boolean).join(', ') || 'o rival'
            } atacou.`,
            tone: 'trap',
            actor: defenderSide,
            cardId: chosen.cardId,
            cine: 'trap',
          },
        ]);
        return;
      }

      if (pairs.length === 0) {
        setPlayer(nextP);
        setEnemy(nextE);
        setPhase('MAIN');
        setActiveTurn(attackerSide === 'player' ? 'enemy' : 'player');
        addLogs(newLogs);
        return;
      }

      if (attackerSide === 'player') {
        finalizePlayerAttackCombat(pairs, nextP, nextE, newLogs);
      } else {
        setPlayer(nextP);
        setEnemy(nextE);
        setCombatPairs(pairs);
        setSelectedBlockerUid(null);
        setPhase('DECLARE_BLOCK');
        setActiveTurn('player');
        addLogs([
          ...newLogs,
          {
            id: nextUid('blk'),
            round,
            text: `O oponente atacou com ${pairs.length} unidade(s). Arraste quem vai bloquear.`,
            tone: 'combat',
          },
        ]);
      }
    },
    [
      arenaId,
      round,
      stagedChallenges,
      jutsuStack,
      addLogs,
      handleEvolutionNotify,
      finalizePlayerAttackCombat,
    ]
  );

  const confirmTrapChoice = useCallback(
    (chosenSlot: TrapSlot) => {
      if (!pendingTrapChoice) return;
      const {
        eventType,
        attackerSide,
        pState,
        eState,
        pairs,
        summonedUnitUid,
        returnPhaseAfterStack,
        pendingCombatAttackerSide: nextPendingCombat,
        existingStack,
      } = pendingTrapChoice;

      const nextP: PlayerState = {
        ...pState,
        traps: pState.traps.filter((t) => t.uid !== chosenSlot.uid),
      };
      const trapEntry: StackEntry = {
        uid: nextUid('trpstk'),
        cardId: chosenSlot.cardId,
        caster: 'player',
        kind: 'trap_trigger',
        trapTriggerContext: {
          eventType,
          attackerUids: pairs.map((p) => p.attackerUid),
          summonedUnitUid,
        },
      };

      setPendingTrapChoice(null);
      setPlayer(nextP);
      setEnemy(eState);
      setCombatPairs(pairs);
      setPhaseBeforeStack(returnPhaseAfterStack);
      if (nextPendingCombat) setPendingCombatAttackerSide(nextPendingCombat);
      setJutsuStack([...existingStack, trapEntry]);
      setPhase('STACK_RESPONSE');
      setActiveTurn(attackerSide);
      addLogs([
        {
          id: nextUid('trpchoose'),
          round,
          text: `Você ativou ${getCardById(chosenSlot.cardId)?.name}. A outra armadilha segue escondida.`,
          tone: 'trap',
        },
      ]);
    },
    [pendingTrapChoice, round, addLogs]
  );

  // Assign blocker
  const assignBlockerToAttacker = useCallback(
    (blockerUid: string, attackerUid: string) => {
      const attUnit = enemy.board.find((u) => u.uid === attackerUid);
      const blkUnit = player.board.find((u) => u.uid === blockerUid);
      if (!attUnit || !blkUnit) return;

      const check = canBlockAttacker(blkUnit, attUnit);
      if (!check.ok) {
        setBlockNotice(check.reason || 'Bloqueio inválido.');
        addLogs([
          {
            id: nextUid('blkerr'),
            round,
            text: check.reason || 'Bloqueio inválido.',
            tone: 'info',
          },
        ]);
        return;
      }

      const lockedPair = combatPairs.find(
        (p) => p.forced && (p.attackerUid === attackerUid || p.blockerUid === blockerUid)
      );
      if (lockedPair) {
        addLogs([
          {
            id: nextUid('blkerr'),
            round,
            text: 'Este bloqueio foi forçado pelo atacante e não pode ser trocado.',
            tone: 'info',
          },
        ]);
        setBlockNotice('Este bloqueio foi forçado pelo atacante e não pode ser trocado.');
        return;
      }

      soundFX.playBlockClang();
      setCombatPairs((prev) =>
        prev.map((p) => {
          if (p.attackerUid === attackerUid) return { ...p, blockerUid };
          if (p.blockerUid === blockerUid) return { ...p, blockerUid: null };
          return p;
        })
      );
      setSelectedBlockerUid(null);
    },
    [enemy.board, player.board, combatPairs, addLogs, round]
  );

  const unassignBlocker = useCallback((blockerUid: string) => {
    setCombatPairs((prev) =>
      prev.map((p) => (p.blockerUid === blockerUid && !p.forced ? { ...p, blockerUid: null } : p))
    );
  }, []);

  // SINGLE TURN BUTTON: "Passar Turno" handles Stack, Block Resolution, Staged Attacks, and Turn Passing!
  const handlePassTurnButton = () => {
    if (isBusy || activeTurn !== 'player' || phase === 'GAME_OVER' || phase === 'MULLIGAN' || pendingTrapChoice) {
      return;
    }
    setPendingCast(null);

    // 1. If resolving the Jutsu Stack:
    if (phase === 'STACK_RESPONSE') {
      resolveStackPresented(jutsuStack, player, enemy, phaseBeforeStack, 'player');
      return;
    }

    // 2. If defending against enemy attack, resolve combat naturally!
    if (phase === 'DECLARE_BLOCK') {
      const pairsNow = combatPairs;
      const pNow = player;
      const eNow = enemy;
      enqueueCine(
        buildCombatCinematics(pairsNow, 'enemy', pNow, eNow, (resolved) => {
      setPlayer(resolved.player);
      setEnemy(resolved.enemy);
      setCombatPairs([]);
      setSelectedBlockerUid(null);
      if (resolved.rallyGranted) setHasAttackToken(true);
      setPhase('MAIN');
      setActiveTurn('player');
      addLogs(resolved.logs);
        })
      );
      return;
    }

    // 3. If player staged attackers in Combat Zone, launch attack!
    if (stagedAttackers.length > 0 && attackTokenOwner === 'player' && hasAttackToken) {
      triggerAttackDeclaration('player', stagedAttackers, player, enemy);
      return;
    }

    // 4. Pass priority / End round if enemy already passed
    const nextP = { ...player, passed: true };
    setPlayer(nextP);
    addLogs([{ id: nextUid('ppass'), round, text: 'Você passou.', tone: 'info', actor: 'player' }]);
    if (enemy.passed) {
      endRoundFlow(nextP, enemy);
    } else {
      setActiveTurn('enemy');
    }
  };

  // Click Hand Card
  const handleHandCardClick = (cardId: string, idx: number) => {
    if (isBusy) return;
    if (activeTurn !== 'player' || phase === 'GAME_OVER' || phase === 'MULLIGAN' || pendingTrapChoice) {
      return;
    }
    const card = getCardById(cardId);
    if (!card) return;
    setInspected({ card });
    const blockReason = getUnplayableReason(card, player, arenaId, idx);
    if (blockReason) {
      setBlockNotice(blockReason);
      return;
    }

    if (card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token') {
      if (phase !== 'MAIN' || jutsuStack.length > 0) return;
      executeSummon('player', card, idx, player, enemy);
      return;
    }

    if (card.kind === 'armadilha') {
      if (phase !== 'MAIN' || jutsuStack.length > 0) return;
      executeArmTrap('player', card, idx, player, enemy);
      return;
    }

    if (card.kind === 'equipamento') {
      if (phase !== 'MAIN' || jutsuStack.length > 0 || player.board.length === 0) return;
      setPendingCast({ card, handIndex: idx });
      return;
    }

    if (card.kind === 'jutsu') {
      const canPlayInCurrentPhase =
        card.speed === 'Imediata' ||
        card.speed === 'Rapida' ||
        ((card.speed === 'Lenta' || card.speed === 'Focada') &&
          phase === 'MAIN' &&
          jutsuStack.length === 0);
      if (!canPlayInCurrentPhase) return;

      if (card.targetMode === 'none') {
        executeJutsu('player', card, idx, undefined, player, enemy);
        return;
      }
      if (card.targetMode === 'ally_unit' && player.board.length === 0) return;
      if (card.targetMode === 'enemy_unit' && enemy.board.length === 0) return;
      setPendingCast({ card, handIndex: idx });
    }
  };

  const assignChallengeTarget = useCallback(
    (attackerUid: string, enemyUnit: BoardUnit) => {
      const attUnit = player.board.find((u) => u.uid === attackerUid);
      if (!attUnit) return;
      const attCanChallenge = !attUnit.silenced && attUnit.keywords.includes('Desafiador');
      const targetIsVulnerable = !enemyUnit.silenced && enemyUnit.keywords.includes('Vulnerável');
      if (!attCanChallenge && !targetIsVulnerable) return;
      if (
        isOutOfCombat(enemyUnit) ||
        (!enemyUnit.silenced &&
          (enemyUnit.keywords.includes('Não Bloqueia') || enemyUnit.keywords.includes('Imóvel')))
      ) {
        addLogs([
          {
            id: nextUid('chalerr'),
            round,
            text: 'Essa unidade não pode ser forçada a bloquear agora.',
            tone: 'info',
          },
        ]);
        return;
      }
      soundFX.playKunaiDraw();
      setStagedChallenges((prev) => {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v !== enemyUnit.uid) next[k] = v;
        }
        next[attackerUid] = enemyUnit.uid;
        return next;
      });
      setSelectedChallengerUid(null);
    },
    [player.board, addLogs, round]
  );

  // Click Board Unit
  const handleBoardUnitClick = (unit: BoardUnit) => {
    if (isBusy) return;
    const def = getCardById(unit.cardId);
    if (def) setInspected({ card: def, unit });
    if (phase === 'MULLIGAN' || pendingTrapChoice) return;

    if (pendingCast) {
      if (pendingCast.card.kind === 'equipamento') {
        if (unit.owner === 'player') {
          executeEquip('player', pendingCast.card, pendingCast.handIndex, unit.uid, player, enemy);
          setPendingCast(null);
        }
        return;
      }
      const mode = pendingCast.card.targetMode;
      if (
        (mode === 'ally_unit' && unit.owner === 'player') ||
        (mode === 'enemy_unit' && unit.owner === 'enemy') ||
        mode === 'any_unit'
      ) {
        executeJutsu('player', pendingCast.card, pendingCast.handIndex, unit.uid, player, enemy);
        setPendingCast(null);
      }
      return;
    }

    if (
      phase === 'MAIN' &&
      activeTurn === 'player' &&
      attackTokenOwner === 'player' &&
      hasAttackToken &&
      unit.owner === 'enemy' &&
      selectedChallengerUid
    ) {
      assignChallengeTarget(selectedChallengerUid, unit);
      return;
    }

    if (
      phase === 'MAIN' &&
      activeTurn === 'player' &&
      attackTokenOwner === 'player' &&
      hasAttackToken &&
      unit.owner === 'player' &&
      canUnitAttack(unit)
    ) {
      if (stagedAttackers.includes(unit.uid)) {
        const canChallenge =
          (!unit.silenced && unit.keywords.includes('Desafiador')) ||
          enemy.board.some((eu) => !eu.silenced && eu.keywords.includes('Vulnerável'));
        if (canChallenge && selectedChallengerUid !== unit.uid) {
          setSelectedChallengerUid(unit.uid);
          return;
        }
        setSelectedChallengerUid(null);
        setStagedAttackers((prev) => prev.filter((id) => id !== unit.uid));
        setStagedChallenges((prev) => {
          const next = { ...prev };
          delete next[unit.uid];
          return next;
        });
        return;
      }
      soundFX.playKunaiDraw();
      setStagedAttackers((prev) => [...prev, unit.uid]);
      return;
    }

    if (phase === 'DECLARE_BLOCK') {
      if (unit.owner === 'player') {
        if (isOutOfCombat(unit)) return;
        setSelectedBlockerUid((prev) => (prev === unit.uid ? null : unit.uid));
      } else if (unit.owner === 'enemy' && selectedBlockerUid) {
        if (combatPairs.some((p) => p.attackerUid === unit.uid)) {
          assignBlockerToAttacker(selectedBlockerUid, unit.uid);
        }
      }
    }
  };

  // Drag & Drop Handlers
  const handleDropOnZone = (
    zone: 'player_board' | 'combat_zone' | 'enemy_gate',
    e: React.DragEvent
  ) => {
    e.preventDefault();
    if (
      isBusy ||
      !dragPayload ||
      activeTurn !== 'player' ||
      phase === 'GAME_OVER' ||
      phase === 'MULLIGAN' ||
      pendingTrapChoice
    ) {
      return;
    }

    if (dragPayload.type === 'hand_card') {
      const card = getCardById(dragPayload.cardId);
      if (!card || !canPayCard(card, player, arenaId, dragPayload.handIndex)) {
        setDragPayload(null);
        return;
      }

      if (
        (card.kind === 'ninja' || card.kind === 'unidade' || card.kind === 'token') &&
        phase === 'MAIN' &&
        jutsuStack.length === 0 &&
        zone === 'player_board'
      ) {
        executeSummon('player', card, dragPayload.handIndex, player, enemy);
      } else if (
        card.kind === 'armadilha' &&
        phase === 'MAIN' &&
        jutsuStack.length === 0
      ) {
        executeArmTrap('player', card, dragPayload.handIndex, player, enemy);
      } else if (card.kind === 'jutsu') {
        const canPlayInPhase =
          card.speed === 'Imediata' ||
          card.speed === 'Rapida' ||
          ((card.speed === 'Lenta' || card.speed === 'Focada') &&
            phase === 'MAIN' &&
            jutsuStack.length === 0);
        if (canPlayInPhase && card.targetMode === 'none') {
          executeJutsu('player', card, dragPayload.handIndex, undefined, player, enemy);
        }
      }
    } else if (dragPayload.type === 'board_unit') {
      const unit = player.board.find((u) => u.uid === dragPayload.unitUid);
      if (!unit) {
        setDragPayload(null);
        return;
      }

      if (phase === 'DECLARE_BLOCK' && zone === 'player_board') {
        unassignBlocker(unit.uid);
      } else if (
        phase === 'MAIN' &&
        attackTokenOwner === 'player' &&
        hasAttackToken &&
        canUnitAttack(unit)
      ) {
        if (zone === 'combat_zone') {
          setStagedAttackers((prev) => (prev.includes(unit.uid) ? prev : [...prev, unit.uid]));
        } else if (zone === 'player_board') {
          setStagedAttackers((prev) => prev.filter((id) => id !== unit.uid));
          setStagedChallenges((prev) => {
            const next = { ...prev };
            delete next[unit.uid];
            return next;
          });
        } else if (zone === 'enemy_gate') {
          // Estilo LoR: soltar no Portão só prepara; o ataque acontece ao clicar "Atacar".
          setStagedAttackers((prev) => (prev.includes(unit.uid) ? prev : [...prev, unit.uid]));
        }
      }
    }

    setDragPayload(null);
  };

  const handleDropOnUnit = (targetUnit: BoardUnit, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      isBusy ||
      !dragPayload ||
      activeTurn !== 'player' ||
      phase === 'GAME_OVER' ||
      phase === 'MULLIGAN' ||
      pendingTrapChoice
    ) {
      return;
    }

    // Soltar sobre uma carta da própria fileira conta como soltar na fileira (a fileira
    // inteira é a zona de drop), exceto para Equipamentos e Jutsus com alvo.
    if (targetUnit.owner === 'player') {
      if (dragPayload.type === 'hand_card') {
        const c = getCardById(dragPayload.cardId);
        const targetsUnit =
          c?.kind === 'equipamento' ||
          (c?.kind === 'jutsu' && c.targetMode !== 'none');
        if (c && !targetsUnit) {
          handleDropOnZone('player_board', e);
          return;
        }
      } else if (dragPayload.type === 'board_unit' && phase !== 'DECLARE_BLOCK') {
        handleDropOnZone(stagedAttackers.includes(targetUnit.uid) ? 'combat_zone' : 'player_board', e);
        return;
      }
    }

    if (dragPayload.type === 'hand_card') {
      const card = getCardById(dragPayload.cardId);
      if (!card || !canPayCard(card, player, arenaId, dragPayload.handIndex)) {
        setDragPayload(null);
        return;
      }

      if (
        card.kind === 'equipamento' &&
        phase === 'MAIN' &&
        jutsuStack.length === 0 &&
        targetUnit.owner === 'player'
      ) {
        executeEquip('player', card, dragPayload.handIndex, targetUnit.uid, player, enemy);
      } else if (card.kind === 'jutsu') {
        const canPlayInPhase =
          card.speed === 'Imediata' ||
          card.speed === 'Rapida' ||
          ((card.speed === 'Lenta' || card.speed === 'Focada') &&
            phase === 'MAIN' &&
            jutsuStack.length === 0);
        if (!canPlayInPhase) {
          setDragPayload(null);
          return;
        }
        if (
          (card.targetMode === 'ally_unit' && targetUnit.owner === 'player') ||
          (card.targetMode === 'enemy_unit' && targetUnit.owner === 'enemy') ||
          card.targetMode === 'any_unit'
        ) {
          executeJutsu('player', card, dragPayload.handIndex, targetUnit.uid, player, enemy);
        } else if (card.targetMode === 'none') {
          executeJutsu('player', card, dragPayload.handIndex, undefined, player, enemy);
        }
      }
    } else if (dragPayload.type === 'board_unit') {
      if (
        phase === 'DECLARE_BLOCK' &&
        targetUnit.owner === 'enemy' &&
        combatPairs.some((p) => p.attackerUid === targetUnit.uid)
      ) {
        assignBlockerToAttacker(dragPayload.unitUid, targetUnit.uid);
      } else if (
        phase === 'MAIN' &&
        attackTokenOwner === 'player' &&
        hasAttackToken &&
        targetUnit.owner === 'enemy'
      ) {
        const attUnit = player.board.find((u) => u.uid === dragPayload.unitUid);
        if (attUnit && canUnitAttack(attUnit)) {
          setStagedAttackers((prev) =>
            prev.includes(attUnit.uid) ? prev : [...prev, attUnit.uid]
          );
          assignChallengeTarget(attUnit.uid, targetUnit);
        }
      }
    }

    setDragPayload(null);
  };

  // ─────────────── IA "humana" ───────────────
  // Uma ação por vez (a vez volta para o jogador depois de cada ação, como no LoR), com tempo
  // de pensar variável, revelação da carta jogada e espera pelas cenas antes de agir.
  useEffect(() => {
    if (
      phase === 'GAME_OVER' ||
      phase === 'MULLIGAN' ||
      pendingTrapChoice ||
      activeTurn !== 'enemy'
    ) {
      setAiThinking(false);
      return;
    }
    if (isBusy || enemyStaging.length > 0) {
      setAiThinking(false);
      return;
    }
    if (phase !== 'STACK_RESPONSE' && phase !== 'MAIN') return;

    const enemyHandItems = enemy.hand.map((id, idx) => ({ card: getCardById(id), idx }));
    const optionCount = enemyHandItems.filter((i) => i.card && canPayCard(i.card, enemy, arenaId, i.idx)).length;
    const complexity: 'simple' | 'normal' | 'complex' =
      phase === 'STACK_RESPONSE' ? 'complex' : optionCount >= 3 ? 'normal' : 'simple';
    setAiThinking(true);

    const reveal = (card: CardDef, onDone: () => void, targetUids?: string[]) =>
      enqueueCine([
        {
          id: cineId('aiplay'),
          kind: 'reveal',
          side: 'enemy',
          title: `Oponente jogou ${card.name}`,
          cardId: card.id,
          text: shortCardText(card),
          targetUids,
          baseMs: 2000,
          onDone,
        },
      ]);
    const passWith = (title: string, onDone: () => void) =>
      enqueueCine([{ id: cineId('aipass'), kind: 'pass', side: 'enemy', title, baseMs: 1000, onDone }]);

    const isHealText = (t: string) => /\bcur(a|ar|ando)\b|recupera/i.test(t);
    const damageOf = (t: string) => {
      const m = t.match(/(\d+)\s+de\s+dano/i);
      return m ? Number(m[1]) : 0;
    };
    /** Escolha ponderada entre as melhores opções (variedade, não 100% determinística). */
    const pickWeighted = <T,>(opts: { score: number; value: T }[]): T | undefined => {
      const sorted = [...opts].sort((x, y) => y.score - x.score).slice(0, 3);
      if (sorted.length === 0) return undefined;
      const top = sorted[0].score;
      const weights = sorted.map((o) => Math.exp((o.score - top) / 1.5));
      const total = weights.reduce((acc, w) => acc + w, 0);
      let r = Math.random() * total;
      for (let i = 0; i < sorted.length; i++) {
        r -= weights[i];
        if (r <= 0) return sorted[i].value;
      }
      return sorted[0].value;
    };

    aiTimerRef.current = window.setTimeout(() => {
      setAiThinking(false);

      // ── Resposta na Pilha: só quando faz sentido (proteger uma unidade alvo do jogador) ──
      if (phase === 'STACK_RESPONSE') {
        const top = jutsuStack[jutsuStack.length - 1];
        const threatened =
          top && top.caster === 'player' && top.targetUid
            ? enemy.board.find((u) => u.uid === top.targetUid)
            : undefined;
        if (threatened) {
          const response = enemyHandItems.find(
            (i): i is { card: JutsuCardDef; idx: number } =>
              i.card?.kind === 'jutsu' &&
              (i.card.speed === 'Rapida' || i.card.speed === 'Imediata') &&
              i.card.targetMode === 'ally_unit' &&
              canPayCard(i.card, enemy, arenaId, i.idx)
          );
          if (response && Math.random() < 0.85) {
            reveal(
              response.card,
              () => executeJutsu('enemy', response.card, response.idx, threatened.uid, player, enemy),
              [threatened.uid]
            );
            return;
          }
        }
        passWith('Oponente passou — a Pilha resolve', () =>
          resolveStackPresented(jutsuStack, player, enemy, phaseBeforeStack, 'enemy')
        );
        return;
      }

      type AiAction = () => void;
      const options: { score: number; value: AiAction }[] = [];

      // Invocar
      if (enemy.board.length < 5) {
        for (const item of enemyHandItems) {
          const c = item.card;
          if (!c || (c.kind !== 'ninja' && c.kind !== 'unidade')) continue;
          if (!canPayCard(c, enemy, arenaId, item.idx)) continue;
          if (c.kind === 'ninja' && enemy.board.some((u) => u.cardId === c.id)) continue; // Ninja Único
          const card = c as NinjaCardDef | UnitCardDef;
          options.push({
            score: 4 + card.cost * 1.2 + Math.random() * 1.5,
            value: () => reveal(card, () => executeSummon('enemy', card, item.idx, player, enemy)),
          });
        }
      }

      // Equipar (numa unidade que não está prestes a cair nem Paralisada)
      for (const item of enemyHandItems) {
        const c = item.card;
        if (c?.kind !== 'equipamento' || !canPayCard(c, enemy, arenaId, item.idx)) continue;
        const target = [...enemy.board]
          .filter((u) => !u.equippedCardId && !u.stunned && getUnitHealth(u) > 1)
          .sort((x, y) => getUnitPower(y) + getUnitHealth(y) - (getUnitPower(x) + getUnitHealth(x)))[0];
        if (!target) continue;
        const eq = c;
        options.push({
          score: 3 + eq.cost + Math.random() * 1.5,
          value: () => reveal(eq, () => executeEquip('enemy', eq, item.idx, target.uid, player, enemy), [target.uid]),
        });
      }

      // Armar Armadilha (fica oculta: não revela o nome)
      if (enemy.traps.length < 2) {
        for (const item of enemyHandItems) {
          const c = item.card;
          if (c?.kind !== 'armadilha' || !canPayCard(c, enemy, arenaId, item.idx)) continue;
          const trap = c;
          options.push({
            score: 2.5 + Math.random() * 2,
            value: () =>
              enqueueCine([
                {
                  id: cineId('aitrap'),
                  kind: 'stage',
                  side: 'enemy',
                  title: 'Oponente armou uma Armadilha oculta',
                  baseMs: 1100,
                  onDone: () => executeArmTrap('enemy', trap, item.idx, player, enemy),
                },
              ]),
          });
          break;
        }
      }

      // Jutsus — evitando jogadas inúteis (curar quem está com Vida cheia, buffar quem vai cair…)
      for (const item of enemyHandItems) {
        const c = item.card;
        if (c?.kind !== 'jutsu' || !canPayCard(c, enemy, arenaId, item.idx)) continue;
        const j = c;
        const heal = isHealText(j.effectText);
        const dmg = damageOf(j.effectText);
        let targetUid: string | undefined;
        let score = 2 + j.cost * 0.8 + Math.random() * 1.5;
        if (j.targetMode === 'enemy_unit' || (j.targetMode === 'any_unit' && !heal)) {
          if (player.board.length === 0) continue;
          const killable = dmg
            ? [...player.board].filter((u) => getUnitHealth(u) <= dmg && !u.hasBarrier && !u.hasSpellShield)
            : [];
          const t = (killable.length ? killable : [...player.board]).sort(
            (x, y) => getUnitPower(y) - getUnitPower(x)
          )[0];
          targetUid = t?.uid;
          if (killable.length) score += 3;
          else if (dmg && t && (t.hasBarrier || t.hasSpellShield)) score -= 3;
        } else if (j.targetMode === 'ally_unit' || j.targetMode === 'any_unit') {
          const allies = enemy.board.filter((u) => !u.stunned);
          if (allies.length === 0) continue;
          if (heal) {
            const hurt = allies.filter((u) => u.health < u.maxHealth).sort((x, y) => x.health - y.health)[0];
            if (!hurt) continue; // curar com Vida cheia = inútil
            targetUid = hurt.uid;
          } else {
            // buff: na unidade mais robusta (não numa que está para cair)
            const t = [...allies]
              .filter((u) => getUnitHealth(u) > 1)
              .sort((x, y) => getUnitHealth(y) + getUnitPower(y) - (getUnitHealth(x) + getUnitPower(x)))[0];
            if (!t) continue;
            targetUid = t.uid;
            score -= 0.5;
          }
        } else if (heal && enemy.hp >= enemy.maxHp && !/unidade|aliad/i.test(j.effectText)) {
          continue; // curar Portão cheio
        }
        const tUid = targetUid;
        options.push({
          score,
          value: () =>
            reveal(j, () => executeJutsu('enemy', j, item.idx, tUid, player, enemy), tUid ? [tUid] : undefined),
        });
      }

      // Atacar: avança as unidades UMA A UMA para a Zona de Combate e depois declara.
      const readyAttackers = enemy.board.filter((u) => canUnitAttack(u));
      if (attackTokenOwner === 'enemy' && hasAttackToken && readyAttackers.length > 0) {
        const strongestBlocker = Math.max(0, ...player.board.map((u) => getUnitPower(u)));
        const attackers = readyAttackers
          .filter(
            (u) =>
              player.board.length === 0 ||
              getUnitPower(u) >= 2 ||
              getUnitHealth(u) > strongestBlocker ||
              Math.random() < 0.25
          )
          .map((u) => u.uid);
        if (attackers.length > 0) {
          options.push({
            score: 3.5 + attackers.length + (player.board.length === 0 ? 3 : 0) + Math.random() * 1.5,
            value: () => {
              const items: Cinematic[] = attackers.map((uid) => ({
                id: cineId('aiatk'),
                kind: 'stage' as const,
                side: 'enemy' as const,
                title: `Oponente avança ${getCardById(enemy.board.find((u) => u.uid === uid)?.cardId ?? '')?.name ?? ''}`,
                originUid: uid,
                baseMs: 650,
                onStart: () => setEnemyStaging((prev) => (prev.includes(uid) ? prev : [...prev, uid])),
              }));
              items.push({
                id: cineId('aiatk'),
                kind: 'stage',
                side: 'enemy',
                title: 'Oponente declarou ataque!',
                baseMs: 700,
                onDone: () => {
                  setEnemyStaging([]);
                  triggerAttackDeclaration('enemy', attackers, player, enemy);
                },
              });
              enqueueCine(items);
            },
          });
        }
      }

      const chosen = pickWeighted(options);
      if (chosen) {
        chosen();
        return;
      }

      // Sem jogada útil: passa a vez (mostrando "Oponente passou").
      passWith('Oponente passou', () => {
        const nextE = { ...enemy, passed: true };
        setEnemy(nextE);
        if (player.passed) {
          addLogs([{ id: nextUid('aipass'), round, text: 'O oponente passou.', tone: 'info', actor: 'enemy' }]);
          endRoundFlow(player, nextE);
        } else {
          setActiveTurn('player');
          addLogs([
            {
              id: nextUid('aipass'),
              round,
              text: 'O oponente passou.',
              tone: 'info',
              actor: 'enemy',
            },
          ]);
        }
      });
    }, thinkDelayMs(complexity) * speedMulRef.current);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [
    activeTurn,
    phase,
    phaseBeforeStack,
    pendingTrapChoice,
    jutsuStack,
    enemy,
    player,
    arenaId,
    attackTokenOwner,
    hasAttackToken,
    round,
    isBusy,
    enemyStaging.length,
    enqueueCine,
    executeSummon,
    executeEquip,
    executeArmTrap,
    executeJutsu,
    resolveStackPresented,
    triggerAttackDeclaration,
    endRoundFlow,
    addLogs,
  ]);

  const activeArena = ARENAS[arenaId];
  const canPlayerAttack =
    phase === 'MAIN' &&
    activeTurn === 'player' &&
    attackTokenOwner === 'player' &&
    hasAttackToken;

  const draggedCard =
    dragPayload?.type === 'hand_card' ? getCardById(dragPayload.cardId) : undefined;
  const isDraggingHandUnit =
    draggedCard?.kind === 'ninja' || draggedCard?.kind === 'unidade';
  const isDraggingEquip = draggedCard?.kind === 'equipamento';
  const isDraggingTrap = draggedCard?.kind === 'armadilha';
  const isDraggingUntargetedJutsu =
    draggedCard?.kind === 'jutsu' && draggedCard.targetMode === 'none';
  const isDraggingAllyUnit = dragPayload?.type === 'board_unit';

  /** Durante o combate par a par, mostra o estado final das unidades que já trocaram golpes. */
  const withPreview = useCallback(
    (u: BoardUnit): BoardUnit => {
      const v = combatPreview[u.uid];
      return v && v !== 'dead' ? v : u;
    },
    [combatPreview]
  );
  const deadPreviewUids = useMemo(
    () => Object.entries(combatPreview).filter(([, v]) => v === 'dead').map(([k]) => k),
    [combatPreview]
  );

  const combatUnitsRaw = useMemo(() => {
    if (combatPairs.length > 0) {
      // Ataque já declarado (de qualquer lado): os atacantes ficam na Zona de Combate
      // enquanto a Pilha/armadilhas resolvem.
      return combatPairs
        .map(
          (p) =>
            enemy.board.find((u) => u.uid === p.attackerUid) ||
            player.board.find((u) => u.uid === p.attackerUid)
        )
        .filter((u): u is BoardUnit => Boolean(u));
    }
    if (enemyStaging.length > 0) {
      return enemyStaging
        .map((uid) => enemy.board.find((u) => u.uid === uid))
        .filter((u): u is BoardUnit => Boolean(u));
    }
    return player.board.filter((u) => stagedAttackers.includes(u.uid));
  }, [combatPairs, enemy.board, player.board, stagedAttackers, enemyStaging]);
  const combatUnits = useMemo(() => combatUnitsRaw.map(withPreview), [combatUnitsRaw, withPreview]);

  const enemyBenchUnits = useMemo(() => {
    if (combatPairs.length === 0 && enemyStaging.length === 0) return enemy.board.map(withPreview);
    const attSet = new Set([...combatPairs.map((p) => p.attackerUid), ...enemyStaging]);
    return enemy.board.filter((u) => !attSet.has(u.uid)).map(withPreview);
  }, [enemy.board, combatPairs, enemyStaging, withPreview]);

  const playerBenchUnits = useMemo(() => {
    const stagedSet = new Set(stagedAttackers);
    // Atacantes já declarados (ataque do jogador aguardando a Pilha/armadilhas) continuam
    // na Zona de Combate: não podem "voltar" para o campo só porque a Pilha mudou.
    const pairAttackers = new Set(combatPairs.map((p) => p.attackerUid));
    return player.board.filter((u) => !stagedSet.has(u.uid) && !pairAttackers.has(u.uid)).map(withPreview);
  }, [player.board, stagedAttackers, combatPairs, withPreview]);

  // Durante o drag a carta em foco não muda (evita o tabuleiro "pular").
  const inspectCard = (card: CardDef, unit?: BoardUnit) => {
    if (dragPayload) return;
    setInspected({ card, unit });
  };

  // Carta em foco: acompanha o estado atual da unidade e é limpa quando ela sai do jogo.
  useEffect(() => {
    const focusedUid = inspected.unit?.uid;
    if (!focusedUid) return;
    const fresh =
      player.board.find((u) => u.uid === focusedUid) ||
      enemy.board.find((u) => u.uid === focusedUid);
    if (!fresh) {
      setInspected({ card: null });
    } else if (fresh !== inspected.unit) {
      setInspected((prev) => (prev.unit?.uid === focusedUid ? { card: prev.card, unit: fresh } : prev));
    }
  }, [player.board, enemy.board, inspected.unit]);

  // Eventos marcados no Registro (armadilha, carta criada, Último Desejo…) viram cenas na fila.
  const seenLogIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!seenLogIdsRef.current) {
      seenLogIdsRef.current = new Set(logs.map((l) => l.id));
      return;
    }
    const seen = seenLogIdsRef.current;
    const items: Cinematic[] = [];
    for (const entry of logs) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      if (!entry.cine) continue;
      const c = entry.cardId ? getCardById(entry.cardId) : undefined;
      items.push({
        id: `cine_${entry.id}`,
        kind: entry.cine === 'created' ? 'created' : entry.cine === 'trap' ? 'trap' : entry.cine === 'stack' ? 'stack' : 'effect',
        side: entry.actor ?? 'system',
        title:
          entry.cine === 'trap'
            ? `Armadilha! ${c?.name ?? ''}`
            : entry.cine === 'created'
              ? 'Carta criada na mão'
              : c?.name ?? 'Efeito',
        cardId: entry.cardId,
        text:
          entry.cine === 'trap'
            ? `${c?.name ?? 'Armadilha'} — ${entry.text.replace(/^Armadilha!\s*.*?\bdisparou\s*/u, '').replace(/\.$/, '') || 'disparou'}`
            : entry.text,
        originUid: entry.originUid,
        targetUids: entry.targetUids,
        baseMs: entry.cine === 'trap' ? 1700 : entry.cine === 'created' ? 1200 : 1500,
      });
    }
    enqueueCine(items);
  }, [logs, enqueueCine]);

  // Banner breve a cada mudança de vez/fase (overlay, não empurra nada).
  const bannerKey = `${phase}|${activeTurn}|${combatPairs.length > 0 ? 'c' : ''}`;
  const lastBannerKeyRef = useRef('');
  useEffect(() => {
    if (phase === 'MULLIGAN' || phase === 'GAME_OVER') return;
    // Espera as cenas terminarem: o aviso aparece quando a prioridade realmente volta.
    if (isBusy) return;
    if (lastBannerKeyRef.current === bannerKey) return;
    lastBannerKeyRef.current = bannerKey;
    let text = '';
    let tone: 'player' | 'enemy' | 'combat' | 'stack' = 'player';
    if (phase === 'DECLARE_BLOCK') {
      text = 'Oponente atacou — escolha bloqueadores';
      tone = 'combat';
    } else if (phase === 'STACK_RESPONSE') {
      text = activeTurn === 'player' ? 'Pilha: você pode responder' : 'Pilha: oponente pode responder';
      tone = 'stack';
    } else if (phase === 'MAIN') {
      text = activeTurn === 'player' ? 'Sua Ação' : 'Ação do oponente';
      tone = activeTurn === 'player' ? 'player' : 'enemy';
    }
    if (!text) return;
    setPhaseBanner({ id: nextUid('banner'), text, tone });
  }, [bannerKey, phase, activeTurn, isBusy]);
  useEffect(() => {
    if (!phaseBanner) return;
    const id = phaseBanner.id;
    const t = window.setTimeout(
      () => setPhaseBanner((b) => (b?.id === id ? null : b)),
      1500 * speedMulRef.current
    );
    return () => window.clearTimeout(t);
  }, [phaseBanner]);

  // Registro de Combate: ordem cronológica, rola sozinho para a entrada mais nova.
  const logScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = logScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  // Mão em leque: mede a largura disponível para calcular a sobreposição.
  const handRowRef = useRef<HTMLDivElement | null>(null);
  const [handRowWidth, setHandRowWidth] = useState(900);
  useEffect(() => {
    const el = handRowRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setHandRowWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Tabuleiro responsivo: mede a coluna central e calcula a escala das cartas (zoom) para caber sem rolagem.
  const centerRef = useRef<HTMLDivElement | null>(null);
  const [centerSize, setCenterSize] = useState({ w: 900, h: 744 });
  useEffect(() => {
    const el = centerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width && r.height) setCenterSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Painéis laterais (Registro à esquerda, Carta em Foco à direita): abertos em telas largas, recolhidos nas pequenas.
  const [leftOpen, setLeftOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1280);
  const [rightOpen, setRightOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1180);
  const visibleStack = jutsuStack.filter((e) => !stackGone.includes(e.uid));

  // Botão principal único (estilo LoR): o texto diz sempre o que acontece ao clicar.
  const mainAction: {
    label: string;
    sub?: string;
    tone: 'amber' | 'red' | 'sky' | 'green' | 'gray' | 'violet';
    disabled: boolean;
    glow?: boolean;
    dropTarget?: boolean;
    /** Anel de timer (vez do rival). */
    ring?: boolean;
  } = (() => {
    if (phase === 'MULLIGAN') return { label: 'Aguarde', tone: 'gray', disabled: true };
    if (phase === 'GAME_OVER') return { label: 'Fim de jogo', tone: 'gray', disabled: true };
    if (roundEnding) return { label: 'Fim de rodada', sub: 'os dois passaram', tone: 'green', disabled: true };
    if (activeTurn !== 'player') return { label: 'Vez do Rival', tone: 'gray', disabled: true, ring: true };
    if (draggedCard && !isBusy) {
      if (draggedCard.kind === 'ninja' || draggedCard.kind === 'unidade' || draggedCard.kind === 'token')
        return { label: 'Invocar', sub: 'solte aqui ou no campo', tone: 'sky', disabled: false, dropTarget: true };
      if (draggedCard.kind === 'armadilha')
        return { label: 'Armar', sub: 'solte aqui', tone: 'violet', disabled: false, dropTarget: true };
      if (draggedCard.kind === 'jutsu' && draggedCard.targetMode === 'none')
        return { label: 'Conjurar', sub: 'solte aqui', tone: 'sky', disabled: false, dropTarget: true };
      return { label: 'Solte no alvo', tone: 'gray', disabled: true };
    }
    const blocked = isBusy || Boolean(pendingTrapChoice);
    if (phase === 'STACK_RESPONSE') {
      // LoR: rival lançou → "Resolver" (deixar resolver); a minha resposta está no topo → "OK".
      const top = jutsuStack[jutsuStack.length - 1];
      return top?.caster === 'enemy'
        ? { label: 'Resolver', sub: 'deixar a Pilha resolver', tone: 'sky', disabled: blocked, glow: !blocked }
        : { label: 'OK', sub: 'confirmar e resolver', tone: 'sky', disabled: blocked, glow: !blocked };
    }
    if (phase === 'DECLARE_BLOCK') {
      const n = combatPairs.filter((p) => p.blockerUid).length;
      return {
        label: 'Confirmar bloqueio',
        sub: n > 0 ? `${n} bloqueio(s)` : 'sem bloqueio',
        tone: 'red',
        disabled: blocked,
        glow: !blocked,
      };
    }
    if (stagedAttackers.length > 0 && attackTokenOwner === 'player' && hasAttackToken)
      return {
        label: 'Atacar',
        sub: `${stagedAttackers.length} unidade(s)`,
        tone: 'red',
        disabled: blocked,
        glow: !blocked,
      };
    return {
      label: 'Passar',
      sub: enemy.passed ? 'encerra a rodada' : undefined,
      tone: 'amber',
      disabled: blocked,
    };
  })();

  // Escala base das cartas: 84×116 (campo) e 100×140 (mão) multiplicados pelo zoom.
  // Altura: HUDs+faixa da arena+espaços ≈ 160px fixos; fileiras = rival 0.85·116z + combate 116z + seu campo 116z + mão 140z (+84px de bordas e do leque).
  const compactHud = centerSize.h < 720;
  // Textos de HUD/painéis crescem um pouco em telas grandes (1920+).
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const uiZoom = Math.max(1, Math.min(1.45, Math.min(vw / 1600, vh / 900)));
  // HUDs ficam em colunas ao lado do campo rival e da mão: a altura vai quase toda para as cartas.
  const hudW = Math.round(Math.max(200, Math.min(300, centerSize.w * 0.22)) * Math.max(1, uiZoom * 0.9));
  // Altura: 3 espaços + bordas das fileiras + margem do leque ≈ 100px; fileiras = rival 0.85·116z + combate 116z + seu campo 116z + mão 1.1·140z.
  // Em telas baixas o HUD do rival fica largo e baixo (2 colunas) para não roubar altura das cartas.
  const enemyHudCompact = centerSize.h < 700;
  const enemyHudW = enemyHudCompact ? Math.round(hudW * 1.6) : hudW;
  const enemyHudMinH = Math.round((enemyHudCompact ? 110 : 136) * uiZoom);
  const boardZoom = Math.max(
    0.7,
    Math.min(
      3,
      (centerSize.h - 100) / (116 * 0.85 + 116 + 116 + 140 * 1.1),
      // quando a fileira do rival é limitada pela altura mínima do HUD dele
      (centerSize.h - 94 - enemyHudMinH) / (116 + 116 + 140 * 1.1),
      (centerSize.w - enemyHudW - 64) / (420 * 0.85),
      (centerSize.w - 56) / 420,
      (centerSize.w - 160) / 470
    )
  );
  const enemyZoom = boardZoom * 0.85;
  const handZoom = boardZoom * 1.1;
  const enemyRowH = Math.max(Math.round(116 * enemyZoom + 6), enemyHudMinH);
  // Altura que sobra para a fileira da mão; se for baixa, o seu HUD vira 2 colunas (mais largo e mais baixo).
  const handRowH = centerSize.h - 15 - enemyRowH - Math.round(116 * boardZoom + 46) - Math.round(116 * boardZoom + 6);
  const playerHudCompact = handRowH < 235 * uiZoom;
  const HAND_CARD_W = 100 * handZoom;
  const handCount = player.hand.length;
  const handStep =
    handCount <= 1
      ? HAND_CARD_W
      : Math.min(HAND_CARD_W + 8, (handRowWidth - HAND_CARD_W - 8) / (handCount - 1));

  // Arena: só cenário sorteado (sem botão de troca).
  const arenaBannerEl = <ArenaBanner activeArenaId={arenaId} />;

  const enemyVillage = deckVillage(enemyDeckRef.current);
  const playerVillage = deckVillage(playerDeckIds);

  const arenaB4Model = mapBattleToArenaB4({
    player,
    enemy,
    round,
    phase,
    activeTurn,
    combatPairs,
    stagedAttackers,
    enemyStaging,
    jutsuStack: visibleStack,
    gatePreview,
    combatPreview,
    mainActionLabel: mainAction.label.toUpperCase(),
    historicoLines: logs.slice(-12).map((l) => l.text),
    deckTotals: {
      player: playerDeckIds.length,
      enemy: enemyDeckRef.current.length,
    },
  });

  const handleArenaCardClick = (card: ArenaCardRef) => {
    const unit =
      player.board.find((u) => u.uid === card.uid) ||
      enemy.board.find((u) => u.uid === card.uid);
    if (!unit) return;
    handleBoardUnitClick(unit);
  };

  const handleArenaHandClick = (cardId: string, index: number) => {
    handleHandCardClick(cardId, index);
  };

  return (
    <div
      onPointerDown={() => soundFX.ensureMusicRunning(arenaId)}
      className="relative h-[100dvh] w-full overflow-hidden bg-[#05070c] select-none"
      data-battle-arena-b4
    >
      <ArenaB4Screen
        model={arenaB4Model}
        onMainAction={mainAction.disabled ? undefined : handlePassTurnButton}
        onCardClick={handleArenaCardClick}
        onHandCardClick={handleArenaHandClick}
      >
        {evolutionBanner && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-50 max-w-md -translate-x-1/2 animate-level-up">
            <div className="flex items-center gap-3 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 px-6 py-3 shadow-2xl">
              <Sparkles className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <div className="text-[11px] font-semibold text-amber-300">
                  Promovido a {evolutionBanner.rankLabel}
                </div>
                <div className="text-sm font-display font-bold text-white">
                  {evolutionBanner.name} · {evolutionBanner.evolvedTitle}
                </div>
              </div>
            </div>
          </div>
        )}
        {currentCine && (
          <CinematicOverlay
            key={currentCine.id}
            cine={currentCine}
            durationMs={currentCine.baseMs * speedMulRef.current}
            onSkip={() => completeCine(currentCine)}
          />
        )}
        {visibleStack.length > 0 && <StackTargetArrows stack={visibleStack} />}
      </ArenaB4Screen>

      {/* MULLIGAN + SORTEIO MODAL */}
      {phase === 'MULLIGAN' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full rounded-2xl border border-amber-500/40 bg-[#111927] p-6 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Sorteio Inicial:{' '}
                    {coinWinner === 'player'
                      ? 'Você começa com a Ficha de Ataque.'
                      : 'Oponente começa e recebe a Ficha de Ataque na Rodada 1.'}
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-white mt-1">
                  Mulligan — Escolha suas Cartas Iniciais
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique nas cartas que deseja embaralhar de volta no baralho para comprar substitutas (1 vez antes da Rodada 1).
                </p>
              </div>
              <span className="font-mono-num text-xs text-slate-300 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg shrink-0">
                Trocar: {mulliganSelection.length}/5
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap py-2">
              {player.hand.map((cardId, idx) => {
                const card = getCardById(cardId);
                if (!card) return null;
                const marked = mulliganSelection.includes(idx);
                return (
                  <div key={`mull_${cardId}_${idx}`} className="flex flex-col items-center gap-2">
                    <CardView
                      card={card}
                      size="hand"
                      selected={marked}
                      dimmed={marked}
                      onClick={() =>
                        setMulliganSelection((prev) =>
                          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                        )
                      }
                      onInspect={(c) => setInspected({ card: c })}
                    />
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        marked
                          ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {marked ? 'Trocar' : 'Manter'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => confirmMulligan(true)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
              >
                Manter Todas
              </button>
              <button
                type="button"
                onClick={() => confirmMulligan(false)}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {mulliganSelection.length > 0
                  ? `Confirmar Troca (${mulliganSelection.length})`
                  : 'Iniciar Batalha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRAP CHOICE MODAL (When 2 traps share same trigger — owner chooses 1) */}
      {pendingTrapChoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-2xl border border-purple-500/50 bg-[#111927] p-6 shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Limite de 1 Armadilha por Gatilho</span>
              </div>
              <h2 className="text-lg font-display font-bold text-white mt-1">
                Escolha qual Armadilha ativar na Pilha
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                A técnica escolhida será revelada e entrará na Pilha (Rápido). A outra permanecerá oculta.
              </p>
            </div>

            <div className="flex items-center justify-center gap-5 flex-wrap py-2">
              {pendingTrapChoice.matchingTraps.map((slot) => {
                const trapCard = getCardById(slot.cardId);
                if (!trapCard) return null;
                return (
                  <div key={slot.uid} className="flex flex-col items-center gap-2 max-w-[180px]">
                    <CardView
                      card={trapCard}
                      size="hand"
                      playable
                      onClick={() => confirmTrapChoice(slot)}
                      onInspect={(c) => setInspected({ card: c })}
                    />
                    <button
                      type="button"
                      onClick={() => confirmTrapChoice(slot)}
                      className="w-full px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                    >
                      Ativar {trapCard.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / DEFEAT MODAL */}
      {phase === 'GAME_OVER' && (() => {
        const isVictory = enemy.hp <= 0 || Boolean(enemy.deckOut);
        const endReason = enemy.deckOut
          ? 'O baralho adversário esgotou ao tentar comprar! Vitória imediata.'
          : player.deckOut
            ? 'Seu baralho esgotou ao tentar comprar uma carta. Derrota imediata.'
            : isVictory
              ? 'Você rompeu as defesas do Portão adversário e conquistou a arena.'
              : 'Seu Portão caiu. Ajuste sua estratégia e retorne.';
        return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-700 bg-[#111927] p-6 text-center shadow-2xl space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700">
              {isVictory ? (
                <Trophy className="w-7 h-7 text-amber-400" />
              ) : (
                <Skull className="w-7 h-7 text-red-400" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {isVictory ? 'Vitória Shinobi' : 'Derrota no Campo'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{endReason}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-800 text-xs">
              <div>
                <div className="text-slate-400">Duração</div>
                <div className="font-mono-num text-sm font-bold text-white mt-0.5">
                  {formatDuration(lastMatchDuration)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Rodadas</div>
                <div className="font-mono-num text-sm font-bold text-white mt-0.5">{round}</div>
              </div>
              <div>
                <div className="text-slate-400">Promoções</div>
                <div className="font-mono-num text-sm font-bold text-amber-300 mt-0.5">
                  {evolutionsCount}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Jutsus</div>
                <div className="font-mono-num text-sm font-bold text-sky-300 mt-0.5">
                  {jutsusCastCount}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenHistory}
                className="py-2.5 px-3.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={onExitToBuilder}
                className="flex-1 py-2.5 px-3.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
              >
                Ajustar Deck
              </button>
              <button
                type="button"
                onClick={resetMatch}
                className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap"
              >
                Jogar Novamente
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
