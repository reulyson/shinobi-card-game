/**
 * Parte 5 · Grupo 5 — Palavras-chave (regras genéricas).
 *
 * Funções puras (sem React) para as palavras-chave e estados novos:
 * - Formação: bônus +1/+1 enquanto o dono tem 3+ aliados em campo (quaisquer aliados, Tokens contam).
 *   Nunca é requisito para jogar a carta.
 * - Parceiro: Token que acompanha um Ninja; se o Ninja sai de campo, o Parceiro vai junto.
 * - Veneno X: no início da rodada sofre 1 de dano, por X rodadas. Não acumula: renova a duração.
 * - Genjutsu (estado): não ataca nem bloqueia até o fim da próxima rodada. Kai remove.
 * - Kai (efeito de Jutsu): remove Genjutsu ou Selado de um aliado.
 * - Copiar: quando um Jutsu rival resolve (não Exclusivo, não cópia), cria uma cópia Fugaz na mão
 *   (1 vez por rodada por jogador). A cópia que ficar na mão é descartada no fim da rodada.
 * - Visão Ninja (ajuste): também vê as Armadilhas ocultas do rival.
 *
 * Palavras-chave cortadas neste grupo: Instável (Fugaz), Pilhagem (Saquear), Iniciativa (Amanhecer),
 * Sequência (Anoitecer), Emboscada (Espreitar) e Batedor (Patrulheiro). Os bônus de cartas que as usavam
 * viraram texto da própria carta (ver FIRST_CARD_BONUS_IDS e afins).
 */
import { getCardById, SIGNATURE_JUTSU_IDS } from '../data/cards';
import type { BattleLogEntry, BoardUnit, JutsuCardDef, PlayerState } from '../types/game';

let kwUid = 1;
function kwId(prefix: string): string {
  kwUid += 1;
  return `${prefix}_${kwUid}_${Math.random().toString(36).slice(2, 6)}`;
}

function cardName(cardId: string): string {
  return getCardById(cardId)?.name ?? cardId;
}

function hasActiveKeyword(u: BoardUnit, kw: BoardUnit['keywords'][number]): boolean {
  return !u.silenced && u.keywords.includes(kw);
}

// ---------------------------------------------------------------------------
// Cortes: bônus que eram palavra-chave e viraram texto da carta (transitório até os Grupos 6/7).
// ---------------------------------------------------------------------------

/** "Se for a 1ª carta que você joga na rodada" (antes: Iniciativa). */
export const FIRST_CARD_BONUS_IDS: ReadonlySet<string> = new Set(['asuma_sarutobi']);
// (merge 4+5+7) Policial Uchiha e Agente da Raiz foram redesenhados no Grupo 7 e saíram destas listas.
/** "Se você já jogou outra carta nesta rodada" (antes: Sequência). */
export const LATER_CARD_BONUS_IDS: ReadonlySet<string> = new Set(['kurenai_yuhi', 'tayuya']);
/** Batedor de Suna: único que ainda ganha o 2º ataque (antes: palavra-chave Batedor). */
export const SECOND_ATTACK_UNIT_ID: string | null = null; // (merge 4+5+7) os Ninjas da Areia do Grupo 7 não têm 2º ataque

// ---------------------------------------------------------------------------
// Formação
// ---------------------------------------------------------------------------

/** Mínimo de aliados em campo (incluindo a própria unidade e Tokens) para a Formação. */
export const FORMATION_MIN_ALLIES = 3;

/** Formação ativa para este jogador: 3+ aliados em campo (quaisquer, Tokens contam). */
export function isFormationActive(state: Pick<PlayerState, 'board'>): boolean {
  return state.board.length >= FORMATION_MIN_ALLIES;
}

/**
 * Liga/desliga o bônus +1/+1 de Formação de cada unidade com a palavra-chave.
 * O bônus não acumula (1 por carta). Ao perder a Formação, a unidade perde +1/+1, mas nunca
 * morre por isso (fica com pelo menos 1 de Vida).
 */
export function refreshFormation(state: PlayerState): PlayerState {
  const active = isFormationActive(state);
  let changed = false;
  const board = state.board.map((u) => {
    const should = active && hasActiveKeyword(u, 'Formação');
    const has = Boolean(u.formationActive);
    if (should === has) return u;
    changed = true;
    if (should) {
      return { ...u, formationActive: true, attack: u.attack + 1, health: u.health + 1, maxHealth: u.maxHealth + 1 };
    }
    const maxHealth = Math.max(1, u.maxHealth - 1);
    return {
      ...u,
      formationActive: false,
      attack: Math.max(0, u.attack - 1),
      maxHealth,
      health: Math.max(1, Math.min(maxHealth, u.health - 1)),
    };
  });
  return changed ? { ...state, board } : state;
}

// ---------------------------------------------------------------------------
// Parceiro
// ---------------------------------------------------------------------------

/** Liga o Token ao Ninja que ele acompanha. */
export function linkPartner(token: BoardUnit, ninjaUid: string): BoardUnit {
  return { ...token, partnerOfUid: ninjaUid };
}

/** Parceiros cujo Ninja saiu de campo vão com ele (saem de campo; não é morte em combate). */
export function applyPartnerRule(
  state: PlayerState,
  round: number,
  side: 'player' | 'enemy',
  logs: BattleLogEntry[] = []
): PlayerState {
  const uids = new Set(state.board.map((u) => u.uid));
  const gone = state.board.filter((u) => u.partnerOfUid && !uids.has(u.partnerOfUid));
  if (gone.length === 0) return state;
  for (const u of gone) {
    logs.push({
      id: kwId('partner'),
      round,
      text: `Parceiro: ${cardName(u.cardId)} saiu de campo junto com o Ninja que acompanhava.`,
      tone: 'info',
      actor: side,
      cardId: u.cardId,
    });
  }
  const goneIds = new Set(gone.map((u) => u.uid));
  return { ...state, board: state.board.filter((u) => !goneIds.has(u.uid)) };
}

/** Regras contínuas aplicadas a cada mudança de estado de um lado (Parceiro, depois Formação). */
export function applyContinuousKeywordRules(
  state: PlayerState,
  round: number,
  side: 'player' | 'enemy'
): { state: PlayerState; logs: BattleLogEntry[] } {
  const logs: BattleLogEntry[] = [];
  let next = applyPartnerRule(state, round, side, logs);
  next = refreshFormation(next);
  return { state: next, logs };
}

// ---------------------------------------------------------------------------
// Veneno X
// ---------------------------------------------------------------------------

/** X do Veneno da unidade (campo venenoX da carta; padrão 1). */
export function getVenenoX(unit: BoardUnit): number {
  const def = getCardById(unit.cardId);
  const x = def && (def.kind === 'ninja' || def.kind === 'unidade' || def.kind === 'token') ? def.venenoX : undefined;
  return Math.max(1, x ?? 1);
}

/** Aplica Veneno X. Não acumula: fica com a maior duração (renova). */
export function applyPoison(unit: BoardUnit, x: number): BoardUnit {
  if (x <= 0) return unit;
  return { ...unit, poison: Math.max(unit.poison ?? 0, x) };
}

/** Quem tem a palavra-chave Veneno envenena a unidade que golpeia (se o golpe causou dano). */
export function poisonOnStrike(striker: BoardUnit, target: BoardUnit, damageDealt: number): BoardUnit {
  if (damageDealt <= 0 || !hasActiveKeyword(striker, 'Veneno')) return target;
  return applyPoison(target, getVenenoX(striker));
}

// ---------------------------------------------------------------------------
// Genjutsu e Kai
// ---------------------------------------------------------------------------

/** Genjutsu que não expira sozinho (Kurenai Chuunin: "só se libera com Kai"). */
export const GENJUTSU_UNTIL_KAI = 99;

/** Genjutsu: não ataca nem bloqueia nesta rodada e na próxima (ou `rounds` rodadas). */
export function applyGenjutsu(unit: BoardUnit, rounds = 2): BoardUnit {
  return { ...unit, genjutsu: Math.max(unit.genjutsu ?? 0, rounds) };
}

export function isInGenjutsu(unit: BoardUnit): boolean {
  return (unit.genjutsu ?? 0) > 0;
}

/** Fora do combate: Paralisia (física) ou Genjutsu. */
export function isOutOfCombat(unit: BoardUnit): boolean {
  return unit.stunned || isInGenjutsu(unit);
}

/** Kai: remove Genjutsu e Selado (não remove Paralisia, que é física). */
export function applyKai(unit: BoardUnit): BoardUnit {
  return { ...unit, genjutsu: 0, silenced: false };
}

// ---------------------------------------------------------------------------
// Copiar (cópia Fugaz)
// ---------------------------------------------------------------------------

/** Jutsu Exclusivo de algum Ninja (não pode ser copiado). */
export function isExclusiveJutsu(jutsuId: string): boolean {
  return SIGNATURE_JUTSU_IDS.has(jutsuId);
}

function removeOne(arr: readonly string[], id: string): string[] {
  const i = arr.indexOf(id);
  if (i < 0) return [...arr];
  return [...arr.slice(0, i), ...arr.slice(i + 1)];
}

/**
 * Chamado quando um Jutsu resolve: consome a cópia Fugaz de quem conjurou (se era uma) e,
 * se o rival tem uma unidade com Copiar, cria uma cópia Fugaz na mão dele (1 vez por rodada).
 * Não copia Jutsu Exclusivo nem uma cópia Fugaz.
 */
export function applyCopiarOnResolve(
  jutsu: JutsuCardDef,
  caster: PlayerState,
  observer: PlayerState,
  round: number,
  observerSide: 'player' | 'enemy'
): { caster: PlayerState; observer: PlayerState; logs: BattleLogEntry[] } {
  const logs: BattleLogEntry[] = [];
  let nextCaster = caster;
  const wasCopy = (caster.fleetingHand ?? []).includes(jutsu.id);
  if (wasCopy) nextCaster = { ...caster, fleetingHand: removeOne(caster.fleetingHand ?? [], jutsu.id) };

  const copier = observer.board.find((u) => hasActiveKeyword(u, 'Copiar'));
  if (!copier) return { caster: nextCaster, observer, logs };
  if (observer.copyUsedRound === round) return { caster: nextCaster, observer, logs };
  if (wasCopy || isExclusiveJutsu(jutsu.id)) return { caster: nextCaster, observer, logs };
  if (observer.hand.length >= 9) return { caster: nextCaster, observer, logs };

  const nextObserver: PlayerState = {
    ...observer,
    hand: [...observer.hand, jutsu.id],
    fleetingHand: [...(observer.fleetingHand ?? []), jutsu.id],
    copyUsedRound: round,
  };
  logs.push({
    id: kwId('copy'),
    round,
    text: `Copiar: ${cardName(copier.cardId)} copiou ${jutsu.name}. ${
      observerSide === 'player' ? 'Você ganhou' : 'O oponente ganhou'
    } uma cópia Fugaz (some da mão no fim da rodada).`,
    tone: 'jutsu',
    actor: observerSide,
    cardId: jutsu.id,
    cine: observerSide === 'player' ? 'created' : undefined,
  });
  return { caster: nextCaster, observer: nextObserver, logs };
}

// ---------------------------------------------------------------------------
// Início da rodada
// ---------------------------------------------------------------------------

/**
 * Início da rodada (antes de Cura Natural): cópias Fugazes que ficaram na mão são descartadas,
 * Veneno causa 1 de dano direto (ignora Substituição e Resistente) e perde 1 rodada,
 * Genjutsu perde 1 rodada. Mortes por Veneno são resolvidas depois por processBoardDeaths.
 */
export function applyRoundStartKeywords(
  state: PlayerState,
  round: number,
  side: 'player' | 'enemy',
  logs: BattleLogEntry[] = []
): PlayerState {
  let hand = state.hand;
  const fleeting = state.fleetingHand ?? [];
  if (fleeting.length > 0) {
    for (const id of fleeting) {
      if (hand.includes(id)) {
        hand = removeOne(hand, id);
        logs.push({
          id: kwId('fleet'),
          round,
          text: `${side === 'player' ? 'Sua cópia Fugaz' : 'A cópia Fugaz do oponente'} de ${cardName(id)} sumiu da mão (fim da rodada).`,
          tone: 'info',
          actor: side,
        });
      }
    }
  }
  const board = state.board.map((u) => {
    let next = u;
    if ((next.poison ?? 0) > 0) {
      next = { ...next, health: next.health - 1, poison: (next.poison ?? 0) - 1 };
      logs.push({
        id: kwId('poison'),
        round,
        text: `Veneno: ${cardName(u.cardId)} sofreu 1 de dano${next.poison ? ` (${next.poison} rodada(s) restante(s))` : ' (Veneno acabou)'}.`,
        tone: 'combat',
        actor: side,
        cardId: u.cardId,
      });
    }
    if ((next.genjutsu ?? 0) > 0) {
      next = { ...next, genjutsu: (next.genjutsu ?? 0) - 1 };
    }
    return next;
  });
  return { ...state, hand, fleetingHand: [], board };
}
