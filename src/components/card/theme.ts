import type { CardDef, JutsuCardDef, JutsuCategory, JutsuSpeed, Keyword } from '../../types/game';
import { getKeywordLabel, SPEED_DISPLAY_NAME } from '../../types/game';

/** Estado visual das plaquinhas de Poder/Vitalidade vs. base da carta. */
export type StatColorState = 'base' | 'up' | 'down';

export type CardRankFrame = 'gennin' | 'chuunin' | 'jounnin' | 'neutral';

export type JutsuFamilySeal = 'selo-ninjutsu' | 'selo-genjutsu' | 'selo-taijutsu';

export type CardIconId =
  | 'golpe-veloz'
  | 'furtivo'
  | 'visao-ninja'
  | 'ataque-em-area'
  | 'ataque-individual'
  | 'rapido'
  | 'preparado'
  | 'oculto'
  | 'formacao'
  | 'veneno'
  | 'selado'
  | 'sede-batalha'
  | 'provocar'
  | 'copiar'
  | 'combo'
  | 'muralha'
  | 'resistente'
  | 'absorcao'
  | 'apoio'
  | 'impeto'
  | 'substituicao'
  | 'poder'
  | 'vida'
  | 'selo-ninjutsu'
  | 'selo-genjutsu'
  | 'selo-taijutsu'
  | 'coroa'
  | 'ampulheta'
  | 'orbe-chakra';

export const TYPE_BAND: Record<string, { label: string; color: string }> = {
  ninja: { label: 'NINJA', color: '#F97316' },
  unidade: { label: 'UNIDADE', color: '#64748B' },
  token: { label: 'UNIDADE', color: '#0F766E' },
  jutsu: { label: 'JUTSU', color: '#0EA5E9' },
  equipamento: { label: 'EQUIPAMENTO', color: '#475569' },
};

export const FAMILY_COLORS: Record<JutsuFamilySeal, { accent: string; deep: string }> = {
  'selo-ninjutsu': { accent: '#4FC3F7', deep: '#1E88C0' },
  'selo-genjutsu': { accent: '#9C27B0', deep: '#6A1B7A' },
  'selo-taijutsu': { accent: '#3A7D44', deep: '#2C5F2D' },
};

const KEYWORD_ICON: Partial<Record<Keyword, CardIconId>> = {
  'Ataque Rápido': 'golpe-veloz',
  Elusivo: 'furtivo',
  'Visão Aguçada': 'visao-ninja',
  Formação: 'formacao',
  Veneno: 'veneno',
  'Escudo de Feitiço': 'selado',
  Sobrepujar: 'ataque-individual',
  Fúria: 'sede-batalha',
  Desafiador: 'provocar',
  Barreira: 'substituicao',
  Regeneração: 'vida',
  Efêmero: 'oculto',
  'Ataque Duplo': 'combo',
  Copiar: 'copiar',
  Formidável: 'muralha',
  Robusto: 'resistente',
  'Roubo de Vida': 'absorcao',
  Auxiliar: 'apoio',
  Imprudente: 'impeto',
  Parceiro: 'formacao',
};

const CATEGORY_ICON: Partial<Record<JutsuCategory, CardIconId>> = {
  'Ataque em Área': 'ataque-em-area',
  'Ataque Individual': 'ataque-individual',
};

const SPEED_ICON: Record<JutsuSpeed, CardIconId> = {
  Rapida: 'rapido',
  Lenta: 'preparado',
  Imediata: 'rapido',
  Focada: 'ampulheta',
  Oculta: 'oculto',
};

/** Mapeia symbolType / nome existente → selo de família (sem alterar dados). */
export function jutsuFamilyOf(card: JutsuCardDef): JutsuFamilySeal {
  const name = card.name.toLowerCase();
  // Genjutsu clássicos já no repo (ex.: Magen) — só visual.
  if (
    name.includes('magen') ||
    name.includes('genjutsu') ||
    name.includes('tsukuyomi') ||
    card.symbolType === 'shadow' ||
    card.symbolType === 'byakugan'
  ) {
    return 'selo-genjutsu';
  }
  // shadow/byakugan já tratados acima como Genjutsu (narrowing remove do switch)
  switch (card.symbolType) {
    case 'taijutsu':
    case 'kunai':
      return 'selo-taijutsu';
    case 'rasengan':
    case 'chidori':
    case 'fire':
    case 'medical':
    case 'seal':
    case 'wood':
    case 'summon':
    case 'water':
    case 'ice':
    case 'sand':
      return 'selo-ninjutsu';
    default: {
      const _exhaustive: never = card.symbolType;
      void _exhaustive;
      return 'selo-ninjutsu';
    }
  }
}

export function rankFrameOf(level: 1 | 2 | 3 | undefined, kind: CardDef['kind']): CardRankFrame {
  if (kind !== 'ninja') return 'neutral';
  if (level === 3) return 'jounnin';
  if (level === 2) return 'chuunin';
  return 'gennin';
}

export function patenteLabel(level: 1 | 2 | 3): string {
  if (level === 3) return 'JOUNNIN';
  if (level === 2) return 'CHUUNIN';
  return 'GENNIN';
}

export function compareStat(current: number, base: number): StatColorState {
  if (current > base) return 'up';
  if (current < base) return 'down';
  return 'base';
}

export function keywordIconId(kw: Keyword): CardIconId | null {
  return KEYWORD_ICON[kw] ?? null;
}

export function speedIconId(speed: JutsuSpeed): CardIconId {
  return SPEED_ICON[speed];
}

export function categoryIconId(category: JutsuCategory): CardIconId | null {
  return CATEGORY_ICON[category] ?? null;
}

export function iconPublicPath(id: CardIconId): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}icons/${id}.svg`;
}

export function typeBandFor(
  card: CardDef,
  opts?: { exclusive?: boolean; created?: boolean },
): { label: string; color: string; gold?: boolean } {
  if (opts?.exclusive && card.kind === 'jutsu') {
    return { label: 'JUTSU', color: '#D4A24C', gold: true };
  }
  if (opts?.created || card.kind === 'token') {
    return { label: card.kind === 'jutsu' ? 'JUTSU' : 'UNIDADE', color: '#0F766E' };
  }
  return TYPE_BAND[card.kind] ?? TYPE_BAND.unidade;
}

export function keywordPills(
  keywords: readonly Keyword[],
): Array<{ id: CardIconId | null; label: string }> {
  return keywords.map((kw) => ({
    id: keywordIconId(kw),
    label: getKeywordLabel(kw).toUpperCase(),
  }));
}

export function speedPill(speed: JutsuSpeed): { id: CardIconId; label: string } {
  return {
    id: speedIconId(speed),
    label: SPEED_DISPLAY_NAME[speed].toUpperCase(),
  };
}
