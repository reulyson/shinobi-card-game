import { getCardById } from '../../data/cards';
import type { CardDef, Keyword } from '../../types/game';
import { keywordFromDisplayLabel } from '../../types/game';

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

export function resolveArenaCardDef(cardId: string): CardDef | undefined {
  return getCardById(cardId) ?? getCardById(CARD_ID_ALIAS[cardId] ?? '');
}

export function keywordsFromArenaLabels(
  keywords: Array<{ id: string | null; label: string }> | undefined,
): Keyword[] | undefined {
  if (!keywords || keywords.length === 0) return undefined;
  const out: Keyword[] = [];
  for (const kw of keywords) {
    const motor = keywordFromDisplayLabel(kw.label);
    if (motor) out.push(motor);
  }
  return out.length > 0 ? out : undefined;
}