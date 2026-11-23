/**
 * Raridades de coleção (C/I/R/L).
 *
 * Critérios (v1 — fantasia/coleção, NÃO poder):
 * - L: rostos icônicos do elenco (ninjas “poster”)
 * - R: nomes fortes / peças de identidade de set
 * - I: suporte de arquétipo e side cast reconhecível
 * - C: staples de curva, tropas genéricas, utilitários baratos
 *
 * Tokens e jutsus exclusivos gerados em partida: sem raridade de pack.
 * Motor/UI de combate não devem usar raridade para regras ou visual.
 */
import type { CardDef, CardRarity } from '../types/game';
import { RARITY_DISPLAY_NAME } from '../types/game';

export { RARITY_DISPLAY_NAME };
export type { CardRarity };

/** Atribuição explícita por id (só cartas que entram no loop de coleção). */
export const RARITY_BY_ID: Readonly<Record<string, CardRarity>> = {
  // —— Ninjas ——
  // L — rostos do produto
  naruto_uzumaki: 'L',
  sasuke_uchiha: 'L',
  sakura_haruno: 'L',
  kakashi_hatake: 'L',
  itachi_uchiha: 'L',
  jiraiya: 'L',
  orochimaru: 'L',
  tsunade: 'L',
  minato_namikaze: 'L',
  gaara: 'L',
  // R — elenco principal / patente alta
  might_guy: 'R',
  hiruzen_sarutobi: 'R',
  neji_hyuga: 'R',
  rock_lee: 'R',
  shikamaru_nara: 'R',
  kimimaro: 'R',
  zabuza_momochi: 'R',
  kisame_hoshigaki: 'R',
  kabuto_yakushi: 'R',
  hinata_hyuga: 'R',
  // I — genin/chunin de time + areia/névoa de suporte
  choji_akimichi: 'I',
  ino_yamanaka: 'I',
  kiba_inuzuka: 'I',
  shino_aburame: 'I',
  tenten: 'I',
  temari: 'I',
  kankuro: 'I',
  haku: 'I',
  asuma_sarutobi: 'I',
  kurenai_yuhi: 'I',
  // C — quarteto do som e similares (acessíveis no craft/pack)
  jirobo: 'C',
  kidomaru: 'C',
  tayuya: 'C',
  sakon_ukon: 'C',

  // —— Unidades ——
  // C — curva baixa / genéricos
  unit_estudante_academia: 'C',
  unit_kin_tsuchi: 'C',
  unit_tazuna: 'C',
  unit_konohamaru: 'C',
  unit_bikochu: 'C',
  unit_medico_campo: 'C',
  unit_ebisu: 'C',
  unit_batedor_som: 'C',
  unit_genin_chuva: 'C',
  unit_mizuki: 'C',
  unit_idate_morino: 'C',
  unit_sasame_fuma: 'C',
  unit_batedor_areia: 'C',
  unit_gato_bandidos: 'C',
  unit_dosu_kinuta: 'C',
  unit_gozu_meizu: 'C',
  // I — named mid / suporte
  unit_anbu_konoha: 'I',
  unit_examinador_chunin: 'I',
  unit_oinin_nevoa: 'I',
  unit_kotetsu_izumo: 'I',
  unit_yoroi_misumi: 'I',
  unit_genma_shiranui: 'I',
  unit_iruka_umino: 'I',
  unit_hayate_gekko: 'I',
  unit_shizune: 'I',
  unit_policia_uchiha: 'I',
  unit_raiz_ne: 'I',
  unit_escaramucador_nevoa: 'I',
  unit_brigada_marionetes: 'I',
  unit_zaku_abumi: 'I',
  unit_ibiki_morino: 'I',
  unit_esquadrao_anbu: 'I',
  unit_anko_mitarashi: 'I',
  unit_arashi_fuma: 'I',
  unit_cla_fuma: 'I',
  unit_irmaos_estupidos: 'I',
  unit_ranmaru: 'I',
  unit_familia_kurosuki: 'I',
  // R — elite / boss-lite
  unit_capitao_jonin: 'R',
  unit_guerreiro_kaguya: 'R',
  unit_jonin_elite: 'R',
  unit_aoi_rokusho: 'R',
  unit_esquadrao_anbu_elite: 'R',
  unit_raiga_kurosuki: 'R',

  // —— Jutsus deckable ——
  jutsu_kai: 'C',
  jutsu_kagura_shingan: 'C',
  jutsu_pilula_soldado: 'C',
  jutsu_doryuheki: 'C',
  jutsu_suna_shuriken: 'C',
  jutsu_omote_renge: 'C',
  jutsu_mikazuki_mai: 'C',
  jutsu_byakugan_rastreio: 'C',
  jutsu_substituicao: 'I',
  jutsu_lamina_vento: 'I',
  jutsu_daitoppa: 'I',
  jutsu_rashomon: 'I',
  jutsu_clones_sombras: 'I',
  jutsu_vontade_fogo: 'I',
  jutsu_gatsuga: 'I',
  jutsu_kikaichu: 'I',
  jutsu_seneijashu: 'I',
  jutsu_fuma_shuriken: 'I',
  jutsu_katsuyu_cura: 'I',
  jutsu_bola_de_fogo: 'R',
  jutsu_128_palmas: 'R',
  jutsu_dragao_agua: 'R',
  jutsu_daibakufu: 'R',
  jutsu_goka_mekkyaku: 'R',
  jutsu_jukai_kotan: 'R',
  jutsu_rasenshuriken: 'L',
  jutsu_manda: 'L',

  // —— Ocultos ——
  trap_selo_explosivo: 'C',
  trap_selo_cinco_elementos: 'C',
  trap_possessao_sombras: 'I',
  trap_arvore_genjutsu: 'I',
  trap_nevoa_venenosa: 'R',

  // —— Equipamentos deckable ——
  equip_kunai: 'C',
  equip_leque_temari: 'I',
  equip_kubikiribocho: 'R',
};

export function getRarityForId(id: string): CardRarity | undefined {
  return RARITY_BY_ID[id];
}

/** Anexa `rarity` se houver mapeamento; não altera tokens/exclusivos sem entrada. */
export function withCollectionRarity<T extends CardDef>(card: T): T {
  const rarity = RARITY_BY_ID[card.id];
  if (!rarity) return card;
  if (card.rarity === rarity) return card;
  return { ...card, rarity };
}

export function rarityLabel(rarity: CardRarity): string {
  return RARITY_DISPLAY_NAME[rarity];
}
