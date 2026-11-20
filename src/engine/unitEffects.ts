/**
 * Efeitos das Unidades (Parte 5 · Grupo 7).
 *
 * Funções puras chamadas pelos ganchos que já existem no motor:
 * - Entrada ............ executeSummon (BattleArena)
 * - Antes do golpe ..... resolveCombatPairs (battleEngine): Dosu
 *
 * Merge 4+5+7: os substitutos provisórios saíram.
 * - Formação, Veneno e Parceiro são as palavras-chave do Grupo 5 (engine/keywords.ts).
 * - Início/Fim da rodada, Investida e Último Desejo são dados `recurring` de cada Unidade
 *   (Grupo 4, engine/recurringAbilities.ts), em src/data/units.ts.
 */
import { getCardById, TOKEN_CARDS } from '../data/cards';
import { UNIT_PARTNER_TOKENS } from '../data/units';
import {
  ArenaId,
  BattleLogEntry,
  BoardUnit,
  CombatVisualFX,
  PlayerState,
  UnitCardDef,
} from '../types/game';
import {
  applyDamageToUnit,
  attachEquipmentToUnit,
  createBoardUnit,
  drawCards,
  getUnitHealth,
  getUnitPower,
  healUnit,
  nextUid,
  summonPartner,
  summonUnitByEffect,
} from './battleEngine';
import { MAX_HAND_SIZE } from './limits';

/** Fūma Shuriken: Taijutsu Rápido (Grupo 8). equip_shuriken removido. */
export const FUMA_SHURIKEN_IDS = ['jutsu_fuma_shuriken'] as const;
/**
 * TODO Grupo 8: Espada do Deus do Trovão / Samehada / Pergaminho Proibido / Bastão Adamantino
 * — nomes aprovados, textos NÃO aprovados. Não adicionar cartas.
 */
export const THUNDER_SWORD_ID = 'equip_espada_deus_trovao';

const MAX_HAND = MAX_HAND_SIZE;

type Side = 'player' | 'enemy';

function cardName(id: string): string {
  return getCardById(id)?.name ?? id;
}

function log(
  logs: BattleLogEntry[],
  round: number,
  side: Side,
  cardId: string,
  text: string,
  extra: Partial<BattleLogEntry> = {}
): void {
  logs.push({ id: nextUid('g7'), round, text, tone: 'info', actor: side, cardId, ...extra });
}

function mapUnit(state: PlayerState, uid: string, fn: (u: BoardUnit) => BoardUnit): PlayerState {
  return { ...state, board: state.board.map((u) => (u.uid === uid ? fn(u) : u)) };
}

function summonTokens(
  state: PlayerState,
  tokenId: string,
  count: number,
  side: Side,
  round: number,
  arenaId: ArenaId,
  logs: BattleLogEntry[]
): { state: PlayerState; created: number } {
  const def = TOKEN_CARDS[tokenId];
  let next = state;
  let created = 0;
  if (!def) return { state, created };
  for (let i = 0; i < count; i++) {
    const res = summonUnitByEffect(def, next, side, round, arenaId, logs);
    next = res.ownerState;
    if (res.unit) created += 1;
  }
  return { state: next, created };
}

/** Alvo de dano de Entrada: o inimigo mais forte que morre com o dano; senão, o mais forte. */
function pickDamageTarget(board: BoardUnit[], dmg: number): BoardUnit | undefined {
  if (board.length === 0) return undefined;
  const byPower = [...board].sort((a, b) => getUnitPower(b) - getUnitPower(a));
  return byPower.find((u) => !u.hasBarrier && getUnitHealth(u) <= dmg) ?? byPower[0];
}

function mostInjured(board: BoardUnit[]): BoardUnit | undefined {
  return [...board]
    .filter((u) => u.health < u.maxHealth)
    .sort((a, b) => b.maxHealth - b.health - (a.maxHealth - a.health) || a.health - b.health)[0];
}

function addHandCard(state: PlayerState, cardId: string): PlayerState {
  if (state.hand.length >= MAX_HAND) return state;
  return { ...state, hand: [...state.hand, cardId] };
}

/** Remove a carta da mão no índice, mantendo as marcas de maldição alinhadas. */
function discardAt(state: PlayerState, idx: number): PlayerState {
  const cursed: Record<number, number> = {};
  for (const [k, v] of Object.entries(state.cursedHandIndices ?? {})) {
    const i = Number(k);
    if (i === idx) continue;
    cursed[i > idx ? i - 1 : i] = v;
  }
  return { ...state, hand: state.hand.filter((_, i) => i !== idx), cursedHandIndices: cursed };
}

export interface UnitEntryContext {
  card: UnitCardDef;
  side: Side;
  unitUid: string;
  caster: PlayerState;
  opp: PlayerState;
  round: number;
  arenaId: ArenaId;
  logs: BattleLogEntry[];
  fx: CombatVisualFX;
}

/**
 * Efeito de Entrada das Unidades. Mortes causadas aqui são resolvidas depois por
 * processBoardDeaths (executeSummon já faz isso).
 */
export function applyUnitEntryEffect(ctx: UnitEntryContext): { caster: PlayerState; opp: PlayerState } {
  const { card, side, unitUid, round, arenaId, logs, fx } = ctx;
  let caster = ctx.caster;
  let opp = ctx.opp;
  const self = () => caster.board.find((u) => u.uid === unitUid);
  const damageEnemy = (dmg: number) => {
    const target = pickDamageTarget(opp.board, dmg);
    if (!target) return;
    opp = mapUnit(opp, target.uid, (u) => applyDamageToUnit(u, dmg).unit);
    fx.unitFx[target.uid] = { type: 'hit', label: `-${dmg}` };
  };
  const tokens = (tokenId: string, n: number) => {
    caster = summonTokens(caster, tokenId, n, side, round, arenaId, logs).state;
  };
  /** Parceiro (Grupo 5): o Token acompanha esta Unidade e sai de campo junto com ela. */
  const partner = () => {
    const def = TOKEN_CARDS[UNIT_PARTNER_TOKENS[card.id]];
    if (def) caster = summonPartner(def, caster, unitUid, side, round, arenaId, logs).ownerState;
  };

  switch (card.id) {
    case 'unit_estudante_academia':
      if (caster.board.some((u) => getCardById(u.cardId)?.kind === 'ninja')) {
        caster = mapUnit(caster, unitUid, (u) => ({ ...u, tempAttackBonus: u.tempAttackBonus + 1 }));
        fx.unitFx[unitUid] = { type: 'jutsu', label: '+1/+0' };
      }
      break;
    case 'unit_medico_campo': {
      const hurt = mostInjured(caster.board);
      if (hurt) caster = mapUnit(caster, hurt.uid, (u) => healUnit(u, 2));
      break;
    }
    case 'unit_brigada_marionetes':
      tokens('token_karasu', 1);
      break;
    case 'unit_gozu_meizu':
      damageEnemy(1);
      partner();
      break;
    case 'unit_kotetsu_izumo':
      tokens('token_izumo', 1);
      break;
    case 'unit_ebisu':
      if (
        caster.board.some((u) => getCardById(u.cardId)?.kind === 'ninja' && u.evolutionLevel === 1)
      ) {
        caster = drawCards(caster, 1);
      }
      break;
    case 'unit_gato_bandidos':
      tokens('token_bandido', 2);
      break;
    case 'unit_batedor_areia':
      tokens('token_ninja_areia', 2);
      break;
    case 'unit_batedor_som':
      tokens('token_ninja_som', 1);
      break;
    case 'unit_genin_chuva':
      tokens('token_genin_chuva', 2);
      break;
    case 'unit_mizuki': {
      const idx = caster.deck.findIndex((id) => (FUMA_SHURIKEN_IDS as readonly string[]).includes(id));
      if (idx < 0) break;
      const fumaId = caster.deck[idx];
      const fuma = getCardById(fumaId);
      caster = { ...caster, deck: caster.deck.filter((_, i) => i !== idx) };
      const me = self();
      if (fuma?.kind === 'equipamento' && me) {
        caster = attachEquipmentToUnit(fuma, me, caster).ownerState;
        log(logs, round, side, fumaId, `Mizuki pegou a ${fuma.name} do baralho e a equipou.`, { tone: 'equip' });
      } else if (fuma) {
        // Depois do Grupo 8 (Fūma Shuriken = Taijutsu): vai para a mão.
        caster = addHandCard(caster, fumaId);
        log(logs, round, side, fumaId, `Mizuki pegou a ${fuma.name} do baralho.`);
      }
      break;
    }
    case 'unit_yoroi_misumi':
      partner();
      break;
    case 'unit_ibiki_morino': {
      if (opp.hand.length === 0) break;
      // "À escolha dele": o rival descarta a carta de menor custo (escolha automática).
      let idx = 0;
      let best = Infinity;
      opp.hand.forEach((id, i) => {
        const c = getCardById(id)?.cost ?? 0;
        if (c < best) {
          best = c;
          idx = i;
        }
      });
      const discarded = opp.hand[idx];
      opp = discardAt(opp, idx);
      log(
        logs,
        round,
        side,
        card.id,
        side === 'player'
          ? `Ibiki interrogou o rival: ele descartou ${cardName(discarded)}.`
          : `Ibiki do rival interrogou você: você descartou ${cardName(discarded)}.`,
        { cine: 'effect' }
      );
      break;
    }
    case 'unit_esquadrao_anbu':
      tokens('token_anbu', 1);
      break;
    case 'unit_konohamaru':
      if (caster.board.some((u) => u.cardId === 'naruto_uzumaki')) {
        caster = mapUnit(caster, unitUid, (u) => ({
          ...u,
          tempAttackBonus: u.tempAttackBonus + 1,
          tempHealthBonus: u.tempHealthBonus + 1,
        }));
        fx.unitFx[unitUid] = { type: 'jutsu', label: '+1/+1' };
      }
      break;
    case 'unit_shizune':
      partner();
      break;
    case 'unit_aoi_rokusho':
      if (getCardById(THUNDER_SWORD_ID)) caster = addHandCard(caster, THUNDER_SWORD_ID);
      break;
    case 'unit_sasame_fuma': {
      // Fugaz (Grupo 5): se ainda estiver na mão, some no fim da rodada.
      const fumaId = FUMA_SHURIKEN_IDS.find((id) => getCardById(id));
      if (fumaId && caster.hand.length < MAX_HAND) {
        caster = { ...addHandCard(caster, fumaId), fleetingHand: [...(caster.fleetingHand ?? []), fumaId] };
      }
      break;
    }
    case 'unit_cla_fuma':
      tokens('token_guerreiro_fuma', 2);
      break;
    case 'unit_irmaos_estupidos':
      tokens('token_irmao_estupido', 1);
      break;
    case 'unit_bikochu': {
      const trap = opp.traps[0];
      if (!trap) {
        log(logs, round, side, card.id, 'Bikōchū não farejou nenhum Oculto.');
        break;
      }
      // Só o dono do Bikōchū vê o nome do Oculto.
      log(
        logs,
        round,
        side,
        card.id,
        side === 'player'
          ? `Bikōchū farejou: o rival armou ${cardName(trap.cardId)}.`
          : 'O Bikōchū do rival farejou uma das suos Ocultos.',
        { cine: side === 'player' ? 'effect' : undefined }
      );
      break;
    }
    case 'unit_ranmaru': {
      const raiga = caster.board.find((u) => u.cardId === 'unit_raiga_kurosuki');
      if (raiga) {
        const buff = (u: BoardUnit) => ({ ...u, attack: u.attack + 1, health: u.health + 1, maxHealth: u.maxHealth + 1 });
        caster = mapUnit(mapUnit(caster, unitUid, buff), raiga.uid, buff);
        fx.unitFx[raiga.uid] = { type: 'jutsu', label: '+1/+1' };
        fx.unitFx[unitUid] = { type: 'jutsu', label: '+1/+1' };
      }
      break;
    }
    case 'unit_familia_kurosuki':
      tokens('token_capanga_kurosuki', 2);
      break;
    case 'unit_esquadrao_anbu_elite':
      damageEnemy(2);
      break;
    default:
      break;
  }

  return { caster, opp };
}

/** Antes do golpe do atacante: Dosu causa 1 de dano ao bloqueador. */
export function applyUnitPreStrike(attUnit: BoardUnit, defUnit: BoardUnit): BoardUnit {
  if (attUnit.silenced) return defUnit;
  if (attUnit.cardId === 'unit_dosu_kinuta') return applyDamageToUnit(defUnit, 1).unit;
  return defUnit;
}
