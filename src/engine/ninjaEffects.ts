/**
 * Efeitos por carta dos 34 Ninjas revisados (Parte 5 · Grupo 6).
 *
 * Tudo que é específico de um Ninja (Entrada, Investida, Início/Fim da rodada, Ao bloquear,
 * Ao golpear, Último Desejo, descontos de custo e condições de promoção) fica aqui, para o
 * motor (battleEngine) e a tela (BattleScreen) só chamarem os ganchos.
 *
 * Merge 4+5+6+7: os ganchos aproximados do Grupo 6 viraram as mecânicas reais.
 * - Genjutsu (Kurenai) usa o estado do Grupo 5 (applyGenjutsu); Kai (Sakura) usa applyKai.
 * - Veneno (Kankurō Chuunin) é a palavra-chave Veneno do Grupo 5 (em data/ninjas.ts).
 * - Copiar (Sasuke Chuunin, Kakashi Chuunin) é a palavra-chave do Grupo 5; cada cópia conta
 *   para a promoção (evento 'copy').
 * - Akamaru e Ukon entram como Parceiro (summonPartner do Grupo 5).
 * - Recorrentes simples viraram dados `recurring` (Grupo 4) em data/ninjas.ts: Naruto Jounnin
 *   (Início da rodada), Sakura Chuunin (Fim da rodada), Haku e Tayuya Chuunin (Último Desejo).
 * - Selado "até o fim da rodada" → silenced + marca em ninjaState, limpo no Fim da rodada.
 */
import {
  EQUIPMENT_CARDS,
  JUTSU_CARDS,
  TOKEN_CARDS,
  getCardById,
  getNinjaMaxRank,
  isDeckableCard,
} from '../data/cards';
import {
  type ArenaId,
  type BattleLogEntry,
  type BoardUnit,
  type CardDef,
  type JutsuCardDef,
  type Keyword,
  type NinjaCardDef,
  type PlayerState,
  isOcultoJutsu,
} from '../types/game';
import {
  applyDamageToUnit,
  applyGloomToUnit,
  drawCards,
  evolveUnitIfReady,
  getUnitHealth,
  getUnitPower,
  healUnit,
  nextUid,
  summonPartner,
  summonUnitByEffect,
} from './battleEngine';
import { MAX_HAND_SIZE } from './limits';
import { applyGenjutsu, applyKai, GENJUTSU_UNTIL_KAI, isInGenjutsu, isOutOfCombat } from './keywords';

export type Side = 'player' | 'enemy';

export interface NinjaCtx {
  round: number;
  arenaId: ArenaId;
  logs: BattleLogEntry[];
  onEvolve?: (unit: BoardUnit, card: NinjaCardDef) => void;
}

export interface SidesResult {
  owner: PlayerState;
  opp: PlayerState;
}

/** Facções de Konoha (Hiruzen, Kakashi). */
export const KONOHA_FACTIONS: ReadonlySet<string> = new Set([
  'Time 7',
  'Time 8',
  'Time 9',
  'Time 10',
  'Hokages',
]);

/** "Aliados Taijutsu" de Might Guy: Ninjas de Taijutsu / Punho Gentil. */
export const TAIJUTSU_NINJA_IDS: ReadonlySet<string> = new Set(['rock_lee', 'neji_hyuga', 'hinata_hyuga']);

const QUARTETO_IDS = ['jirobo', 'kidomaru', 'sakon_ukon', 'tayuya'];

// ----------------------------------------------------------------- utilitários

function log(ctx: NinjaCtx, text: string, side?: Side, cardId?: string, tone: BattleLogEntry['tone'] = 'info') {
  ctx.logs.push({ id: nextUid('log'), round: ctx.round, text, tone, actor: side, cardId });
}

function cardName(id: string): string {
  return getCardById(id)?.name ?? id;
}

/** O Ninja está ativo (não Selado) e na patente pedida (exata, se exact). */
function isActive(u: BoardUnit, id: string, level?: 1 | 2 | 3, exact = true): boolean {
  if (u.cardId !== id || u.silenced || getUnitHealth(u) <= 0) return false;
  if (level === undefined) return true;
  return exact ? u.evolutionLevel === level : u.evolutionLevel >= level;
}

function findActive(state: PlayerState, id: string, level?: 1 | 2 | 3, exact = true): BoardUnit | undefined {
  return state.board.find((u) => isActive(u, id, level, exact));
}

function alive(state: PlayerState): BoardUnit[] {
  return state.board.filter((u) => getUnitHealth(u) > 0);
}

function strongest(units: BoardUnit[]): BoardUnit | undefined {
  return [...units].sort((a, b) => getUnitPower(b) - getUnitPower(a) || getUnitHealth(b) - getUnitHealth(a))[0];
}

function weakest(units: BoardUnit[]): BoardUnit | undefined {
  return [...units].sort((a, b) => getUnitPower(a) - getUnitPower(b) || getUnitHealth(a) - getUnitHealth(b))[0];
}

function mostInjured(units: BoardUnit[]): BoardUnit | undefined {
  return [...units]
    .filter((u) => u.health < u.maxHealth)
    .sort((a, b) => b.maxHealth - b.health - (a.maxHealth - a.health))[0];
}

function mapUnit(state: PlayerState, uid: string, fn: (u: BoardUnit) => BoardUnit): PlayerState {
  return { ...state, board: state.board.map((u) => (u.uid === uid ? fn(u) : u)) };
}

function getS(u: BoardUnit, key: string): number {
  return u.ninjaState?.[key] ?? 0;
}

function setS(u: BoardUnit, key: string, value: number): BoardUnit {
  return { ...u, ninjaState: { ...(u.ninjaState ?? {}), [key]: value } };
}

function clearS(u: BoardUnit, key: string): BoardUnit {
  if (!u.ninjaState || !(key in u.ninjaState)) return u;
  const next = { ...u.ninjaState };
  delete next[key];
  return { ...u, ninjaState: next };
}

function addKeyword(u: BoardUnit, kw: Keyword): BoardUnit {
  return u.keywords.includes(kw) ? u : { ...u, keywords: [...u.keywords, kw] };
}

function removeKeyword(u: BoardUnit, kw: Keyword): BoardUnit {
  return { ...u, keywords: u.keywords.filter((k) => k !== kw) };
}

function buffPermanent(u: BoardUnit, atk: number, hp: number): BoardUnit {
  return { ...u, attack: Math.max(0, u.attack + atk), health: u.health + hp, maxHealth: u.maxHealth + hp };
}

function addToHand(state: PlayerState, cardId: string, ctx: NinjaCtx, side: Side, source: string): PlayerState {
  const def = getCardById(cardId);
  if (!def) return state;
  if (state.hand.length >= MAX_HAND_SIZE) {
    log(ctx, `Mão cheia: ${def.name} (de ${source}) foi perdido.`, side);
    return state;
  }
  log(
    ctx,
    side === 'enemy' ? `O oponente ganhou ${def.name} na mão (de ${source}).` : `Você ganhou ${def.name} na mão (de ${source}).`,
    side,
    def.id,
    'jutsu'
  );
  return { ...state, hand: [...state.hand, def.id] };
}

function summonToken(state: PlayerState, tokenId: string, side: Side, ctx: NinjaCtx, source: string): PlayerState {
  const def = TOKEN_CARDS[tokenId];
  if (!def) return state;
  if (state.board.length >= 5) {
    log(ctx, `Campo cheio: ${source} não conseguiu invocar ${def.name}.`, side);
    return state;
  }
  const res = summonUnitByEffect(def, state, side, ctx.round, ctx.arenaId, ctx.logs);
  if (res.unit) log(ctx, `${source} invocou ${def.name}.`, side, def.id);
  return res.ownerState;
}

/** Parceiro (Grupo 5): o Token acompanha o Ninja e sai de campo junto com ele. */
function summonPartnerToken(state: PlayerState, tokenId: string, ninjaUid: string, side: Side, ctx: NinjaCtx, source: string): PlayerState {
  const def = TOKEN_CARDS[tokenId];
  if (!def) return state;
  if (state.board.length >= 5) {
    log(ctx, `Campo cheio: ${source} não conseguiu invocar ${def.name}.`, side);
    return state;
  }
  const res = summonPartner(def, state, ninjaUid, side, ctx.round, ctx.arenaId, ctx.logs);
  if (res.unit) log(ctx, `${source} invocou ${def.name} (Parceiro).`, side, def.id);
  return res.ownerState;
}

/** Selado só até o fim da rodada (Itachi, Neji, Bisturi de Chakra). */
export function sealUntilRoundEnd(u: BoardUnit): BoardUnit {
  if (u.silenced) return u;
  return setS({ ...u, silenced: true }, 'selado_rodada', 1);
}

function randomPick<T>(list: T[]): T | undefined {
  if (list.length === 0) return undefined;
  return list[Math.floor(Math.random() * list.length)];
}

function isWindJutsu(j: CardDef): boolean {
  return j.kind === 'jutsu' && (/F[uū]ton/i.test(j.name) || j.id === 'jutsu_kamaitachi');
}

function isFireJutsu(j: CardDef): boolean {
  return j.kind === 'jutsu' && /Katon/i.test(j.name);
}

// ----------------------------------------------------------------- promoção

export type NinjaProgressEvent =
  | { type: 'attack' }
  | { type: 'damage_dealt'; amount: number }
  | { type: 'kill' }
  | { type: 'block' }
  | { type: 'survive_combat'; as: 'attacker' | 'defender' }
  | { type: 'damaged_survive'; amount: number }
  | { type: 'cast'; jutsu: JutsuCardDef; didDamage: boolean; didHeal: boolean }
  | { type: 'equip' }
  | { type: 'drain'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'exhaust' }
  | { type: 'genjutsu' }
  | { type: 'copy' }
  | { type: 'gate' }
  | { type: 'expand' }
  | { type: 'karasu_strike' }
  | { type: 'barrier_absorb' }
  | { type: 'full' };

/** Quanto vale cada Jutsu Exclusivo para a promoção (padrão 1). */
const SIGNATURE_GAIN: Record<string, Partial<Record<1 | 2, number>>> = {
  naruto_uzumaki: { 1: 6, 2: 2 },
  rock_lee: { 2: 3 },
  shikamaru_nara: { 1: 2 },
  gaara: { 1: 3 },
  temari: { 1: 2 },
};

/**
 * Pontos de promoção que um evento vale para este Ninja, conforme a condição da patente atual
 * (ver levelUpCondition / chuuninLevelUpCondition em data/ninjas.ts).
 */
export function getNinjaProgressGain(unit: BoardUnit, ev: NinjaProgressEvent, owner: PlayerState, opp?: PlayerState): number {
  const def = getCardById(unit.cardId);
  if (!def || def.kind !== 'ninja' || unit.silenced) return 0;
  const lvl = unit.evolutionLevel;
  if (lvl >= getNinjaMaxRank(def)) return 0;
  if (ev.type === 'full') return Math.max(0, unit.evolutionTarget - unit.evolutionProgress);
  const id = unit.cardId;
  const boardHas = (cid: string) => owner.board.some((u) => u.cardId === cid && getUnitHealth(u) > 0);

  let gain = 0;
  if (ev.type === 'cast') {
    const j = ev.jutsu;
    const isSig = def.signatureJutsuId !== '' && j.id === def.signatureJutsuId;
    switch (id) {
      case 'ino_yamanaka':
      case 'tayuya':
      case 'tenten':
      case 'asuma_sarutobi':
      case 'kakashi_hatake':
        // Chuunin → Jounnin é "Copiar 3 Jutsus" (evento 'copy').
        gain = lvl === 1 ? 1 : 0;
        break;
      case 'sakura_haruno':
        gain = lvl === 1 ? 2 : 0;
        break;
      case 'kabuto_yakushi':
        gain = ev.didDamage || ev.didHeal ? 1 : 0;
        break;
      case 'shikamaru_nara':
        gain = j.speed === 'Rapida' ? 1 : 0;
        break;
      case 'shino_aburame':
        gain = j.category === 'Enfraquecer' ? 1 : 0;
        break;
      case 'temari':
        gain = isWindJutsu(j) ? 2 : 0;
        break;
      case 'hiruzen_sarutobi':
        gain = j.name.startsWith('Kuchiyose') || j.category === 'Invocação' ? 1 : 0;
        break;
      case 'itachi_uchiha': {
        const sasukeAround =
          boardHas('sasuke_uchiha') || Boolean(opp?.board.some((u) => u.cardId === 'sasuke_uchiha'));
        gain = isSig && sasukeAround ? 1 : 0;
        break;
      }
      case 'jiraiya':
        gain = ev.didDamage ? 2 : 0;
        break;
      case 'orochimaru':
        gain = j.id === 'jutsu_edo_tensei' || j.id === 'jutsu_manda' ? 1 : 0;
        break;
      case 'tsunade':
        gain = j.category === 'Cura' ? 2 : 0;
        break;
      default:
        gain = 0;
    }
    // Kurenai sobe só por eventos `genjutsu` (Entrada / Magen), não pelo cast do Exclusivo.
    if (isSig && id !== 'kurenai_yuhi') {
      const sigGain = SIGNATURE_GAIN[id]?.[lvl as 1 | 2] ?? 1;
      gain = Math.max(gain, sigGain);
    }
    return gain;
  }

  switch (id) {
    case 'hinata_hyuga':
      if (ev.type === 'block') gain = 1;
      if (ev.type === 'survive_combat' && ev.as === 'attacker') gain = 1;
      break;
    case 'kiba_inuzuka':
      if (ev.type === 'attack' && boardHas('token_akamaru')) gain = 1;
      break;
    case 'rock_lee':
      if (lvl === 1 && ev.type === 'attack') gain = 1;
      if (lvl === 2 && ev.type === 'gate') gain = 1;
      break;
    case 'kakashi_hatake':
      if (lvl === 2 && ev.type === 'copy') gain = 1;
      break;
    case 'sakura_haruno':
      if (ev.type === 'heal') gain = ev.amount;
      break;
    case 'tenten':
      if (ev.type === 'equip') gain = 1;
      break;
    case 'choji_akimichi':
      if (lvl === 1 && ev.type === 'survive_combat') gain = 1;
      if (lvl === 2 && ev.type === 'expand') gain = 1;
      break;
    case 'haku':
      if (ev.type === 'block') gain = 1;
      if (ev.type === 'barrier_absorb') gain = 2;
      break;
    case 'jirobo':
      if (ev.type === 'block') gain = 1;
      break;
    case 'kankuro':
      if (ev.type === 'karasu_strike') gain = 1;
      break;
    case 'kidomaru':
    case 'zabuza_momochi':
      if (ev.type === 'attack') gain = 1;
      break;
    case 'naruto_uzumaki':
      if (lvl === 1 && ev.type === 'damage_dealt') gain = ev.amount;
      if (lvl === 2 && ev.type === 'damaged_survive') gain = 1;
      break;
    case 'sasuke_uchiha':
      if (ev.type === 'kill') gain = 1;
      if (lvl === 2 && ev.type === 'copy') gain = 1;
      break;
    case 'shino_aburame':
      if (ev.type === 'exhaust') gain = 1;
      break;
    case 'temari':
    case 'jiraiya':
      if (ev.type === 'damage_dealt') gain = ev.amount;
      break;
    case 'asuma_sarutobi':
      if (ev.type === 'attack') gain = 1;
      break;
    case 'kurenai_yuhi':
      if (ev.type === 'genjutsu') gain = 1;
      break;
    case 'neji_hyuga':
      if (ev.type === 'damage_dealt' && ev.amount > 0) gain = 1;
      break;
    case 'sakon_ukon':
      if (ev.type === 'survive_combat') gain = 1;
      break;
    case 'gaara':
      if (ev.type === 'barrier_absorb') gain = 1;
      break;
    case 'kisame_hoshigaki':
      if (ev.type === 'drain') gain = ev.amount;
      break;
    case 'might_guy':
      if (ev.type === 'gate') gain = 1;
      break;
    case 'tsunade':
      if (ev.type === 'damaged_survive') gain = ev.amount;
      break;
    default:
      gain = 0;
  }
  return gain;
}

/** Aplica o ganho de promoção a uma unidade (e promove se atingiu a meta). */
export function gainNinjaProgress(
  unit: BoardUnit,
  ev: NinjaProgressEvent,
  owner: PlayerState,
  ctx: Pick<NinjaCtx, 'arenaId' | 'onEvolve'>,
  opp?: PlayerState
): BoardUnit {
  const gain = getNinjaProgressGain(unit, ev, owner, opp);
  if (gain <= 0) return unit;
  return evolveUnitIfReady({ ...unit, evolutionProgress: unit.evolutionProgress + gain }, ctx.arenaId, ctx.onEvolve);
}

/** Aplica o evento a todos os Ninjas do dono (ex.: conjurar um Jutsu). */
export function gainNinjaProgressOnBoard(
  owner: PlayerState,
  ev: NinjaProgressEvent,
  ctx: Pick<NinjaCtx, 'arenaId' | 'onEvolve'>,
  opp?: PlayerState
): PlayerState {
  return { ...owner, board: owner.board.map((u) => gainNinjaProgress(u, ev, owner, ctx, opp)) };
}

function progressOne(owner: PlayerState, uid: string, ev: NinjaProgressEvent, ctx: NinjaCtx, opp?: PlayerState): PlayerState {
  return mapUnit(owner, uid, (u) => gainNinjaProgress(u, ev, owner, ctx, opp));
}

function progressById(owner: PlayerState, cardId: string, ev: NinjaProgressEvent, ctx: NinjaCtx, opp?: PlayerState): PlayerState {
  return {
    ...owner,
    board: owner.board.map((u) => (u.cardId === cardId ? gainNinjaProgress(u, ev, owner, ctx, opp) : u)),
  };
}

// ----------------------------------------------------------------- custo

/**
 * Descontos de custo vindos de Ninjas em campo (somados aos outros; o motor aplica o teto de −2 e o mínimo 1).
 */
export function getNinjaCostDiscount(card: CardDef, owner: PlayerState): number {
  let discount = 0;
  const has = (id: string, level?: 1 | 2 | 3, exact = true) => Boolean(findActive(owner, id, level, exact));
  if (card.kind === 'jutsu') {
    // Kakashi Chuunin: Jutsus custam 1 a menos (evolved = patente 2+; a Jounnin muda a mecânica).
    if (owner.board.some((u) => u.cardId === 'kakashi_hatake' && u.evolved && u.evolutionLevel < 3 && !u.silenced)) {
      discount += 1;
    }
    if (card.id === 'jutsu_gamabunta' && has('jiraiya')) discount += 1;
    if (card.id === 'jutsu_manda' && has('orochimaru', 2)) discount += 2;
    if (card.id === 'jutsu_rasengan' && has('naruto_uzumaki', 3)) discount += 1;
    if (card.id === 'jutsu_edo_tensei' && has('hiruzen_sarutobi', 2)) discount += 1;
    if (card.id === 'jutsu_cho_baika' && has('choji_akimichi', 3)) discount += 2;
  }
  if (card.kind === 'ninja' && TAIJUTSU_NINJA_IDS.has(card.id) && has('might_guy')) discount += 1;
  if (isOcultoJutsu(card) && card.triggerType && has('shikamaru_nara', 2)) discount += 1;
  if (card.kind === 'equipamento' && has('tenten', 2)) discount += 1;
  return discount;
}

// ----------------------------------------------------------------- Entrada

/**
 * Entrada do Ninja (só quando entra como Gennin; voltando numa patente salva, usa a habilidade dela).
 */
export function applyNinjaEntry(
  ninja: NinjaCardDef,
  unitUid: string,
  side: Side,
  owner: PlayerState,
  opp: PlayerState,
  ctx: NinjaCtx
): SidesResult {
  let o = owner;
  let p = opp;
  const self = o.board.find((u) => u.uid === unitUid);
  if (!self || self.silenced) return { owner: o, opp: p };
  const name = ninja.name;
  const isGennin = self.evolutionLevel === 1;

  if (isGennin) {
    switch (ninja.id) {
      case 'hinata_hyuga': {
        const trap = p.traps[0];
        if (trap) {
          const tName = cardName(trap.cardId);
          log(
            ctx,
            side === 'player'
              ? `Byakugan: Hinata viu a carta Oculto ${tName}.`
              : 'Byakugan: Hinata do oponente viu uma das suos Ocultos.',
            side,
            side === 'player' ? trap.cardId : undefined
          );
        }
        break;
      }
      case 'ino_yamanaka': {
        if (p.hand.length > 0) {
          const idx = Math.floor(Math.random() * p.hand.length);
          p = {
            ...p,
            cursedHandIndices: { ...p.cursedHandIndices, [idx]: (p.cursedHandIndices[idx] ?? 0) + 1 },
            cursedUntilRound: ctx.round + 1,
          };
          log(ctx, `Troca de Mente: ${cardName(p.hand[idx])} foi revelada e custa +1 até o fim da próxima rodada.`, side, p.hand[idx]);
        }
        break;
      }
      case 'kiba_inuzuka':
        o = summonPartnerToken(o, 'token_akamaru', unitUid, side, ctx, name);
        break;
      case 'sakura_haruno': {
        const allies = alive(o).filter((u) => u.uid !== unitUid);
        const target =
          allies.find((u) => u.silenced) ?? allies.find((u) => isInGenjutsu(u)) ?? mostInjured(allies);
        if (target) {
          const before = target.health;
          // Kai (Grupo 5): remove Genjutsu e Selado; Paralisia é física e fica.
          o = mapUnit(o, target.uid, (u) => healUnit(clearS(applyKai(u), 'selado_rodada'), 1));
          const after = o.board.find((u) => u.uid === target.uid)?.health ?? before;
          log(ctx, `Kai: Sakura libertou ${cardName(target.cardId)} e curou ${after - before}.`, side, target.cardId);
          if (after > before) o = progressOne(o, unitUid, { type: 'heal', amount: after - before }, ctx);
        }
        break;
      }
      case 'tenten': {
        const pool = EQUIPMENT_CARDS.filter((e) => e.cost <= 2 && isDeckableCard(e));
        const pick = randomPick(pool);
        if (pick) o = addToHand(o, pick.id, ctx, side, name);
        break;
      }
      case 'haku':
        o = summonToken(o, 'token_espelho_gelo', side, ctx, name);
        break;
      case 'jirobo':
        if (o.board.some((u) => u.uid !== unitUid && QUARTETO_IDS.includes(u.cardId))) {
          o = mapUnit(o, unitUid, (u) => buffPermanent(u, 1, 1));
          log(ctx, 'Jirōbō sente o Quarteto do Som por perto: +1/+1.', side, ninja.id);
        }
        break;
      case 'kabuto_yakushi': {
        const t = mostInjured(alive(o));
        if (t) {
          o = mapUnit(o, t.uid, (u) => healUnit(u, 2));
          log(ctx, `Kabuto curou 2 de ${cardName(t.cardId)}.`, side, t.cardId);
        }
        break;
      }
      case 'kankuro':
        o = summonToken(o, 'token_karasu', side, ctx, name);
        break;
      case 'kidomaru': {
        const t = strongest(alive(p));
        if (t) {
          p = mapUnit(p, t.uid, (u) => addKeyword(u, 'Exposto'));
          log(ctx, `Kidōmaru deixou ${cardName(t.cardId)} Exposto.`, side, t.cardId);
        }
        break;
      }
      case 'naruto_uzumaki':
        if (o.board.some((u) => u.uid !== unitUid)) o = summonToken(o, 'token_kage_bunshin', side, ctx, name);
        break;
      case 'shikamaru_nara': {
        const top = o.deck.slice(0, 3);
        if (top.length > 0) {
          let worstIdx = 0;
          top.forEach((cid, i) => {
            const c = getCardById(cid);
            const w = getCardById(top[worstIdx]);
            if ((c?.cost ?? 0) > (w?.cost ?? 0)) worstIdx = i;
          });
          const bottom = top[worstIdx];
          const rest = [...top.slice(0, worstIdx), ...top.slice(worstIdx + 1)];
          o = { ...o, deck: [...rest, ...o.deck.slice(3), bottom] };
          log(
            ctx,
            side === 'player'
              ? `Shikamaru olhou ${top.map(cardName).join(', ')} e colocou ${cardName(bottom)} no fundo do deck.`
              : 'Shikamaru do oponente olhou o topo do deck e colocou 1 carta no fundo.',
            side
          );
        }
        break;
      }
      case 'shino_aburame':
        o = summonToken(o, 'token_enxame', side, ctx, name);
        break;
      case 'tayuya':
        o = summonToken(o, 'token_doki', side, ctx, name);
        break;
      case 'temari': {
        const enemies = alive(p);
        const t = enemies.find((u) => getUnitHealth(u) === 1 && !u.hasBarrier) ?? weakest(enemies);
        if (t) {
          const res = applyDamageToUnit(t, 1);
          p = mapUnit(p, t.uid, () => res.unit);
          log(ctx, `Rajada de vento de Temari: 1 de dano em ${cardName(t.cardId)}.`, side, t.cardId, 'combat');
          if (res.actualDamage > 0) o = progressOne(o, unitUid, { type: 'damage_dealt', amount: res.actualDamage }, ctx);
        }
        break;
      }
      case 'asuma_sarutobi':
        o = addToHand(o, 'equip_laminas_chakra', ctx, side, name);
        break;
      case 'kurenai_yuhi': {
        const t = weakest(alive(p).filter((u) => !isOutOfCombat(u)));
        if (t) {
          p = mapUnit(p, t.uid, (u) => applyGenjutsu(u));
          log(ctx, `Genjutsu de Kurenai: ${cardName(t.cardId)} não ataca nem bloqueia até o fim da próxima rodada (Kai remove).`, side, t.cardId);
          o = progressOne(o, unitUid, { type: 'genjutsu' }, ctx);
        }
        break;
      }
      case 'neji_hyuga': {
        const t = strongest(alive(p));
        if (t && t.hasBarrier) {
          p = mapUnit(p, t.uid, (u) => ({ ...u, hasBarrier: false }));
          log(ctx, `Byakugan de Neji: ${cardName(t.cardId)} perdeu a Esquiva.`, side, t.cardId);
        }
        break;
      }
      case 'sakon_ukon':
        o = summonPartnerToken(o, 'token_ukon', unitUid, side, ctx, name);
        break;
      case 'gaara':
        o = mapUnit(o, unitUid, (u) => ({ ...u, hasBarrier: true }));
        log(ctx, 'Gaara ganhou a Armadura de Areia.', side, ninja.id);
        break;
      case 'hiruzen_sarutobi': {
        const pool = JUTSU_CARDS.filter((j) => j.name.startsWith('Kuchiyose') && isDeckableCard(j));
        const pick = randomPick(pool);
        if (pick) o = addToHand(o, pick.id, ctx, side, name);
        o = {
          ...o,
          board: o.board.map((u) => {
            if (u.uid === unitUid) return u;
            const d = getCardById(u.cardId);
            return d?.kind === 'ninja' && KONOHA_FACTIONS.has(d.faction) ? buffPermanent(u, 1, 1) : u;
          }),
        };
        log(ctx, 'O Terceiro Hokage inspira Konoha: seus Ninjas de Konoha ganham +1/+1.', side, ninja.id);
        break;
      }
      case 'kakashi_hatake': {
        const pool = JUTSU_CARDS.filter(
          (j) => j.speed === 'Rapida' && KONOHA_FACTIONS.has(j.faction) && isDeckableCard(j)
        );
        const pick = randomPick(pool);
        if (pick) o = addToHand(o, pick.id, ctx, side, name);
        break;
      }
      case 'kimimaro':
        o = addToHand(o, 'equip_osso_kaguya', ctx, side, name);
        break;
      case 'kisame_hoshigaki':
        if (p.spellMana > 0) {
          p = { ...p, spellMana: p.spellMana - 1 };
          log(ctx, 'Samehada comeu 1 de Reserva do rival.', side, ninja.id);
          o = progressOne(o, unitUid, { type: 'drain', amount: 1 }, ctx);
        }
        break;
      case 'might_guy': {
        const lee = o.board.find((u) => u.cardId === 'rock_lee');
        if (lee) {
          o = mapUnit(o, lee.uid, (u) => buffPermanent(u, 1, 1));
          log(ctx, 'Guy-sensei e Lee: Rock Lee ganha +1/+1!', side, 'rock_lee');
        }
        break;
      }
      case 'zabuza_momochi':
        o = addToHand(o, 'equip_kubikiribocho', ctx, side, name);
        break;
      case 'itachi_uchiha': {
        const t = strongest(alive(p));
        if (t) {
          p = mapUnit(p, t.uid, sealUntilRoundEnd);
          log(ctx, `Tsukuyomi: ${cardName(t.cardId)} fica Selado até o fim da rodada.`, side, t.cardId);
        }
        break;
      }
      case 'tsunade':
        o = { ...o, hp: Math.min(o.maxHp, o.hp + 4) };
        log(ctx, 'Tsunade curou 4 da Vitalidade.', side, ninja.id, 'info');
        o = addToHand(o, 'jutsu_katsuyu_cura', ctx, side, name);
        break;
      case 'minato_namikaze': {
        const idx = o.board.findIndex((u) => u.uid === unitUid);
        if (idx > 0) {
          const board = [...o.board];
          [board[0], board[idx]] = [board[idx], board[0]];
          o = { ...o, board };
        }
        o = mapUnit(o, unitUid, (u) => ({ ...u, hasBarrier: true }));
        log(ctx, 'Hiraishin: Minato trocou de posição e ganhou Esquiva.', side, ninja.id);
        break;
      }
      default:
        break;
    }
  }

  // Ino promove ao ter Shikamaru ou Chōji em campo (Ino-Shika-Chō).
  o = checkFormationPromotions(o, ctx);
  return { owner: o, opp: p };
}

/** Promoções por presença (Ino com Shikamaru/Chōji). */
function checkFormationPromotions(o: PlayerState, ctx: NinjaCtx): PlayerState {
  const ino = findActive(o, 'ino_yamanaka', 1);
  if (ino && (o.board.some((u) => u.cardId === 'shikamaru_nara') || o.board.some((u) => u.cardId === 'choji_akimichi'))) {
    o = progressOne(o, ino.uid, { type: 'full' }, ctx);
  }
  return o;
}

// ----------------------------------------------------------------- Investida

/**
 * Habilidades "Ao atacar" dos Ninjas, aplicadas na declaração do ataque.
 * Retorna os lados atualizados (o motor processa as mortes depois).
 */
export function applyNinjaAttackTriggers(
  attackerUids: string[],
  side: Side,
  owner: PlayerState,
  opp: PlayerState,
  ctx: NinjaCtx
): SidesResult {
  let o = owner;
  let p = opp;
  const flags = { ...(o.ninjaFlags ?? {}) };
  for (const uid of attackerUids) {
    const u = o.board.find((b) => b.uid === uid);
    if (!u || u.silenced || getUnitHealth(u) <= 0) continue;
    const name = cardName(u.cardId);
    switch (u.cardId) {
      case 'kiba_inuzuka':
        if (u.evolutionLevel === 2 && o.board.some((b) => b.cardId === 'token_akamaru' && getUnitHealth(b) > 0)) {
          p = { ...p, board: p.board.map((e) => applyDamageToUnit(e, 1).unit) };
          log(ctx, 'Gatsūga: Kiba e Akamaru causam 1 de dano a todos os inimigos.', side, u.cardId, 'combat');
        }
        break;
      case 'rock_lee': {
        if (u.evolutionLevel === 2) {
          const gates = Math.min(3, Math.max(0, u.health - 2));
          if (gates > 0) {
            o = mapUnit(o, uid, (x) => ({ ...x, health: x.health - gates, tempAttackBonus: x.tempAttackBonus + gates }));
            for (let i = 0; i < gates; i++) o = progressOne(o, uid, { type: 'gate' }, ctx);
            log(ctx, `Rock Lee abriu ${gates} Portão(ões): -${gates} de Vida, +${gates}/+0 nesta rodada.`, side, u.cardId);
          }
        } else if (u.evolutionLevel === 3 && !flags.lee_portao_morte) {
          const target = strongest(alive(p));
          const needsBurst = !target || getUnitHealth(target) > getUnitPower(u) || p.hp <= getUnitPower(u) + 5;
          if (needsBurst) {
            flags.lee_portao_morte = 1;
            o = mapUnit(o, uid, (x) =>
              setS(addKeyword({ ...x, tempAttackBonus: x.tempAttackBonus + 5 }, 'Perfurante'), 'morre_fim_rodada', 1)
            );
            log(ctx, 'Portão da Morte! Rock Lee ganha +5/+0 e Perfurante, mas morrerá no fim da rodada.', side, u.cardId);
          }
        }
        break;
      }
      case 'choji_akimichi':
        if (u.evolutionLevel === 2) {
          o = mapUnit(o, uid, (x) =>
            setS(addKeyword({ ...x, tempAttackBonus: x.tempAttackBonus + 3 }, 'Indefeso'), 'sem_guarda_ate', ctx.round + 1)
          );
          o = progressOne(o, uid, { type: 'expand' }, ctx);
          log(ctx, 'Baika no Jutsu: Chōji se expande (+3/+0) e não poderá bloquear na próxima rodada.', side, u.cardId);
        }
        break;
      case 'sasuke_uchiha':
        if (u.evolutionLevel === 3 && u.health > 2) {
          o = mapUnit(o, uid, (x) => ({ ...x, health: x.health - 2, tempAttackBonus: x.tempAttackBonus + 3 }));
          log(ctx, 'Selo Amaldiçoado: Sasuke paga 2 de Vida e ganha +3/+0.', side, u.cardId);
        }
        break;
      case 'might_guy':
        if (u.evolutionLevel === 2 && getS(u, 'portoes') < 4 && u.health > 1) {
          o = mapUnit(o, uid, (x) => setS({ ...x, health: x.health - 1, attack: x.attack + 1 }, 'portoes', getS(x, 'portoes') + 1));
          log(ctx, `Guy abriu um Portão (${getS(u, 'portoes') + 1}/4): -1 de Vida, +1/+0 permanente.`, side, u.cardId);
        }
        break;
      case 'itachi_uchiha':
        if (u.evolutionLevel === 2) {
          const t = strongest(alive(p).filter((e) => !e.stunned));
          if (t) {
            p = mapUnit(p, t.uid, (e) => ({ ...e, stunned: true }));
            log(ctx, `Mangekyō: ${cardName(t.cardId)} não pode bloquear.`, side, t.cardId);
          }
          o = mapUnit(o, uid, (x) => ({ ...x, health: x.health - 1 }));
          const sasuke = o.board.find((b) => b.cardId === 'sasuke_uchiha');
          if (sasuke) o = mapUnit(o, sasuke.uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 2 }));
        }
        break;
      case 'naruto_uzumaki': {
        const hinata = findActive(o, 'hinata_hyuga', 2);
        if (hinata && attackerUids.includes(hinata.uid)) {
          o = mapUnit(o, uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 1, tempHealthBonus: x.tempHealthBonus + 1 }));
          log(ctx, 'Hinata apoia Naruto: +1/+1 nesta rodada.', side, 'hinata_hyuga');
        }
        break;
      }
      default:
        void name;
        break;
    }
  }
  o = { ...o, ninjaFlags: flags };
  return { owner: o, opp: p };
}

// ----------------------------------------------------------------- Combate

/** Antes da troca de golpes de um par atacante × bloqueador. */
export function applyNinjaPreStrike(
  att: BoardUnit,
  def: BoardUnit,
  attState: PlayerState,
  defState: PlayerState,
  forced: boolean,
  ctx: NinjaCtx
): { att: BoardUnit; def: BoardUnit; attState: PlayerState; defState: PlayerState } {
  let a = att;
  let d = def;
  let as = attState;
  let ds = defState;
  if (!a.silenced && a.evolutionLevel === 2) {
    if ((a.cardId === 'zabuza_momochi' || a.cardId === 'kisame_hoshigaki') && d.hasBarrier) {
      d = { ...d, hasBarrier: false };
      log(ctx, `${cardName(a.cardId)} anulou a Esquiva de ${cardName(d.cardId)}.`, a.owner, a.cardId);
    }
    if (a.cardId === 'kidomaru' && forced) {
      d = applyGloomToUnit(d, 1);
      log(ctx, `Kidōmaru: ${cardName(d.cardId)} recebe Exaustão (-1/-1).`, a.owner, a.cardId);
    }
  }
  if (!d.silenced && d.evolutionLevel === 2) {
    if (d.cardId === 'gaara') {
      a = applyDamageToUnit(a, 1).unit;
      log(ctx, `Sabaku Taisō: ${cardName(a.cardId)} sofre 1 de dano ao ser bloqueado por Gaara.`, d.owner, d.cardId, 'combat');
    }
    if (d.cardId === 'hinata_hyuga') {
      a = { ...a, attack: Math.max(0, a.attack - 1) };
      log(ctx, `Punho Gentil: ${cardName(a.cardId)} perde 1 de Poder permanente.`, d.owner, d.cardId);
    }
    if (d.cardId === 'haku') {
      const zabuza = ds.board.find((u) => u.cardId === 'zabuza_momochi');
      if (zabuza) {
        ds = mapUnit(ds, zabuza.uid, (z) => ({ ...z, tempAttackBonus: z.tempAttackBonus + 1, tempHealthBonus: z.tempHealthBonus + 1 }));
        log(ctx, 'Haku protege Zabuza: +1/+1 nesta rodada.', d.owner, 'zabuza_momochi');
      }
    }
    if (d.cardId === 'jirobo' && as.spellMana > 0) {
      as = { ...as, spellMana: as.spellMana - 1 };
      log(ctx, 'Jirōbō drenou 1 de Reserva do rival.', d.owner, d.cardId);
    }
  }
  return { att: a, def: d, attState: as, defState: ds };
}

export interface StrikeReport {
  /** Dano causado pelo atacante (unidade ou Vitalidade). */
  damageDealt: number;
  /** Bloqueador morreu. */
  killed: boolean;
  /** Atacante tinha / perdeu Substituição neste combate. */
  attHadBarrier: boolean;
  defHadBarrier: boolean;
  attHealthBefore: number;
  defHealthBefore: number;
}

/**
 * Depois da troca de golpes: Ao golpear, Teimosia, Armadura de Areia e eventos de promoção.
 * def é undefined quando o ataque não foi bloqueado (golpeou a Vitalidade).
 */
export function applyNinjaPostStrike(
  att: BoardUnit,
  def: BoardUnit | undefined,
  attState: PlayerState,
  defState: PlayerState,
  rep: StrikeReport,
  ctx: NinjaCtx
): { att: BoardUnit; def: BoardUnit | undefined; attState: PlayerState; defState: PlayerState } {
  let a = att;
  let d = def;
  let as = attState;
  let ds = defState;
  const defAlive = d ? getUnitHealth(d) > 0 : false;

  // Ao golpear
  if (!a.silenced && a.evolutionLevel === 2 && rep.damageDealt > 0) {
    if (a.cardId === 'neji_hyuga') {
      ds = { ...ds, spellMana: Math.max(0, ds.spellMana - 1) };
      if (d && defAlive) d = sealUntilRoundEnd(d);
      log(ctx, 'Hakke: Neji fecha os tenketsu (rival perde 1 de Reserva e o alvo fica Selado).', a.owner, a.cardId);
    }
    if (a.cardId === 'kisame_hoshigaki' && ds.spellMana > 0) {
      ds = { ...ds, spellMana: ds.spellMana - 1 };
      log(ctx, 'Samehada: o rival perde 1 de Reserva.', a.owner, a.cardId);
    }
  }
  if (a.cardId === 'sasuke_uchiha' && a.evolutionLevel === 3 && !a.silenced && rep.killed) {
    ds = { ...ds, hp: Math.max(0, ds.hp - 2) };
    log(ctx, 'Sasuke abateu e causou 2 de dano à Vitalidade.', a.owner, a.cardId, 'combat');
  }

  // Teimosia (Naruto Chuunin) e Armadura de Areia (Gaara Chuunin) para os dois lados.
  const afterHit = (u: BoardUnit, healthBefore: number, hadBarrier: boolean): BoardUnit => {
    let x = u;
    if (getUnitHealth(x) <= 0 || x.silenced) return x;
    const took = Math.max(0, healthBefore - getUnitHealth(x));
    if (x.cardId === 'naruto_uzumaki' && x.evolutionLevel === 2 && took > 0 && getS(x, 'teimosia') < 3) {
      x = setS({ ...x, attack: x.attack + 1 }, 'teimosia', getS(x, 'teimosia') + 1);
      log(ctx, 'Teimosia: Naruto se levanta mais forte (+1/+0).', x.owner, x.cardId);
    }
    if (x.cardId === 'gaara' && x.evolutionLevel === 2 && hadBarrier && !x.hasBarrier && getS(x, 'areia_rodada') !== ctx.round) {
      x = setS({ ...x, hasBarrier: true }, 'areia_rodada', ctx.round);
      log(ctx, 'A Armadura de Areia de Gaara se refaz.', x.owner, x.cardId);
    }
    return x;
  };
  const attTook = Math.max(0, rep.attHealthBefore - getUnitHealth(a));
  const defTook = d ? Math.max(0, rep.defHealthBefore - getUnitHealth(d)) : 0;
  const attLostBarrier = rep.attHadBarrier && !a.hasBarrier;
  const defLostBarrier = Boolean(d && rep.defHadBarrier && !d.hasBarrier);
  a = afterHit(a, rep.attHealthBefore, rep.attHadBarrier);
  if (d) d = afterHit(d, rep.defHealthBefore, rep.defHadBarrier);

  // Promoção do atacante
  if (getUnitHealth(a) > 0) {
    const evs: NinjaProgressEvent[] = [{ type: 'attack' }];
    if (rep.damageDealt > 0) evs.push({ type: 'damage_dealt', amount: rep.damageDealt });
    if (rep.killed) evs.push({ type: 'kill' });
    if (d) evs.push({ type: 'survive_combat', as: 'attacker' });
    if (attTook > 0) evs.push({ type: 'damaged_survive', amount: attTook });
    if (attLostBarrier) evs.push({ type: 'barrier_absorb' });
    for (const ev of evs) a = gainNinjaProgress(a, ev, as, ctx, ds);
  }
  if (a.cardId === 'token_karasu' && rep.damageDealt > 0) {
    as = progressById(as, 'kankuro', { type: 'karasu_strike' }, ctx);
  }
  // Promoção do bloqueador
  if (d && getUnitHealth(d) > 0) {
    const evs: NinjaProgressEvent[] = [{ type: 'block' }, { type: 'survive_combat', as: 'defender' }];
    if (defTook > 0) evs.push({ type: 'damaged_survive', amount: defTook });
    if (defLostBarrier) evs.push({ type: 'barrier_absorb' });
    for (const ev of evs) d = gainNinjaProgress(d, ev, ds, ctx, as);
  } else if (d) {
    d = gainNinjaProgress(d, { type: 'block' }, ds, ctx, as);
  }
  return { att: a, def: d, attState: as, defState: ds };
}

// ----------------------------------------------------------------- Jutsus

/** Habilidades "Ao conjurar um Jutsu" de Ninjas do conjurador + promoção por conjuração. */
export function applyNinjaCastHooks(
  jutsu: JutsuCardDef,
  side: Side,
  caster: PlayerState,
  opp: PlayerState,
  info: { didDamage: boolean; didHeal: boolean },
  ctx: NinjaCtx
): SidesResult {
  let o = caster;
  let p = opp;
  for (const u of [...o.board]) {
    if (u.silenced || getUnitHealth(u) <= 0 || u.evolutionLevel !== 2) {
      if (u.cardId === 'naruto_uzumaki' && u.evolutionLevel === 3 && !u.silenced && jutsu.id === 'jutsu_rasengan') {
        o = summonToken(o, 'token_kage_bunshin', side, ctx, 'Rasengan');
      }
      continue;
    }
    if (u.cardId === 'tenten') {
      o = mapUnit(o, u.uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 1 }));
    }
    if (u.cardId === 'temari' && isWindJutsu(jutsu)) {
      p = { ...p, board: p.board.map((e) => applyDamageToUnit(e, 1).unit) };
      log(ctx, 'Leque de Temari: 1 de dano a todos os inimigos.', side, u.cardId, 'combat');
    }
    if (u.cardId === 'asuma_sarutobi' && (isWindJutsu(jutsu) || isFireJutsu(jutsu))) {
      o = mapUnit(o, u.uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 1 }));
    }
  }
  o = gainNinjaProgressOnBoard(o, { type: 'cast', jutsu, didDamage: info.didDamage, didHeal: info.didHeal }, ctx, p);
  return { owner: o, opp: p };
}

/** Progresso de Ninjas aliados ao equipar (Tenten Gennin). */
export function applyNinjaEquipHooks(owner: PlayerState, ctx: Pick<NinjaCtx, 'arenaId' | 'onEvolve'>): PlayerState {
  return gainNinjaProgressOnBoard(owner, { type: 'equip' }, ctx);
}

/** Exaustão aplicada por um jogador (Shino Gennin). */
export function applyNinjaExhaustHooks(owner: PlayerState, ctx: Pick<NinjaCtx, 'arenaId' | 'onEvolve'>): PlayerState {
  return gainNinjaProgressOnBoard(owner, { type: 'exhaust' }, ctx);
}

// ----------------------------------------------------------------- Rodada

/** Início da rodada para um lado (depois de zerar os bônus temporários). */
export function applyNinjaRoundStart(side: Side, owner: PlayerState, opp: PlayerState, ctx: NinjaCtx): SidesResult {
  let o = owner;
  let p = opp;
  // Chōji: o "não pode bloquear" da expansão acaba.
  o = {
    ...o,
    board: o.board.map((u) => {
      const until = getS(u, 'sem_guarda_ate');
      if (until && ctx.round > until) {
        const def = getCardById(u.cardId);
        const native = def && def.kind === 'ninja' && def.keywords.includes('Indefeso');
        return clearS(native ? u : removeKeyword(u, 'Indefeso'), 'sem_guarda_ate');
      }
      return u;
    }),
  };
  const flags = { ...(o.ninjaFlags ?? {}) };

  for (const u of [...o.board]) {
    if (u.silenced || getUnitHealth(u) <= 0) continue;
    const lvl = u.evolutionLevel;
    switch (u.cardId) {
      case 'sakura_haruno':
        if (lvl === 3) {
          const t = mostInjured(alive(o));
          if (t) o = mapUnit(o, t.uid, (x) => healUnit(x, 2));
          const naruto = o.board.find((b) => b.cardId === 'naruto_uzumaki');
          if (naruto) o = mapUnit(o, naruto.uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 1 }));
        }
        break;
      case 'kankuro':
        if (lvl === 2) {
          o = { ...o, board: o.board.map((b) => (b.cardId === 'token_karasu' ? { ...b, tempAttackBonus: b.tempAttackBonus + 1 } : b)) };
        }
        break;
      case 'shikamaru_nara':
        if (lvl === 2) {
          const jutsusInHand = o.hand.filter((id) => getCardById(id)?.kind === 'jutsu').length;
          const t = strongest(alive(p));
          if (jutsusInHand >= 2 && t) {
            p = mapUnit(p, t.uid, (x) => ({ ...x, stunned: true }));
            log(ctx, `Kagemane: ${cardName(t.cardId)} fica Paralisado nesta rodada.`, side, t.cardId);
          }
        }
        break;
      case 'shino_aburame':
        if (lvl === 2) {
          const t = strongest(alive(p));
          if (t) {
            p = mapUnit(p, t.uid, (x) => applyGloomToUnit(x, 1));
            log(ctx, `Kikaichū: ${cardName(t.cardId)} recebe Exaustão (-1/-1).`, side, t.cardId);
          }
          o = mapUnit(o, u.uid, (x) => ({ ...x, tempAttackBonus: x.tempAttackBonus + 1 }));
        }
        break;
      case 'kurenai_yuhi':
        if (lvl === 2) {
          const t = strongest(alive(p).filter((x) => !isOutOfCombat(x)));
          if (t) {
            // "Só se libera com Kai": não expira sozinho.
            p = mapUnit(p, t.uid, (x) => applyGenjutsu(x, GENJUTSU_UNTIL_KAI));
            log(ctx, `Genjutsu de Kurenai: ${cardName(t.cardId)} fica preso até alguém usar Kai.`, side, t.cardId);
          }
        }
        break;
      case 'sasuke_uchiha':
        if (lvl === 2 && !u.hasBarrier) {
          o = mapUnit(o, u.uid, (x) => ({ ...x, hasBarrier: true }));
        }
        break;
      case 'choji_akimichi':
        if (lvl === 1 && u.health >= 7) o = progressOne(o, u.uid, { type: 'full' }, ctx);
        break;
      case 'tsunade':
        if (lvl === 2 && !flags.tsunade_byakugo && o.hp <= Math.floor(o.maxHp / 2)) {
          flags.tsunade_byakugo = 1;
          o = { ...o, hp: o.maxHp };
          log(ctx, 'Byakugō no In: Tsunade curou totalmente a Vitalidade!', side, u.cardId, 'info');
        }
        break;
      default:
        break;
    }
  }
  o = { ...o, ninjaFlags: flags };
  o = checkFormationPromotions(o, ctx);
  return { owner: o, opp: p };
}

/** Fim da rodada para um lado (antes de zerar os bônus; as mortes são processadas em seguida). */
export function applyNinjaRoundEnd(side: Side, owner: PlayerState, opp: PlayerState, ctx: NinjaCtx): SidesResult {
  let o = owner;
  let p = opp;
  for (const u of [...o.board]) {
    if (u.silenced || getUnitHealth(u) <= 0) continue;
    const lvl = u.evolutionLevel;
    switch (u.cardId) {
      case 'ino_yamanaka':
        if (lvl === 2 && o.spellsCastThisRound > 0) {
          o = drawCards(o, 1);
          log(ctx, 'Ino comprou 1 carta (conjurou um Jutsu nesta rodada).', side, u.cardId);
        }
        break;
      case 'kabuto_yakushi':
        if (lvl === 2 && p.board.some((e) => e.health < e.maxHealth)) {
          const pool = JUTSU_CARDS.filter((j) => j.category === 'Cura' && isDeckableCard(j));
          const pick = randomPick(pool);
          if (pick) o = addToHand(o, pick.id, ctx, side, 'Kabuto');
        }
        break;
      case 'tayuya':
        if (lvl === 2) {
          const t = strongest(alive(p));
          if (t) {
            p = mapUnit(p, t.uid, (x) => applyGloomToUnit(x, 1));
            log(ctx, `Flauta de Tayuya: ${cardName(t.cardId)} recebe Exaustão (-1/-1).`, side, t.cardId);
          }
        }
        break;
      case 'jiraiya':
        if (lvl === 2) {
          const gama = o.board.find((b) => b.cardId === 'token_gamabunta');
          if (gama) {
            o = mapUnit(o, gama.uid, (x) => buffPermanent(x, 1, 1));
            log(ctx, 'Eremita dos Sapos: Gamabunta ganha +1/+1.', side, 'token_gamabunta');
          }
        }
        break;
      case 'might_guy':
        if (lvl === 1 && o.board.some((b) => b.cardId === 'rock_lee')) {
          o = progressOne(o, u.uid, { type: 'full' }, ctx);
        }
        break;
      default:
        break;
    }
  }
  // Portão da Morte (Lee) e Shiki Fūjin (Hiruzen): morrem no fim da rodada.
  o = {
    ...o,
    board: o.board.map((u) => {
      let x = u;
      if (getS(x, 'morre_fim_rodada')) {
        log(ctx, `${cardName(x.cardId)} cai no fim da rodada.`, side, x.cardId);
        x = { ...clearS(x, 'morre_fim_rodada'), health: -999, immortalUsed: true };
      }
      if (getS(x, 'selado_rodada')) x = clearS({ ...x, silenced: false }, 'selado_rodada');
      return x;
    }),
  };
  // Troca de Mente (Ino): a carta revelada volta ao custo normal.
  if (o.cursedUntilRound !== undefined && ctx.round >= o.cursedUntilRound) {
    o = { ...o, cursedHandIndices: {}, cursedUntilRound: undefined };
  }
  return { owner: o, opp: p };
}

// ----------------------------------------------------------------- mortes

/**
 * Antes de remover os mortos: Sakon & Ukon (Sakon Chuunin volta 3/3 se Ukon estiver em campo).
 */
export function applyNinjaPreDeath(owner: PlayerState, ctx: NinjaCtx): PlayerState {
  let o = owner;
  const sakon = o.board.find(
    (u) => u.cardId === 'sakon_ukon' && u.evolutionLevel === 2 && !u.silenced && getUnitHealth(u) <= 0
  );
  const ukon = o.board.find((u) => u.cardId === 'token_ukon' && getUnitHealth(u) > 0);
  if (sakon && ukon) {
    o = {
      ...o,
      board: o.board
        .filter((u) => u.uid !== ukon.uid)
        .map((u) =>
          u.uid === sakon.uid
            ? { ...u, attack: 3, health: 3, maxHealth: 3, tempAttackBonus: 0, tempHealthBonus: 0, stunned: false }
            : u
        ),
    };
    log(ctx, 'Sakon e Ukon se fundem e voltam com 3/3!', sakon.owner, 'sakon_ukon');
  }
  return o;
}

/**
 * Troca de Corpo (Orochimaru Chuunin): quando a Segunda Chance dispara, volta 3/3 e compra 2.
 * Retorna undefined se não for o caso.
 */
export function applyNinjaSecondChance(
  unit: BoardUnit,
  owner: PlayerState,
  ctx: NinjaCtx
): { unit: BoardUnit; owner: PlayerState } | undefined {
  if (unit.cardId !== 'orochimaru' || unit.evolutionLevel !== 2 || unit.silenced) return undefined;
  const revived: BoardUnit = {
    ...unit,
    attack: 3,
    health: 3,
    maxHealth: 3,
    tempAttackBonus: 0,
    tempHealthBonus: 0,
    immortalUsed: true,
    stunned: false,
  };
  log(ctx, 'Troca de Corpo: Orochimaru volta com 3/3 e compra 2 cartas.', unit.owner, unit.cardId);
  return { unit: revived, owner: drawCards(owner, 2) };
}

/** Último Desejo e Vingança quando uma unidade do dono morre. */
export function applyNinjaOnDeath(dead: BoardUnit, owner: PlayerState, opp: PlayerState, ctx: NinjaCtx): SidesResult {
  let o = owner;
  let p = opp;
  const side = dead.owner;
  if (!dead.silenced) {
    if (dead.cardId === 'naruto_uzumaki' && dead.evolutionLevel === 2) o = addToHand(o, 'jutsu_rasengan', ctx, side, 'Naruto');
    if (dead.cardId === 'kimimaro' && dead.equippedCardId === 'equip_osso_kaguya') {
      const t = strongest(alive(p));
      if (t) {
        p = mapUnit(p, t.uid, (x) => ({ ...x, health: Math.min(x.health, 0) - 999 }));
        log(ctx, `Último Desejo de Kimimaro: o Osso perfura e mata ${cardName(t.cardId)}.`, side, t.cardId, 'combat');
      }
    }
  }
  if (dead.cardId === 'token_akamaru') {
    const kiba = findActive(o, 'kiba_inuzuka', 2);
    if (kiba) {
      o = mapUnit(o, kiba.uid, (x) => ({ ...x, attack: x.attack + 2 }));
      log(ctx, 'Kiba fica furioso pela queda de Akamaru: +2/+0.', side, 'kiba_inuzuka');
    }
  }
  if (dead.cardId !== 'sakura_haruno') {
    const sakura = findActive(o, 'sakura_haruno', 2);
    if (sakura && sakura.uid !== dead.uid) {
      o = mapUnit(o, sakura.uid, (x) => buffPermanent(x, 1, 1));
      log(ctx, 'Vingança: Sakura ganha +1/+1.', side, 'sakura_haruno');
    }
  }
  return { owner: o, opp: p };
}

/** Cura de aliados feita por um jogador (Sakura Gennin/Chuunin usa como promoção). */
export function applyNinjaHealHooks(owner: PlayerState, amount: number, ctx: Pick<NinjaCtx, 'arenaId' | 'onEvolve'>): PlayerState {
  if (amount <= 0) return owner;
  return gainNinjaProgressOnBoard(owner, { type: 'heal', amount }, ctx);
}
