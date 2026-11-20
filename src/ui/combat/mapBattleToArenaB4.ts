import { getCardById } from '../../data/cards';
import { getUnitHealth, getUnitPower } from '../../engine/battleEngine';
import type {
  BoardUnit,
  CombatPair,
  Keyword,
  PlayerState,
  StackEntry,
  TurnPhase,
} from '../../types/game';
import { getKeywordLabel } from '../../types/game';
import type { ArenaArrow, ArenaB4Model, ArenaCardRef, FieldCardPreview, PilhaItem } from './types';

function baseStats(cardId: string): { power: number; vitality: number } {
  const card = getCardById(cardId);
  return {
    power: card && 'attack' in card && typeof card.attack === 'number' ? card.attack : 0,
    vitality: card && 'health' in card && typeof card.health === 'number' ? card.health : 0,
  };
}

/** Mapa Keyword do engine → ícone v7o (null = sem ícone no set). */
const V7O_ICON: Partial<Record<Keyword, string>> = {
  'Ataque Rápido': 'golpe-veloz',
  Elusivo: 'furtivo',
  'Visão Aguçada': 'visao-ninja',
  Veneno: 'veneno',
  Formação: 'formacao',
  Sobrepujar: 'perfurante',
};
function keywordVisual(kw: Keyword): { id: string | null; label: string } {
  return {
    id: V7O_ICON[kw] ?? null,
    label: getKeywordLabel(kw).toUpperCase(),
  };
}

function fieldKeywords(unit: BoardUnit): NonNullable<ArenaCardRef['keywords']> {
  const out: NonNullable<ArenaCardRef['keywords']> = [];
  for (const kw of unit.keywords) {
    out.push(keywordVisual(kw));
    if (out.length >= 3) break;
  }
  return out;
}

function toCardRef(
  unit: BoardUnit,
  column: number,
  opts?: { dying?: boolean; previewUnit?: BoardUnit }
): ArenaCardRef {
  const card = getCardById(unit.cardId);
  const base = baseStats(unit.cardId);
  const src = opts?.previewUnit ?? unit;
  const power = getUnitPower(src);
  const vitality = Math.max(0, getUnitHealth(src));
  const dying = opts?.dying || vitality <= 0;
  const preview: FieldCardPreview = {
    power,
    vitality,
    basePower: base.power,
    baseVitality: base.vitality,
    dying,
  };
  return {
    uid: unit.uid,
    cardId: unit.cardId,
    name: card?.name ?? unit.cardId,
    owner: unit.owner,
    cost: card && 'cost' in card ? (card.cost as number) : undefined,
    column,
    keywords: fieldKeywords(src),
    preview,
    dimmed: dying,
  };
}

export interface BattleArenaB4Input {
  player: PlayerState;
  enemy: PlayerState;
  round: number;
  phase: TurnPhase;
  activeTurn: 'player' | 'enemy';
  combatPairs: CombatPair[];
  stagedAttackers: string[];
  enemyStaging: string[];
  jutsuStack: StackEntry[];
  gatePreview: { player: number; enemy: number };
  combatPreview: Record<string, BoardUnit | 'dead'>;
  mainActionLabel: string;
  historicoLines: string[];
  deckTotals: { player: number; enemy: number };
}

/**
 * Mapeia o estado vivo da BattleArena para o modelo visual B4.
 * Rival sempre em cima; eu sempre embaixo.
 */
export function mapBattleToArenaB4(input: BattleArenaB4Input): ArenaB4Model {
  const {
    player,
    enemy,
    round,
    phase,
    activeTurn,
    combatPairs,
    stagedAttackers,
    enemyStaging,
    jutsuStack,
    gatePreview,
    combatPreview,
    mainActionLabel,
    historicoLines,
    deckTotals,
  } = input;

  const findUnit = (uid: string): BoardUnit | undefined =>
    player.board.find((u) => u.uid === uid) || enemy.board.find((u) => u.uid === uid);

  const previewOf = (u: BoardUnit): { unit: BoardUnit; dying: boolean } => {
    const v = combatPreview[u.uid];
    if (v === 'dead') return { unit: u, dying: true };
    if (v) return { unit: v, dying: getUnitHealth(v) <= 0 };
    return { unit: u, dying: false };
  };

  // Atacantes na zona de combate
  let attackerUids: string[] = [];
  if (combatPairs.length > 0) attackerUids = combatPairs.map((p) => p.attackerUid);
  else if (enemyStaging.length > 0) attackerUids = enemyStaging;
  else attackerUids = stagedAttackers;

  const attackerSide: 'player' | 'enemy' | null =
    attackerUids.length === 0
      ? null
      : findUnit(attackerUids[0]!)?.owner ??
        (enemyStaging.length > 0 ? 'enemy' : stagedAttackers.length > 0 ? 'player' : null);

  const rivalCombat: ArenaCardRef[] = [];
  const myCombat: ArenaCardRef[] = [];
  const arrows: ArenaArrow[] = [];

  if (combatPairs.length > 0) {
    combatPairs.forEach((pair, col) => {
      const att = findUnit(pair.attackerUid);
      if (!att) return;
      const { unit: attPv, dying: attDying } = previewOf(att);
      const attRef = toCardRef(att, col, { dying: attDying, previewUnit: attPv });
      if (att.owner === 'enemy') rivalCombat.push(attRef);
      else myCombat.push(attRef);

      if (pair.blockerUid) {
        const blk = findUnit(pair.blockerUid);
        if (blk) {
          const { unit: blkPv, dying: blkDying } = previewOf(blk);
          const blkRef = toCardRef(blk, col, { dying: blkDying, previewUnit: blkPv });
          if (blk.owner === 'enemy') rivalCombat.push(blkRef);
          else myCombat.push(blkRef);
        }
        arrows.push({
          id: `pair-${pair.attackerUid}`,
          fromCol: col,
          direction: att.owner === 'enemy' ? 'down' : 'up',
          who: att.owner,
          blocked: true,
        });
      } else {
        const dmg = getUnitPower(attPv);
        arrows.push({
          id: `pair-${pair.attackerUid}`,
          fromCol: col,
          direction: att.owner === 'enemy' ? 'down' : 'up',
          who: att.owner,
          blocked: false,
          unblockedDamage: dmg,
        });
      }
    });
  } else if (attackerUids.length > 0 && attackerSide) {
    attackerUids.forEach((uid, col) => {
      const att = findUnit(uid);
      if (!att) return;
      const { unit: attPv, dying: attDying } = previewOf(att);
      const ref = toCardRef(att, col, { dying: attDying, previewUnit: attPv });
      if (att.owner === 'enemy') rivalCombat.push(ref);
      else myCombat.push(ref);
      arrows.push({
        id: `stage-${uid}`,
        fromCol: col,
        direction: att.owner === 'enemy' ? 'down' : 'up',
        who: att.owner,
        blocked: false,
        unblockedDamage: getUnitPower(attPv),
      });
    });
  }

  const combatUidSet = new Set([
    ...rivalCombat.map((c) => c.uid),
    ...myCombat.map((c) => c.uid),
  ]);

  const rivalBackrow = enemy.board
    .filter((u) => !combatUidSet.has(u.uid))
    .slice(0, 5)
    .map((u, i) => {
      const { unit: pv, dying } = previewOf(u);
      return toCardRef(u, i, { dying, previewUnit: pv });
    });

  const myBackrow = player.board
    .filter((u) => !combatUidSet.has(u.uid))
    .slice(0, 5)
    .map((u, i) => {
      const { unit: pv, dying } = previewOf(u);
      return toCardRef(u, i, { dying, previewUnit: pv });
    });

  const stackNewestFirst = [...jutsuStack].reverse();
  const pilha: PilhaItem[] = stackNewestFirst.map((entry, i) => {
    const card = getCardById(entry.cardId);
    return {
      uid: entry.uid,
      cardId: entry.cardId,
      name: card?.name ?? entry.cardId,
      owner: entry.caster,
      order: i + 1,
    };
  });

  const rivalPredicted =
    gatePreview.enemy > 0 ? Math.max(0, enemy.hp - gatePreview.enemy) : undefined;
  const myPredicted =
    gatePreview.player > 0 ? Math.max(0, player.hp - gatePreview.player) : undefined;

  const myTurn = activeTurn === 'player' && phase !== 'GAME_OVER';

  return {
    round,
    rivalVitality: { current: enemy.hp, predicted: rivalPredicted },
    myVitality: { current: player.hp, predicted: myPredicted },
    rivalDeck: { remaining: enemy.deck.length, total: deckTotals.enemy },
    myDeck: { remaining: player.deck.length, total: deckTotals.player },
    rivalHandCount: enemy.hand.length,
    myHand: player.hand.slice(0, 9).map((id) => {
      const card = getCardById(id);
      return {
        cardId: id,
        name: card?.name ?? id,
        cost: card && 'cost' in card ? (card.cost as number) : undefined,
      };
    }),
    rivalBackrow,
    myBackrow,
    rivalCombat,
    myCombat,
    rivalOculto: Math.min(3, enemy.traps.length),
    myOculto: Math.min(3, player.traps.length),
    pilha,
    arrows,
    previaLabel:
      Object.keys(combatPreview).length > 0
        ? 'PRÉVIA'
        : 'PRÉVIA - NADA FOI APLICADO',
    myTurn,
    mainActionLabel,
    rivalChakra: { current: enemy.mana, max: enemy.maxMana },
    myChakra: { current: player.mana, max: player.maxMana },
    historicoLines,
    combatBusy: rivalCombat.length + myCombat.length > 0,
  };
}
