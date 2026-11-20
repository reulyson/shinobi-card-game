/** Tipos de apresentação da Arena B4 (Part 3) — sem inventar regras; só layout/prévia. */

export type OwnerSide = 'player' | 'enemy';

export type StatTone = 'base' | 'above' | 'below';

export interface FieldCardPreview {
  /** Poder previsto (exibido na plaquinha). */
  power: number;
  /** Vitalidade prevista. */
  vitality: number;
  /** Bases da carta (para colorir vs previsto). */
  basePower: number;
  baseVitality: number;
  /** Unidade morre na prévia. */
  dying?: boolean;
}

export type CardRank = 'gennin' | 'chuunin' | 'jounnin';

export type FieldBand = 'NINJA' | 'UNIDADE' | 'TOKEN';

export interface ArenaCardRef {
  uid: string;
  cardId: string;
  name: string;
  owner: OwnerSide;
  /** Arte / portrait URL opcional. */
  artUrl?: string;
  /** object-position da arte (ex.: "50% 20%"). */
  artPos?: string;
  cost?: number;
  /** Moldura por patente (borda lateral + frame). */
  rank?: CardRank;
  /** Faixa de tipo (NINJA / UNIDADE). */
  band?: FieldBand;
  /**
   * Palavras-chave da carta (ícones v7o).
   * 1 → pílula ícone+nome; 2+ → só ícones.
   */
  keywords?: Array<{ id: string | null; label: string }>;
  /** Coluna 0–4; omitido = preenchimento sequencial. */
  column?: number;
  preview?: FieldCardPreview;
  /** Face down (verso). */
  faceDown?: boolean;
  selected?: boolean;
  dimmed?: boolean;
}

export interface ArenaArrow {
  id: string;
  fromCol: number;
  /** 'up' = meu ataque (de baixo pra cima); 'down' = ataque do rival. */
  direction: 'up' | 'down';
  who: OwnerSide;
  /** Dano que passa à Vitalidade se não houver bloqueador no slot oposto. */
  unblockedDamage?: number;
  /** Há bloqueador pareado nesta coluna. */
  blocked?: boolean;
}

export interface PilhaItem {
  uid: string;
  cardId: string;
  name: string;
  owner: OwnerSide;
  artUrl?: string;
  /** 1 = mais novo / resolve primeiro. */
  order: number;
}

export interface ArenaB4Model {
  round: number;
  /** Vitalidade atual / prevista (rival = enemy). */
  rivalVitality: { current: number; predicted?: number };
  myVitality: { current: number; predicted?: number };
  rivalDeck: { remaining: number; total: number };
  myDeck: { remaining: number; total: number };
  rivalHandCount: number;
  /** Cartas da minha mão (máx. 9); cardId + nome para placeholder. */
  myHand: Array<{ cardId: string; name: string; artUrl?: string; cost?: number; playable?: boolean }>;
  rivalBackrow: ArenaCardRef[];
  myBackrow: ArenaCardRef[];
  /** Linha de combate de cima (sempre rival). */
  rivalCombat: ArenaCardRef[];
  /** Linha de combate de baixo (sempre eu). */
  myCombat: ArenaCardRef[];
  rivalOculto: number;
  myOculto: number;
  pilha: PilhaItem[];
  arrows: ArenaArrow[];
  /** Texto da prévia (ex.: "PRÉVIA - NADA FOI APLICADO"). */
  previaLabel?: string;
  /** Meu turno? (placeholder TurnCoin). */
  myTurn: boolean;
  mainActionLabel: string;
  rivalChakra?: { current: number; max: number; reserve?: number };
  myChakra?: { current: number; max: number; reserve?: number };
  historicoLines?: string[];
  /** Há unidades na zona de combate → miniaturas da pilha menores. */
  combatBusy?: boolean;
}

export type ArenaB4DemoId = 'meu-ataque' | 'preview' | 'pilha' | 'campo';
