import { getCardById } from '../../data/cards';
import type { CardDef, Keyword } from '../../types/game';

/** Aliases dos fixtures B4 → ids canônicos do catálogo. */
const CARD_ID_ALIAS: Record<string, string> = {
  naruto: 'naruto_uzumaki',
  sasuke: 'sasuke_uchiha',
  zabuza: 'zabuza_momochi',
  anbu: 'unit_anbu_konoha',
  clone: 'token_kage_bunshin',
  katon: 'jutsu_bola_de_fogo',
  fuma: 'jutsu_fuma_shuriken',
  chidori: 'jutsu_chidori',
  equip: 'equip_kubikiribocho',
};

/** Labels de pílula B4 → Keyword do motor (para keywordsOverride). */
const LABEL_TO_KEYWORD: Record<string, Keyword> = {
  'GOLPE VELOZ': 'Ataque Rápido',
  FURTIVO: 'Elusivo',
  PERFURANTE: 'Sobrepujar',
  CLONE: 'Efêmero',
  'VISÃO NINJA': 'Visão Aguçada',
  FORMACAO: 'Formação',
  FORMAÇÃO: 'Formação',
  VENENO: 'Veneno',
  COPIAR: 'Copiar',
};

export function resolveArenaCardDef(cardId: string): CardDef | undefined {
  return getCardById(cardId) ?? getCardById(CARD_ID_ALIAS[cardId] ?? '');
}

export function keywordsFromArenaLabels(
  keywords: Array<{ id: string | null; label: string }> | undefined,
): Keyword[] | undefined {
  if (!keywords || keywords.length === 0) return undefined;
  const out: Keyword[] = [];
  for (const kw of keywords) {
    const byLabel = LABEL_TO_KEYWORD[kw.label.toUpperCase()];
    if (byLabel) out.push(byLabel);
  }
  return out.length > 0 ? out : undefined;
}
