export type TeamFaction =
  | 'Time 7'
  | 'Time 8'
  | 'Time 9'
  | 'Time 10'
  | 'Som & Sannin'
  | 'Hokages'
  | 'Areia'
  | 'Névoa'
  | 'Neutro'
  | 'Akatsuki';

/** Raridade de coleção (C/I/R/L). Não afeta poder nem visual — só pack/craft/coleção (pós-MVP). */
export type CardRarity = 'C' | 'I' | 'R' | 'L';

export const RARITY_DISPLAY_NAME: Record<CardRarity, string> = {
  C: 'Comum',
  I: 'Incomum',
  R: 'Rara',
  L: 'Lendária',
};

/** Palavras-chave do motor = rótulos exibidos na carta (vocabulário único). */
export type Keyword =
  | 'Furtivo'
  | 'Sensor'
  | 'Perfurante'
  | 'Ágil'
  | 'Veloz'
  | 'Provocar'
  | 'Intimidação'
  | 'Imprudente'
  | 'Muralha'
  | 'Impacto'
  | 'Indefeso'
  | 'Imobilizado'
  | 'Esquiva'
  | 'Anulação'
  | 'Resistente'
  | 'Regenerar'
  | 'Renascer'
  | 'Roubo de Vida'
  | 'Drenar'
  | 'Clone'
  | 'Exposto'
  | 'Fúria'
  | 'Determinação'
  | 'Treinamento'
  | 'Despertar'
  | 'Legado'
  | 'Concentrar'
  | 'Fluxo'
  | 'Apoio'
  | 'Ressonância'
  | 'Contagem'
  | 'Veneno'
  | 'Parceiro'
  | 'Formação'
  | 'Copiar';

/** Lista canônica (glossário, testes, índice de rótulos). */
export const KEYWORD_LIST: readonly Keyword[] = [
  'Furtivo',
  'Sensor',
  'Perfurante',
  'Ágil',
  'Veloz',
  'Provocar',
  'Intimidação',
  'Imprudente',
  'Muralha',
  'Impacto',
  'Indefeso',
  'Imobilizado',
  'Esquiva',
  'Anulação',
  'Resistente',
  'Regenerar',
  'Renascer',
  'Roubo de Vida',
  'Drenar',
  'Clone',
  'Exposto',
  'Fúria',
  'Determinação',
  'Treinamento',
  'Despertar',
  'Legado',
  'Concentrar',
  'Fluxo',
  'Apoio',
  'Ressonância',
  'Contagem',
  'Veneno',
  'Parceiro',
  'Formação',
  'Copiar',
];

export type JutsuSpeed = 'Rapida' | 'Lenta' | 'Imediata' | 'Focada' | 'Oculta';

/** Família do Jutsu (Grupo 8): selo na carta. Só aplicar onde já decidido. */
export type JutsuFamily = 'Ninjutsu' | 'Genjutsu' | 'Taijutsu';

export type OcultoTriggerType = 'on_enemy_attack' | 'on_enemy_jutsu' | 'on_enemy_summon';

export const SPEED_DISPLAY_NAME: Record<JutsuSpeed, string> = {
  Imediata: 'Instantâneo',
  Rapida: 'Rápido',
  Lenta: 'Preparado',
  Focada: 'Concentrado',
  Oculta: 'Oculto',
};

export const SPEED_FULL_LABEL: Record<JutsuSpeed, string> = {
  Imediata: 'Instantâneo — resolve na hora, sem resposta',
  Rapida: 'Rápido — entra na Pilha e pode ser respondido',
  Lenta: 'Preparado — fora de combate, entra na Pilha',
  Focada: 'Concentrado — fora de combate, resolve na hora',
  Oculta: 'Oculto — joga virado para baixo; ativa no gatilho',
};

export const FAMILY_DISPLAY_NAME: Record<JutsuFamily, string> = {
  Ninjutsu: 'Ninjutsu',
  Genjutsu: 'Genjutsu',
  Taijutsu: 'Taijutsu',
};

/** Compat: mapa identidade (testes legados que iteram `KEYWORD_DISPLAY_NAME`). */
export const KEYWORD_DISPLAY_NAME: Record<Keyword, string> = Object.fromEntries(
  KEYWORD_LIST.map((k) => [k, k]),
) as Record<Keyword, string>;

export function getKeywordLabel(kw: Keyword): string {
  return kw;
}

/** Lista de palavras-chave com os nomes exibidos ao jogador (glossário das regras). */
export function formatKeywords(kws: readonly Keyword[], separator = ' · '): string {
  return kws.map(getKeywordLabel).join(separator);
}

/** Aliases de rótulos em artes/fixtures antigas → `Keyword`. */
const KEYWORD_LABEL_ALIASES: Record<string, Keyword> = {
  'GOLPE VELOZ': 'Ágil',
  'VISÃO NINJA': 'Sensor',
};

function normalizeLabelKey(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Converte o texto da pílula na carta (ex.: SENSOR, Ágil) para `Keyword`. */
export function keywordFromDisplayLabel(label: string): Keyword | undefined {
  const raw = label.trim().toUpperCase();
  const norm = normalizeLabelKey(label);
  for (const kw of KEYWORD_LIST) {
    if (kw.toUpperCase() === raw || normalizeLabelKey(kw) === norm) return kw;
  }
  return KEYWORD_LABEL_ALIASES[raw] ?? KEYWORD_LABEL_ALIASES[norm];
}

export type JutsuCategory =
  | 'Ataque Direto'
  | 'Ataque em Área'
  | 'Ataque Individual'
  | 'Ataque Múltiplo'
  | 'Fortalecer'
  | 'Enfraquecer'
  | 'Cura'
  | 'Invocação'
  | 'Detectar/Revelar';

export type ArenaId =
  | 'vale_do_fim'
  | 'floresta_da_morte'
  | 'arena_chunin'
  | 'telhados_konoha';

/** URLs de imagens oficiais da Narutopedia (static.wikia.nocookie.net) por graduação. */
export interface RankImageUrls {
  gennin: string;
  chuunin: string;
  jounnin: string;
}

/** Campos de mídia comuns: imagem salva e página de origem na Narutopedia. */
export interface CardMediaFields {
  /** URL exata da imagem (Narutopedia). Usada antes de qualquer consulta à API. */
  imageUrl?: string;
  /** URL opcional de recorte transparente (pop-out acima da moldura). */
  popoutUrl?: string;
  /** URL da página de origem na Narutopedia, para conferência. */
  sourceUrl?: string;
}

export interface CharacterVisualDNA {
  skinTone: string;
  hairColor: string;
  hairStyle:
    | 'spiky_blonde'
    | 'spiky_duckbutt'
    | 'pink_bob'
    | 'silver_gravity'
    | 'indigo_long'
    | 'brown_wild'
    | 'dark_hood'
    | 'black_wavy'
    | 'bowl_cut'
    | 'brown_long'
    | 'buns_twin'
    | 'pineapple'
    | 'blonde_ponytail'
    | 'orange_spiky'
    | 'goatee_spiky'
    | 'pale_long'
    | 'silver_ponytail'
    | 'long_brown_sage'
    | 'white_fur'
    | 'hokage_hat'
    | 'yellow_flash'
    | 'red_short'
    | 'four_tails';
  eyeStyle:
    | 'blue_normal'
    | 'sharingan'
    | 'byakugan'
    | 'emerald'
    | 'slit_beast'
    | 'sunglasses'
    | 'amber'
    | 'snake_gold'
    | 'determined_dark'
    | 'crimson';
  outfitColor: string;
  accentColor: string;
  hasHeadband: boolean;
  headbandColor: string;
  marking?:
    | 'whiskers'
    | 'fangs'
    | 'swirls'
    | 'glasses'
    | 'purple_eyes'
    | 'face_paint'
    | 'beard'
    | 'sand_tattoo'
    | 'curse_seal';
  evolvedAura: string;
}

/**
 * Habilidades recorrentes (Parte 5 · Grupo 4): gatilhos que disparam várias vezes na partida,
 * fora a Entrada. Nomes exibidos em RECURRING_TRIGGER_LABEL.
 */
export type RecurringTrigger =
  | 'inicio_rodada'
  | 'fim_rodada'
  | 'ao_atacar'
  | 'ao_bloquear'
  | 'ao_golpear'
  | 'ao_conjurar'
  | 'vinganca'
  | 'repouso'
  | 'ultimo_desejo';

export const RECURRING_TRIGGER_LABEL: Record<RecurringTrigger, string> = {
  inicio_rodada: 'Início da rodada',
  fim_rodada: 'Fim da rodada',
  ao_atacar: 'Investida',
  ao_bloquear: 'Ao bloquear',
  ao_golpear: 'Ao golpear',
  ao_conjurar: 'Ao conjurar',
  vinganca: 'Vingança',
  repouso: 'Repouso',
  ultimo_desejo: 'Último Desejo',
};

export const RECURRING_TRIGGER_HELP: Record<RecurringTrigger, string> = {
  inicio_rodada: 'Dispara no começo de cada rodada, depois da compra.',
  fim_rodada: 'Dispara no fim de cada rodada, antes de os Clones caírem.',
  ao_atacar: 'Dispara sempre que esta unidade é declarada atacante (Ao atacar).',
  ao_bloquear: 'Dispara sempre que esta unidade bloqueia, antes dos golpes.',
  ao_golpear: 'Dispara sempre que esta unidade golpeia em combate (atacando ou bloqueando).',
  ao_conjurar: 'Dispara sempre que você resolve um Jutsu com esta unidade em campo.',
  vinganca: 'Dispara sempre que outro aliado seu morre.',
  repouso: 'Dispara no fim da rodada se esta unidade não atacou nem bloqueou nela.',
  ultimo_desejo: 'Dispara quando esta unidade morre.',
};

/** Alvos das habilidades recorrentes (escolhidos automaticamente, sem clique). */
export type RecurringTarget =
  | 'self'
  | 'combat_enemy'
  | 'strongest_enemy'
  | 'weakest_enemy'
  | 'random_enemy'
  | 'all_enemies'
  | 'most_injured_ally'
  | 'weakest_ally'
  | 'all_allies'
  | 'other_allies';

export type RecurringEffect =
  | { type: 'buff'; target: RecurringTarget; attack: number; health: number; permanent?: boolean }
  | { type: 'damage'; target: RecurringTarget; amount: number }
  | { type: 'heal'; target: RecurringTarget; amount: number }
  | { type: 'stun'; target: RecurringTarget }
  | { type: 'chakra_block'; target: RecurringTarget }
  | { type: 'barrier'; target: RecurringTarget }
  | { type: 'gate_damage'; amount: number }
  | { type: 'gate_heal'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'reserve'; amount: number }
  | { type: 'drain_reserve'; amount: number }
  | { type: 'summon'; tokenId: string }
  | { type: 'progress'; amount: number }
  /** Ganha uma palavra-chave até o início da próxima rodada (merge 4+5+7: Investida das Unidades). */
  | { type: 'gain_keyword'; target: RecurringTarget; keyword: Keyword }
  /** O dono paga Vida da própria Vitalidade (ex.: Selo Amaldiçoado da Anko). */
  | { type: 'pay_gate'; amount: number };

export interface RecurringCondition {
  /** Mínimo de aliados em campo (contando esta unidade e Tokens). */
  minAllies?: number;
  /** Exige um aliado específico em campo (id da carta). */
  allyCardId?: string;
  /** Exige outro aliado desta facção em campo. */
  allyFaction?: TeamFaction;
  /** Exige que esta unidade esteja ferida. */
  selfDamaged?: boolean;
  /** Investida: só se esta unidade atacou sozinha. */
  attackingAlone?: boolean;
  /** Exige um Ninja aliado desta facção em campo (ex.: Tazuna com Time 7). */
  allyNinjaFaction?: TeamFaction;
  /** Exige a própria Vitalidade com mais que esta Vida (ex.: Anko paga 2 só com 5+). */
  minOwnGate?: number;
}

export interface RecurringAbility {
  trigger: RecurringTrigger;
  effects: RecurringEffect[];
  condition?: RecurringCondition;
  /** Só 1 disparo por rodada (padrão: sem limite). */
  oncePerRound?: boolean;
  /** Texto curto exibido (sem o nome do gatilho). Se ausente, é gerado a partir dos efeitos. */
  text?: string;
}

export interface NinjaCardDef extends CardMediaFields {
  id: string;
  kind: 'ninja';
  name: string;
  title: string;
  faction: TeamFaction;
  role: 'Genin' | 'Chunin' | 'Sensei' | 'Sannin' | 'Hokage' | 'Kazekage' | 'Nukenin';
  /** Raridade de coleção; preenchida via `src/data/rarity.ts` para cartas deckable. */
  rarity?: CardRarity;
  cost: number;
  /** Jutsu Exclusivo: não entra no baralho; é criado na mão quando o Ninja entra em campo. */
  signatureJutsuId: string;
  /**
   * Token Exclusivo (opcional): se definido, cópias repetidas do Ninja (na mão, compradas
   * ou invocadas por efeito enquanto ele está em campo) viram este Token em vez do Jutsu Exclusivo.
   */
  exclusiveTokenId?: string;
  // Nível 1: Gennin
  attack: number;
  health: number;
  keywords: Keyword[];
  abilityText: string;
  levelUpCondition: string;
  levelUpTarget: number;
  // Nível 2: Chuunin
  chuuninTitle: string;
  chuuninAttack: number;
  chuuninHealth: number;
  chuuninKeywords: Keyword[];
  chuuninAbilityText: string;
  chuuninLevelUpCondition: string;
  chuuninLevelUpTarget: number;
  /**
   * Patente máxima (Parte 5 · Grupo 6): 1 = só Gennin (sem promoção), 2 = até Chuunin, 3 = até Jounnin.
   * Padrão: 3. Acima dela o Ninja não é promovido.
   */
  maxRank?: 1 | 2 | 3;
  /**
   * Ninja sem Jutsu Exclusivo (Parte 5 · Grupo 6): a cópia repetida vira este Jutsu geral (que continua
   * podendo entrar no baralho). Nesse caso `signatureJutsuId` fica vazio e nada é criado ao entrar em campo.
   */
  generalJutsuId?: string;
  /** Custo para jogar já como Chuunin (memória de patente). Padrão: custo + 1. */
  chuuninCost?: number;
  /** Custo para jogar já como Jounnin (memória de patente). Padrão: custo + 2. */
  jounninCost?: number;
  // Nível 3: Jounnin
  jounninTitle: string;
  jounninAttack: number;
  jounninHealth: number;
  jounninKeywords: Keyword[];
  jounninAbilityText: string;
  /** Habilidades recorrentes por patente (Grupo 4). A patente atual usa só a lista dela. */
  recurring?: Partial<Record<1 | 2 | 3, RecurringAbility[]>>;
  /** Veneno X: valor de X quando a carta tem a palavra-chave Veneno (padrão 1). */
  venenoX?: number;
  aniListSearch: string;
  aniListId?: number;
  malId?: number;
  wikiTitle: string;
  /** Uma imagem por graduação: Gennin (Parte I), Chuunin, Jounnin (forma avançada). */
  imageUrls?: RankImageUrls;
  /** Recortes transparentes opcionais por graduação para pop-out. */
  popoutUrls?: Partial<RankImageUrls>;
  visualDNA: CharacterVisualDNA;
}

export interface UnitCardDef extends CardMediaFields {
  id: string;
  kind: 'unidade' | 'token';
  name: string;
  title: string;
  faction: TeamFaction;
  role: 'Genin' | 'Chunin' | 'Jounin' | 'Anbu' | 'Quarteto do Som' | 'Invocação' | 'Sensei';
  /** Raridade de coleção (unidades deckable). Tokens não usam. */
  rarity?: CardRarity;
  cost: number;
  attack: number;
  health: number;
  keywords: Keyword[];
  abilityText: string;
  /** Habilidades recorrentes (Grupo 4). */
  recurring?: RecurringAbility[];
  /** Veneno X: valor de X quando a carta tem a palavra-chave Veneno (padrão 1). */
  venenoX?: number;
  aniListSearch: string;
  aniListId?: number;
  malId?: number;
  wikiTitle: string;
  visualDNA: CharacterVisualDNA;
}

export type JutsuTargetMode = 'none' | 'ally_unit' | 'enemy_unit' | 'any_unit';

export interface JutsuCardDef extends CardMediaFields {
  id: string;
  kind: 'jutsu';
  name: string;
  jpName?: string;
  wikiTitle: string;
  category: JutsuCategory;
  faction: TeamFaction;
  /** Raridade de coleção (jutsus deckable / ocultos). Exclusivos gerados: sem raridade de pack. */
  rarity?: CardRarity;
  speed: JutsuSpeed;
  /** Família (Grupo 8). Opcional até validação completa das velocidades por família. */
  family?: JutsuFamily;
  cost: number;
  targetMode: JutsuTargetMode;
  effectText: string;
  flavorText: string;
  elementColor: string;
  /**
   * Gatilho de Oculto (ex-Oculto). Só para speed === 'Oculta'.
   * // TODO Grupo 8: resposta do rival a Oculto / prioridade — indefinido.
   */
  triggerType?: OcultoTriggerType;
  symbolType:
    | 'rasengan'
    | 'chidori'
    | 'fire'
    | 'shadow'
    | 'medical'
    | 'seal'
    | 'taijutsu'
    | 'wood'
    | 'summon'
    | 'water'
    | 'byakugan'
    | 'kunai'
    | 'ice'
    | 'sand';
}

/**
 * @deprecated Grupo 8 removeu o tipo Oculto. Use JutsuCardDef com speed 'Oculta'.
 * Mantido só como alias tipado para migração de imports.
 */
export type TrapCardDef = JutsuCardDef & {
  speed: 'Oculta';
  triggerType: OcultoTriggerType;
};

export interface EquipmentCardDef extends CardMediaFields {
  id: string;
  kind: 'equipamento';
  name: string;
  jpName?: string;
  wikiTitle: string;
  faction: TeamFaction;
  /** Raridade de coleção (equipamentos deckable). */
  rarity?: CardRarity;
  cost: number;
  bonusAttack: number;
  bonusHealth: number;
  grantedKeywords: Keyword[];
  effectText: string;
  flavorText: string;
  accentColor: string;
  /** Habilidades recorrentes dadas ao portador enquanto equipado (Grupo 4). */
  recurring?: RecurringAbility[];
}

export type CardDef =
  | NinjaCardDef
  | UnitCardDef
  | JutsuCardDef
  | EquipmentCardDef;

/** Carta de Jutsu com velocidade Oculto (ex-Oculto). */
export function isOcultoJutsu(card: CardDef | undefined | null): card is JutsuCardDef {
  return !!card && card.kind === 'jutsu' && card.speed === 'Oculta';
}

export interface ArenaDefinition {
  id: ArenaId;
  name: string;
  subtitle: string;
  imageUrl: string;
  accentColor: string;
  ruleSummary: string;
  detailedRule: string;
}

export interface DeckPreset {
  id: string;
  name: string;
  subtitle: string;
  preferredArena: ArenaId;
  cardIds: string[];
}

export interface BoardUnit {
  uid: string;
  cardId: string;
  owner: 'player' | 'enemy';
  attack: number;
  health: number;
  maxHealth: number;
  tempAttackBonus: number;
  tempHealthBonus: number;
  keywords: Keyword[];
  hasBarrier: boolean;
  hasSpellShield: boolean;
  stunned: boolean;
  frozen: boolean;
  silenced: boolean;
  immortalUsed: boolean;
  gloomStacks: number;
  spiritStacks: number;
  impactStacks: number;
  destinedTriggeredThisRound: boolean;
  equippedCardId: string | null;
  equippedBonusAttack: number;
  equippedBonusHealth: number;
  capturedUnits: BoardUnit[];
  evolutionLevel: 1 | 2 | 3;
  evolved: boolean;
  evolutionProgress: number;
  evolutionTarget: number;
  summonedRound: number;
  canAttackThisRound: boolean;
  activatedTrigger?: 'dawn' | 'nightfall';
  /** Atacou ou bloqueou nesta rodada (Repouso). */
  actedThisRound?: boolean;
  /** Palavras-chave ganhas só até o início da próxima rodada (efeito recorrente gain_keyword). */
  roundKeywords?: Keyword[];
  /** Chaves de habilidades recorrentes "1 vez por rodada" já usadas. */
  recurringUsed?: string[];
  // Parte 5 · Grupo 5 (palavras-chave e estados)
  /** Veneno: rodadas restantes; no início de cada rodada sofre 1 de dano e diminui 1. Não acumula (renova). */
  poison?: number;
  /** Genjutsu: > 0 = não ataca nem bloqueia. Aplicado com 2 (esta rodada e a próxima); Kai remove. */
  genjutsu?: number;
  /** Parceiro: uid do Ninja que este Token acompanha; se o Ninja sai de campo, o Parceiro vai junto. */
  partnerOfUid?: string;
  /** Formação: bônus +1/+1 aplicado agora (3+ aliados em campo). */
  formationActive?: boolean;
  /**
   * Estado das habilidades de Ninja (Parte 5 · Grupo 6): contadores por unidade, como Portões abertos,
   * usos 1 vez por partida/rodada e marcas temporárias (ex.: Selado até o fim da rodada).
   */
  ninjaState?: Record<string, number>;
}

/** Slot de carta Oculto armada (face-down). Campo `traps` no estado mantém o nome interno. */
export interface TrapSlot {
  uid: string;
  cardId: string;
  owner: 'player' | 'enemy';
  armedRound: number;
}

/** Alias Grupo 8: cartas Oculto em jogo. */
export type OcultoSlot = TrapSlot;

export interface CombatPair {
  attackerUid: string;
  blockerUid: string | null;
  /** Bloqueador escolhido pelo atacante via Provocar/Exposto: o defensor não pode trocá-lo. */
  forced?: boolean;
}

export interface StackEntry {
  uid: string;
  cardId: string;
  caster: 'player' | 'enemy';
  targetUid?: string;
  kind?: 'jutsu' | 'trap_trigger';
  trapTriggerContext?: {
    eventType: 'attack' | 'jutsu' | 'summon';
    attackerUids?: string[];
    summonedUnitUid?: string;
  };
}

export type TurnPhase = 'MULLIGAN' | 'MAIN' | 'DECLARE_BLOCK' | 'COMBAT_RESPONSE' | 'STACK_RESPONSE' | 'GAME_OVER';

export interface CombatVisualFX {
  unitFx: Record<
    string,
    {
      type: 'lunge-up' | 'lunge-down' | 'hit' | 'heal' | 'jutsu' | 'evolve' | 'dawn' | 'nightfall';
      label?: string;
    }
  >;
  playerGateLabel?: string;
  enemyGateLabel?: string;
  /** Disparos de palavras-chave por unidade (animação curta + nome). */
  keywordFx?: Record<string, KeywordBurstId[]>;
}

export type KeywordBurstId =
  | 'substituicao'
  | 'contra_jutsu'
  | 'perfurante'
  | 'golpe_veloz'
  | 'combo'
  | 'segunda_chance'
  | 'absorcao'
  | 'resistente'
  | 'ataque_portao'
  | 'sede_batalha'
  | 'cura_natural'
  | 'paralisia'
  | 'bloqueio_chakra'
  | 'selado'
  | 'exposto'
  | 'provocar'
  | 'clone'
  | 'muralha'
  | 'intimidacao';

/** Adiciona um disparo de palavra-chave ao FX de combate. */
export function pushKeywordFx(fx: CombatVisualFX, uid: string, id: KeywordBurstId): void {
  if (!fx.keywordFx) fx.keywordFx = {};
  const list = fx.keywordFx[uid] || (fx.keywordFx[uid] = []);
  if (!list.includes(id)) list.push(id);
}

export interface BattleLogEntry {
  id: string;
  round: number;
  text: string;
  tone: 'info' | 'combat' | 'jutsu' | 'evolution' | 'trap' | 'arena' | 'equip';
  /** Quem agiu (ícone no Registro). Se ausente, é deduzido do texto. */
  actor?: 'player' | 'enemy' | 'system';
  /** Carta de origem do evento (para o destaque na tela). */
  cardId?: string;
  /** Pede um destaque visual (overlay) além da linha no Registro. */
  cine?: 'trap' | 'created' | 'effect' | 'stack';
  /** Unidade de origem (destacada) e alvos (seta) do efeito. */
  originUid?: string;
  targetUids?: string[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  spellMana: number;
  hand: string[];
  deck: string[];
  board: BoardUnit[];
  traps: TrapSlot[];
  passed: boolean;
  cardsPlayedThisRound: number;
  spellsCastThisRound: number;
  spellsCastLastRound: number;
  damagedEnemyNexusThisRound: boolean;
  scoutAttackUsedThisRound: boolean;
  hallowedBonus: number;
  keywordsPlayedSet: string[];
  cursedHandIndices: Record<number, number>;
  deckOut?: boolean;
  /**
   * Memória de patente (Parte 5 · Grupo 3): por Ninja, a patente e o progresso salvos quando ele saiu de campo.
   * A próxima cópia entra nessa patente e paga o custo dela.
   */
  ninjaMemory?: Record<string, NinjaRankMemory>;
  /** Quantas cópias deste Ninja estão transformadas na mão (Jutsu/Token Exclusivo ou Jutsu geral). */
  ninjaCopies?: Record<string, number>;
  /** Copiar (Grupo 5): cópias Fugazes na mão (ids); as que sobrarem são descartadas no fim da rodada. */
  fleetingHand?: string[];
  /** Copiar (Grupo 5): rodada em que este jogador já copiou um Jutsu (1 vez por rodada). */
  copyUsedRound?: number;
  /** Troca de Mente (Ino): rodada em que a carta revelada deixa de custar +1 (cursedHandIndices é limpo). */
  cursedUntilRound?: number;
  /** Marcas de "uma vez por partida" das habilidades de Ninja (ex.: Byakugō, Portão da Morte). */
  ninjaFlags?: Record<string, number>;
}

export interface NinjaRankMemory {
  level: 1 | 2 | 3;
  progress: number;
  target: number;
  /** Ordem de gravação (desempate entre estados concorrentes). */
  seq: number;
}

export interface MatchRecord {
  id: string;
  playedAt: string;
  result: 'victory' | 'defeat';
  initialArena: ArenaId;
  finalArena: ArenaId;
  durationSeconds: number;
  rounds: number;
  playerHpRemaining: number;
  enemyHpRemaining: number;
  evolutionsCount: number;
  jutsusCastCount: number;
  jutsuCounts: Record<string, number>;
}
