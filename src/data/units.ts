/**
 * Unidades (Parte 5 · Grupo 7): 44 Unidades da fase clássica + Tokens de grupo.
 *
 * Fonte aprovada: naruto-card-game/ninjas-vs-unidades.md (seção 3) e
 * proposta-cartas-classico.md (seções 4.1, 4.7 e 4.9). Unidades não têm patente.
 * Imagens: originais da Narutopedia (fase clássica / Parte I).
 *
 * Efeitos por carta: src/engine/unitEffects.ts.
 * Formação, Parceiro e Veneno X são palavras-chave do Grupo 5 (keywords); Início/Fim da rodada,
 * Investida e Último Desejo são dados `recurring` (Grupo 4). Integrado no merge 4+5+6+7.
 */
import { CharacterVisualDNA, Keyword, RecurringAbility, TeamFaction, UnitCardDef } from '../types/game';

const NP = 'https://static.wikia.nocookie.net/naruto/images';
const WIKI = 'https://naruto.fandom.com/wiki/';

const DNA_BASE: CharacterVisualDNA = {
  skinTone: '#F1C8A6',
  hairColor: '#1E293B',
  hairStyle: 'spiky_duckbutt',
  eyeStyle: 'determined_dark',
  outfitColor: '#166534',
  accentColor: '#94A3B8',
  hasHeadband: true,
  headbandColor: '#1E293B',
  evolvedAura: '#38BDF8',
};

interface UnitDraft {
  id: string;
  name: string;
  title: string;
  faction: TeamFaction;
  role: UnitCardDef['role'];
  cost: number;
  attack: number;
  health: number;
  keywords?: Keyword[];
  abilityText?: string;
  wikiTitle: string;
  /** Caminho depois de .../naruto/images/ (ex.: '4/4d/Academy.png/revision/latest/...'). */
  img: string;
  aniListSearch?: string;
  dna?: Partial<CharacterVisualDNA>;
  /** Habilidades recorrentes (Grupo 4): Início/Fim da rodada, Investida, Último Desejo... */
  recurring?: RecurringAbility[];
  /** Veneno X (Grupo 5): valor de X quando a carta tem a palavra-chave Veneno. */
  venenoX?: number;
}

function build(kind: 'unidade' | 'token', d: UnitDraft): UnitCardDef {
  return {
    id: d.id,
    kind,
    name: d.name,
    title: d.title,
    faction: d.faction,
    role: d.role,
    cost: d.cost,
    attack: d.attack,
    health: d.health,
    keywords: d.keywords ?? [],
    abilityText: d.abilityText ?? '',
    aniListSearch: d.aniListSearch ?? d.name,
    wikiTitle: d.wikiTitle,
    imageUrl: d.img.startsWith('http') ? d.img : `${NP}/${d.img}`,
    sourceUrl: WIKI + d.wikiTitle,
    visualDNA: { ...DNA_BASE, ...(d.dna ?? {}) },
    ...(d.recurring ? { recurring: d.recurring } : {}),
    ...(d.venenoX !== undefined ? { venenoX: d.venenoX } : {}),
  };
}
const unit = (d: UnitDraft) => build('unidade', d);
const token = (d: UnitDraft) => build('token', d);

// Imagens (scale-to-width-down/600, como no resto do jogo).
const IMG = {
  anbuKonoha: '7/7d/Konoha_Anbu.png/revision/latest/scale-to-width-down/600?cb=20150226122737',
  anbuCommander: '9/9d/Anbu_Commander.png/revision/latest/scale-to-width-down/600?cb=20111029000018',
  root: 'b/b4/Danzo_talking_to_Root_members.png/revision/latest/scale-to-width-down/600?cb=20210915205458',
  medical: '1/12/Medical_nin.png/revision/latest/scale-to-width-down/600?cb=20170216180242',
  uchihaPolice: '3/37/Uchiha_clan.png/revision/latest/scale-to-width-down/600?cb=20220205135141',
  examiners: '5/5f/Ch%C5%ABnin_Examiners.png/revision/latest/scale-to-width-down/600?cb=20150214121630',
  jonin: '6/6c/J%C5%8Dnin.png/revision/latest/scale-to-width-down/600?cb=20161116123512',
  suna: 'b/b0/Sunagakure.png/revision/latest/scale-to-width-down/600?cb=20201012155824',
  puppetForce: '8/8f/Puppet_Ninja_Force.png/revision/latest/scale-to-width-down/600?cb=20110812052858',
  hunterNin: '1/1a/Anbu_Haku.png/revision/latest/scale-to-width-down/600?cb=20141010134943',
  mistSwords: 'b/b5/Previous_Swordsmen_of_the_Mist.png/revision/latest/scale-to-width-down/600?cb=20150709140241',
  teamDosu: '3/31/Team_Dosu2.png/revision/latest/scale-to-width-down/600?cb=20150202182405',
  kaguya: '0/09/Kaguya_Men.png/revision/latest/scale-to-width-down/600?cb=20150924154027',
  academy: '4/4d/Academy.png/revision/latest/scale-to-width-down/600?cb=20111028205602',
  zaku: '4/40/Zaku_Abumi.PNG/revision/latest/scale-to-width-down/600?cb=20241001021714',
  dosu: 'b/b0/Dosu_Kinuta.png/revision/latest/scale-to-width-down/600?cb=20210421154038',
  kin: 'f/f3/Kin_Tsuchi.PNG/revision/latest/scale-to-width-down/600?cb=20241115003908',
  demonBrothers: '7/73/Demon_Brothers.png/revision/latest/scale-to-width-down/600?cb=20150722105627',
  meizu: '5/59/Meizu.png/revision/latest/scale-to-width-down/600?cb=20150116124718',
  kotetsu: '8/81/Kotetsu_Hagane.png/revision/latest/scale-to-width-down/600?cb=20160115135316',
  izumo: '5/5d/Izumo_Kamizuki.png/revision/latest/scale-to-width-down/600?cb=20140111135444',
  ebisu: '7/77/Ebisu.png/revision/latest/scale-to-width-down/600?cb=20160626182251',
  gato: 'd/d8/Gato.png/revision/latest/scale-to-width-down/600?cb=20150221135530',
  gatoThugs: '7/7d/Gato%27s_thugs.png/revision/latest/scale-to-width-down/600?cb=20220512005346',
  teamOboro: '5/5e/Team_Oboro.png/revision/latest/scale-to-width-down/600?cb=20150202183228',
  mubi: '9/9e/MubiProfile.png/revision/latest/scale-to-width-down/600?cb=20241207045439',
  mizuki: '9/9c/Mizuki.png/revision/latest/scale-to-width-down/600?cb=20150116115439',
  yoroi: '4/40/Yoroi_Akad%C5%8D.png/revision/latest/scale-to-width-down/600?cb=20251216120305',
  misumi: 'c/c6/Misumi_Tsurugi.png/revision/latest/scale-to-width-down/600?cb=20140829144143',
  ibiki: '4/4b/Ibiki_Part_I.png/revision/latest/scale-to-width-down/600?cb=20220218113218',
  genma: '9/90/Genma_Shiranui.png/revision/latest/scale-to-width-down/600?cb=20160122112630',
  tazuna: '4/46/Tazuna_Part_II.png/revision/latest/scale-to-width-down/600?cb=20180811083233',
  konohamaru: '8/89/Konohamaru_p1.png/revision/latest/scale-to-width-down/600?cb=20150122131608',
  iruka: 'b/bc/Iruka.png/revision/latest/scale-to-width-down/600?cb=20161013212102',
  hayate: '3/3a/Hayate_Gekk%C5%8D.png/revision/latest/scale-to-width-down/600?cb=20150118200748',
  shizune: '0/0a/Shizune_Infobox.png/revision/latest/scale-to-width-down/600?cb=20170726101304',
  tonton: 'b/b7/Tonton.png/revision/latest/scale-to-width-down/600?cb=20150130150127',
  anko: 'b/bd/Anko_Part_I.png/revision/latest/scale-to-width-down/600?cb=20170412103610',
  idate: '8/8c/Idate_Morino.png/revision/latest/scale-to-width-down/600?cb=20150221084104',
  aoi: 'f/f2/Aoi_Rokusho.png/revision/latest/scale-to-width-down/600?cb=20150221085046',
  sasame: 'a/a4/Sasame.png/revision/latest/scale-to-width-down/600?cb=20150601141133',
  arashi: 'f/fd/Arashi.png/revision/latest/scale-to-width-down/600?cb=20150601180429',
  hanzaki: '2/25/Hanzaki.png/revision/latest/scale-to-width-down/600?cb=20140708081733',
  stupidBrothers: '0/05/Legendary_Stupid_Brothers.PNG/revision/latest/scale-to-width-down/600?cb=20150601184924',
  bikochu: '6/6d/Bik%C5%8Dch%C5%AB.png/revision/latest/scale-to-width-down/600?cb=20150602102120',
  raiga: '4/41/Raiga_Kurosuki.png/revision/latest/scale-to-width-down/600?cb=20150804163223',
  ranmaru: 'f/f5/Ranmaru7.png/revision/latest/scale-to-width-down/600?cb=20150602201044',
  kurosuki: '0/0c/Black_Tornado_Preparation.png/revision/latest/scale-to-width-down/600?cb=20150424171104',
} as const;

// ================= UNIDADES (44 · sem patente · até 3 cópias) =================
export const UNIT_CARDS_G7: UnitCardDef[] = [
  // ---------- Custo 1 ----------
  unit({
    id: 'unit_estudante_academia', name: 'Estudante da Academia', title: 'Aspirante a Gennin', faction: 'Time 7', role: 'Genin',
    cost: 1, attack: 1, health: 2,
    abilityText: 'Entrada: se você tem um Ninja em campo, +1/+0 nesta rodada.',
    wikiTitle: 'Academy', img: IMG.academy, aniListSearch: 'Ninja Academy',
    dna: { hairColor: '#78350F', hairStyle: 'brown_wild', outfitColor: '#1D4ED8' },
  }),
  unit({
    id: 'unit_kin_tsuchi', name: 'Kin Tsuchi', title: 'Sinos de Otogakure', faction: 'Som & Sannin', role: 'Genin',
    cost: 1, attack: 1, health: 2, keywords: ['Furtivo', 'Formação'],
    abilityText: 'Formação: +1/+1 (3+ aliados em campo).',
    wikiTitle: 'Kin_Tsuchi', img: IMG.kin,
    dna: { hairColor: '#0F172A', hairStyle: 'indigo_long', outfitColor: '#475569', accentColor: '#A855F7', evolvedAura: '#A855F7' },
  }),
  unit({
    id: 'unit_tazuna', name: 'Tazuna', title: 'Construtor de Pontes', faction: 'Neutro', role: 'Genin',
    cost: 1, attack: 1, health: 2, keywords: ['Provocar'],
    abilityText: 'Fim da rodada: se houver um Ninja do Time 7 em campo, cure 1 da sua Vitalidade.',
    recurring: [
      { trigger: 'fim_rodada', condition: { allyNinjaFaction: 'Time 7' }, effects: [{ type: 'gate_heal', amount: 1 }] },
    ],
    wikiTitle: 'Tazuna', img: IMG.tazuna,
    dna: { hairColor: '#CBD5E1', hairStyle: 'silver_gravity', hasHeadband: false, marking: 'beard', outfitColor: '#A16207' },
  }),
  unit({
    id: 'unit_konohamaru', name: 'Konohamaru Sarutobi', title: 'Neto do Terceiro', faction: 'Time 7', role: 'Genin',
    cost: 1, attack: 1, health: 2, keywords: ['Provocar'],
    abilityText: 'Entrada: se Naruto estiver em campo, +1/+1 nesta rodada.',
    wikiTitle: 'Konohamaru_Sarutobi', img: IMG.konohamaru,
    dna: { hairColor: '#78350F', hairStyle: 'brown_wild', outfitColor: '#CA8A04', accentColor: '#1D4ED8' },
  }),
  unit({
    id: 'unit_bikochu', name: 'Besouro Bikōchū', title: 'Farejador do Time 8', faction: 'Time 8', role: 'Invocação',
    cost: 1, attack: 1, health: 1,
    abilityText: 'Entrada: revele 1 carta Oculto do rival (só para você).',
    wikiTitle: 'Bik%C5%8Dch%C5%AB', img: IMG.bikochu, aniListSearch: 'Bikochu',
    dna: { skinTone: '#1E293B', hairColor: '#0F172A', hairStyle: 'dark_hood', hasHeadband: false, outfitColor: '#334155', accentColor: '#22C55E', evolvedAura: '#22C55E' },
  }),

  // ---------- Custo 2 ----------
  unit({
    id: 'unit_anbu_konoha', name: 'Anbu de Konoha', title: 'Esquadrão de Operações Especiais', faction: 'Hokages', role: 'Anbu',
    cost: 2, attack: 2, health: 2, keywords: ['Furtivo'],
    wikiTitle: 'Anbu', img: IMG.anbuKonoha, aniListSearch: 'Anbu Konoha',
    dna: { outfitColor: '#334155', accentColor: '#E2E8F0', hasHeadband: false },
  }),
  unit({
    id: 'unit_medico_campo', name: 'Ninja Médico de Campo', title: 'Suporte Hospitalar de Konoha', faction: 'Time 7', role: 'Chunin',
    cost: 2, attack: 1, health: 3,
    abilityText: 'Entrada: cure 2 do aliado mais ferido.',
    wikiTitle: 'Medical-nin', img: IMG.medical, aniListSearch: 'Medical-nin',
    dna: { skinTone: '#FAD9C1', hairColor: '#451A03', hairStyle: 'pink_bob', eyeStyle: 'emerald', outfitColor: '#15803D', accentColor: '#10B981', headbandColor: '#1E3A8A', evolvedAura: '#10B981' },
  }),
  unit({
    id: 'unit_examinador_chunin', name: 'Examinador Chūnin', title: 'Vigilante dos Exames', faction: 'Time 8', role: 'Chunin',
    cost: 2, attack: 2, health: 3, keywords: ['Sensor'],
    wikiTitle: 'Ch%C5%ABnin', img: IMG.examiners, aniListSearch: 'Chunin',
    dna: { skinTone: '#E8BC96', hairColor: '#334155', hairStyle: 'bowl_cut', evolvedAura: '#22C55E' },
  }),
  unit({
    id: 'unit_oinin_nevoa', name: 'Oinin Caçador da Névoa', title: 'Esquadrão de Rastreamento', faction: 'Névoa', role: 'Anbu',
    cost: 2, attack: 2, health: 3, keywords: ['Intimidação'],
    wikiTitle: 'Hunter-nin', img: IMG.hunterNin, aniListSearch: 'Hunter-nin',
    dna: { skinTone: '#FCE3D2', hairColor: '#0F172A', hairStyle: 'indigo_long', outfitColor: '#0F766E', accentColor: '#CBD5E1', hasHeadband: false },
  }),
  unit({
    id: 'unit_gozu_meizu', name: 'Gōzu & Meizu', title: 'Irmãos Demônio', faction: 'Névoa', role: 'Chunin',
    cost: 2, attack: 2, health: 2,
    abilityText: 'Entrada: 1 de dano a um inimigo e crie Meizu 1/1 (Parceiro).',
    wikiTitle: 'Demon_Brothers', img: IMG.demonBrothers, aniListSearch: 'Demon Brothers',
    dna: { hairColor: '#0F172A', hairStyle: 'dark_hood', outfitColor: '#1E293B', accentColor: '#64748B', evolvedAura: '#0EA5E9' },
  }),
  unit({
    id: 'unit_dosu_kinuta', name: 'Dosu Kinuta', title: 'Ressonância Sonora', faction: 'Som & Sannin', role: 'Genin',
    cost: 2, attack: 2, health: 2, keywords: ['Formação'],
    abilityText: 'Ao atacar: 1 de dano ao bloqueador. Formação: +1/+1 (3+ aliados em campo).',
    wikiTitle: 'Dosu_Kinuta', img: IMG.dosu,
    dna: { skinTone: '#E2E8F0', hairColor: '#475569', hairStyle: 'dark_hood', outfitColor: '#57534E', accentColor: '#A855F7', evolvedAura: '#A855F7' },
  }),
  unit({
    id: 'unit_kotetsu_izumo', name: 'Kotetsu & Izumo', title: 'Guardas da Vitalidade', faction: 'Hokages', role: 'Chunin',
    cost: 2, attack: 2, health: 3, keywords: ['Provocar'],
    abilityText: 'Entrada: crie Izumo 1/2 (Provocar).',
    wikiTitle: 'Kotetsu_Hagane', img: IMG.kotetsu, aniListSearch: 'Kotetsu Hagane',
    dna: { hairStyle: 'spiky_duckbutt', marking: 'face_paint' },
  }),
  unit({
    id: 'unit_ebisu', name: 'Ebisu', title: 'Tutor de Elite', faction: 'Time 7', role: 'Sensei',
    cost: 2, attack: 1, health: 3,
    abilityText: 'Entrada: compre 1 carta se tiver um Gennin em campo.',
    wikiTitle: 'Ebisu', img: IMG.ebisu,
    dna: { eyeStyle: 'sunglasses', hairStyle: 'dark_hood', outfitColor: '#1E3A8A' },
  }),
  unit({
    id: 'unit_batedor_som', name: 'Ninjas do Som', title: 'Experimentos de Orochimaru', faction: 'Som & Sannin', role: 'Genin',
    cost: 2, attack: 2, health: 1, keywords: ['Imprudente'],
    abilityText: 'Entrada: crie 1 Ninja do Som 2/1 (Imprudente).',
    wikiTitle: 'Otogakure', img: IMG.teamDosu, aniListSearch: 'Otogakure',
    dna: { skinTone: '#E2E8F0', hairColor: '#334155', hairStyle: 'dark_hood', eyeStyle: 'amber', outfitColor: '#475569', accentColor: '#A855F7', headbandColor: '#334155', evolvedAura: '#A855F7' },
  }),
  unit({
    id: 'unit_genin_chuva', name: 'Genin da Chuva (Time Oboro)', title: 'Time Oboro de Amegakure', faction: 'Neutro', role: 'Genin',
    cost: 2, attack: 1, health: 2, keywords: ['Formação'],
    abilityText: 'Entrada: crie 2 Genin da Chuva 1/1 (Oboro e companheiros). Formação: +1/+1 para todos os Genin da Chuva (3+ aliados em campo).',
    wikiTitle: 'Team_Oboro', img: IMG.teamOboro, aniListSearch: 'Oboro',
    dna: { hairStyle: 'dark_hood', outfitColor: '#E7E5E4', accentColor: '#64748B', evolvedAura: '#64748B' },
  }),
  unit({
    id: 'unit_mizuki', name: 'Mizuki', title: 'Instrutor Traidor', faction: 'Time 7', role: 'Chunin',
    cost: 2, attack: 2, health: 2,
    abilityText: 'Entrada: pegue 1 Fūma Shuriken do deck e coloque na mão (se houver).',
    wikiTitle: 'Mizuki', img: IMG.mizuki,
    dna: { hairColor: '#CBD5E1', hairStyle: 'silver_ponytail' },
  }),
  unit({
    id: 'unit_yoroi_misumi', name: 'Yoroi Akadō & Misumi Tsurugi', title: 'Espiões de Kabuto', faction: 'Hokages', role: 'Genin',
    cost: 2, attack: 2, health: 2, keywords: ['Roubo de Vida'],
    abilityText: 'Entrada: crie Misumi 1/2 (Parceiro).',
    wikiTitle: 'Yoroi_Akad%C5%8D', img: IMG.yoroi, aniListSearch: 'Yoroi Akado',
    dna: { hairStyle: 'dark_hood', outfitColor: '#4C1D95', accentColor: '#A855F7' },
  }),
  unit({
    id: 'unit_genma_shiranui', name: 'Genma Shiranui', title: 'Senbon na Boca', faction: 'Hokages', role: 'Jounin',
    cost: 2, attack: 2, health: 2, keywords: ['Veneno'],
    abilityText: 'Veneno 1 (quem ele golpeia fica envenenado).',
    venenoX: 1,
    wikiTitle: 'Genma_Shiranui', img: IMG.genma,
    dna: { hairColor: '#78350F', hairStyle: 'brown_long' },
  }),
  unit({
    id: 'unit_iruka_umino', name: 'Iruka Umino', title: 'Professor da Academia', faction: 'Time 7', role: 'Chunin',
    cost: 2, attack: 2, health: 3, keywords: ['Apoio'],
    wikiTitle: 'Iruka_Umino', img: IMG.iruka,
    dna: { hairColor: '#3F2A1D', hairStyle: 'blonde_ponytail', marking: 'face_paint' },
  }),
  unit({
    id: 'unit_hayate_gekko', name: 'Hayate Gekkō', title: 'Árbitro das Preliminares', faction: 'Hokages', role: 'Jounin',
    cost: 2, attack: 3, health: 1, keywords: ['Ágil', 'Furtivo'],
    wikiTitle: 'Hayate_Gekk%C5%8D', img: IMG.hayate,
    dna: { skinTone: '#E2D3C3', hairColor: '#3F2A1D', hairStyle: 'brown_wild' },
  }),
  unit({
    id: 'unit_shizune', name: 'Shizune', title: 'Assistente de Tsunade', faction: 'Hokages', role: 'Jounin',
    cost: 2, attack: 1, health: 3,
    abilityText: 'Fim da rodada: cure 1 do aliado mais ferido. Entrada: crie Ton-Ton 1/2 (Parceiro).',
    recurring: [{ trigger: 'fim_rodada', effects: [{ type: 'heal', target: 'most_injured_ally', amount: 1 }] }],
    wikiTitle: 'Shizune', img: IMG.shizune,
    dna: { hairColor: '#0F172A', hairStyle: 'pink_bob', hasHeadband: false, outfitColor: '#1E293B', accentColor: '#10B981', evolvedAura: '#10B981' },
  }),
  unit({
    id: 'unit_idate_morino', name: 'Idate Morino', title: 'Corredor do País do Chá', faction: 'Neutro', role: 'Genin',
    cost: 2, attack: 2, health: 2, keywords: ['Ágil'],
    abilityText: 'Investida (sozinho): +1/+0 nesta rodada.',
    recurring: [
      { trigger: 'ao_atacar', condition: { attackingAlone: true }, effects: [{ type: 'buff', target: 'self', attack: 1, health: 0 }] },
    ],
    wikiTitle: 'Idate_Morino', img: IMG.idate,
    dna: { hairColor: '#0F172A', hairStyle: 'spiky_duckbutt', hasHeadband: false, outfitColor: '#B45309' },
  }),
  unit({
    id: 'unit_sasame_fuma', name: 'Sasame Fūma', title: 'Herdeira do Clã Fūma', faction: 'Som & Sannin', role: 'Genin',
    cost: 2, attack: 2, health: 2,
    abilityText: 'Entrada: crie 1 Fūma Shuriken Fugaz (Taijutsu) na mão.',
    wikiTitle: 'Sasame', img: IMG.sasame,
    dna: { hairColor: '#EA580C', hairStyle: 'orange_spiky', outfitColor: '#1E3A8A' },
  }),

  // ---------- Custo 3 ----------
  unit({
    id: 'unit_policia_uchiha', name: 'Policial Militar Uchiha', title: 'Força de Segurança da Folha', faction: 'Time 7', role: 'Jounin',
    cost: 3, attack: 3, health: 3,
    abilityText: 'Início da rodada: ganha Esquiva.',
    recurring: [{ trigger: 'inicio_rodada', effects: [{ type: 'barrier', target: 'self' }] }],
    wikiTitle: 'Konoha_Military_Police_Force', img: IMG.uchihaPolice, aniListSearch: 'Uchiha Police',
    dna: { skinTone: '#F9D6B8', hairColor: '#0F172A', eyeStyle: 'sharingan', outfitColor: '#1E3A8A', accentColor: '#DC2626', evolvedAura: '#EF4444' },
  }),
  unit({
    id: 'unit_raiz_ne', name: 'Agente da Raiz (Ne)', title: 'Divisão Oculta de Konoha', faction: 'Hokages', role: 'Anbu',
    cost: 3, attack: 3, health: 2, keywords: ['Intimidação'],
    wikiTitle: 'Root', img: IMG.root, aniListSearch: 'Root Naruto',
    dna: { skinTone: '#E2E8F0', hairColor: '#0F172A', hairStyle: 'dark_hood', outfitColor: '#1E293B', hasHeadband: false, evolvedAura: '#64748B' },
  }),
  unit({
    id: 'unit_escaramucador_nevoa', name: 'Espadachim da Névoa', title: 'Lâminas Ocultas de Kirigakure', faction: 'Névoa', role: 'Chunin',
    cost: 3, attack: 3, health: 2, keywords: ['Ágil'],
    wikiTitle: 'Seven_Ninja_Swordsmen_of_the_Mist', img: IMG.mistSwords, aniListSearch: 'Kirigakure',
    dna: { skinTone: '#E6C2A5', hairColor: '#475569', outfitColor: '#1E293B', accentColor: '#38BDF8', evolvedAura: '#0EA5E9' },
  }),
  unit({
    id: 'unit_brigada_marionetes', name: 'Brigada de Marionetes', title: 'Corpo Técnico da Areia', faction: 'Areia', role: 'Chunin',
    cost: 3, attack: 2, health: 3,
    abilityText: 'Entrada: invoque Karasu (3/2, Clone).',
    wikiTitle: 'Puppet_Ninja_Force', img: IMG.puppetForce, aniListSearch: 'Puppet Brigade',
    dna: { skinTone: '#E8C5A5', hairStyle: 'dark_hood', eyeStyle: 'amber', outfitColor: '#312E81', accentColor: '#A855F7', evolvedAura: '#9333EA' },
  }),
  unit({
    id: 'unit_zaku_abumi', name: 'Zaku Abumi', title: 'Ondas de Ar Cortante', faction: 'Som & Sannin', role: 'Genin',
    cost: 3, attack: 3, health: 2, keywords: ['Perfurante', 'Formação'],
    abilityText: 'Formação: +1/+1 (3+ aliados em campo).',
    wikiTitle: 'Zaku_Abumi', img: IMG.zaku,
    dna: { hairColor: '#0F172A', outfitColor: '#475569', accentColor: '#A855F7', evolvedAura: '#A855F7' },
  }),
  unit({
    id: 'unit_gato_bandidos', name: 'Gatō e seus Bandidos', title: 'Magnata do País das Ondas', faction: 'Neutro', role: 'Genin',
    cost: 3, attack: 2, health: 3,
    abilityText: 'Entrada: crie 2 Bandidos 1/1 (sem habilidade).',
    wikiTitle: 'Gat%C5%8D', img: IMG.gato, aniListSearch: 'Gato',
    dna: { hairColor: '#334155', hairStyle: 'silver_gravity', eyeStyle: 'sunglasses', hasHeadband: false, outfitColor: '#1E293B' },
  }),
  unit({
    id: 'unit_batedor_areia', name: 'Ninjas da Areia', title: 'Patrulha das Dunas', faction: 'Areia', role: 'Genin',
    cost: 3, attack: 2, health: 2,
    abilityText: 'Entrada: crie 2 Ninjas de Areia 1/1. Investida (sozinho): ganha Furtivo nesta rodada.',
    recurring: [
      { trigger: 'ao_atacar', condition: { attackingAlone: true }, effects: [{ type: 'gain_keyword', target: 'self', keyword: 'Furtivo' }] },
    ],
    wikiTitle: 'Sunagakure', img: IMG.suna, aniListSearch: 'Sunagakure ninja',
    dna: { skinTone: '#E6C2A5', hairColor: '#78350F', hairStyle: 'dark_hood', outfitColor: '#92400E', accentColor: '#FDE047', headbandColor: '#334155', evolvedAura: '#D97706' },
  }),
  unit({
    id: 'unit_ibiki_morino', name: 'Ibiki Morino', title: 'Interrogador Especial', faction: 'Hokages', role: 'Jounin',
    cost: 3, attack: 3, health: 3, keywords: ['Intimidação'],
    abilityText: 'Entrada: o rival descarta 1 carta à escolha dele.',
    wikiTitle: 'Ibiki_Morino', img: IMG.ibiki,
    dna: { hairStyle: 'dark_hood', marking: 'face_paint', outfitColor: '#0F172A' },
  }),
  unit({
    id: 'unit_esquadrao_anbu', name: 'Esquadrão Anbu de Konoha', title: 'Célula de Quatro', faction: 'Hokages', role: 'Anbu',
    cost: 3, attack: 2, health: 2, keywords: ['Furtivo'],
    abilityText: 'Entrada: crie 1 Anbu 2/1 (Furtivo).',
    wikiTitle: 'Anbu', img: IMG.anbuKonoha, aniListSearch: 'Anbu Konoha',
    dna: { outfitColor: '#334155', accentColor: '#E2E8F0', hasHeadband: false },
  }),
  unit({
    id: 'unit_anko_mitarashi', name: 'Anko Mitarashi', title: 'Examinadora da Floresta da Morte', faction: 'Hokages', role: 'Jounin',
    cost: 3, attack: 3, health: 2, keywords: ['Veneno'],
    abilityText: 'Veneno 1 (quem ela golpeia fica envenenado). Investida (Selo Amaldiçoado): 1 vez por rodada, se a Vitalidade tiver 5+, pague 2 de Vida: +3/+0.',
    venenoX: 1,
    recurring: [
      {
        trigger: 'ao_atacar',
        oncePerRound: true,
        condition: { minOwnGate: 4 },
        effects: [{ type: 'pay_gate', amount: 2 }, { type: 'buff', target: 'self', attack: 3, health: 0 }],
        text: 'Selo Amaldiçoado: pague 2 de Vida da sua Vitalidade e ganhe +3/+0 nesta rodada (1 vez por rodada).',
      },
    ],
    wikiTitle: 'Anko_Mitarashi', img: IMG.anko,
    dna: { hairColor: '#4C1D95', hairStyle: 'blonde_ponytail', eyeStyle: 'amber', outfitColor: '#57534E', marking: 'curse_seal' },
  }),
  unit({
    id: 'unit_arashi_fuma', name: 'Arashi (Fūma)', title: 'Marionete de Orochimaru', faction: 'Som & Sannin', role: 'Chunin',
    cost: 3, attack: 3, health: 3,
    abilityText: 'Último Desejo: crie 1 Marionete 1/1.',
    recurring: [{ trigger: 'ultimo_desejo', effects: [{ type: 'summon', tokenId: 'token_marionete' }] }],
    wikiTitle: 'Arashi', img: IMG.arashi,
    dna: { hairColor: '#A78BFA', hairStyle: 'pale_long', outfitColor: '#1E293B', accentColor: '#A855F7', evolvedAura: '#A855F7' },
  }),
  unit({
    id: 'unit_cla_fuma', name: 'Clã Fūma', title: 'Guerreiros do País do Arroz', faction: 'Som & Sannin', role: 'Chunin',
    cost: 3, attack: 2, health: 3,
    abilityText: 'Entrada: crie 2 Guerreiros Fūma 1/1 (Provocar).',
    wikiTitle: 'F%C5%ABma_Clan', img: IMG.hanzaki, aniListSearch: 'Fuuma',
    dna: { hairStyle: 'dark_hood', outfitColor: '#57534E', accentColor: '#A855F7' },
  }),
  unit({
    id: 'unit_irmaos_estupidos', name: 'Irmãos Estúpidos Lendários', title: 'Capangas de Mizuki', faction: 'Neutro', role: 'Genin',
    cost: 3, attack: 2, health: 4, keywords: ['Provocar'],
    abilityText: 'Entrada: crie 1 Irmão Estúpido 2/2.',
    wikiTitle: 'Legendary_Stupid_Brothers', img: IMG.stupidBrothers,
    dna: { skinTone: '#B45309', hairStyle: 'dark_hood', hasHeadband: false, outfitColor: '#365314' },
  }),
  unit({
    id: 'unit_ranmaru', name: 'Ranmaru', title: 'Olhos de Raiga', faction: 'Névoa', role: 'Genin',
    cost: 3, attack: 3, health: 3,
    abilityText: 'Entrada: se Raiga Kurosuki estiver em campo, ambos ganham +1/+1.',
    wikiTitle: 'Ranmaru', img: IMG.ranmaru,
    dna: { hairColor: '#7C3AED', hairStyle: 'pink_bob', hasHeadband: false, outfitColor: '#334155' },
  }),
  unit({
    id: 'unit_familia_kurosuki', name: 'Família Kurosuki', title: 'Bando de Raiga', faction: 'Névoa', role: 'Chunin',
    cost: 3, attack: 2, health: 3,
    abilityText: 'Entrada: crie 2 Capangas Kurosuki 1/1.',
    wikiTitle: 'Kurosuki_Family', img: IMG.kurosuki, aniListSearch: 'Kurosuki',
    dna: { hairStyle: 'dark_hood', outfitColor: '#1E293B', accentColor: '#FACC15' },
  }),

  // ---------- Custo 4 ----------
  unit({
    id: 'unit_capitao_jonin', name: 'Capitão Jōnin da Folha', title: 'Veterano de Guerra', faction: 'Time 9', role: 'Jounin',
    cost: 4, attack: 4, health: 4, keywords: ['Resistente'],
    wikiTitle: 'J%C5%8Dnin', img: IMG.jonin, aniListSearch: 'Jonin',
    dna: { skinTone: '#E8B78E', hairStyle: 'goatee_spiky', accentColor: '#F59E0B', headbandColor: '#1E3A8A', evolvedAura: '#F59E0B' },
  }),
  unit({
    id: 'unit_guerreiro_kaguya', name: 'Guerreiro do Clã Kaguya', title: 'Vanguarda Óssea', faction: 'Som & Sannin', role: 'Jounin',
    cost: 4, attack: 3, health: 5, keywords: ['Muralha'],
    wikiTitle: 'Kaguya_Clan', img: IMG.kaguya, aniListSearch: 'Kaguya clan',
    dna: { skinTone: '#F8FAFC', hairColor: '#CBD5E1', hairStyle: 'pale_long', eyeStyle: 'emerald', outfitColor: '#334155', accentColor: '#E2E8F0', hasHeadband: false, evolvedAura: '#9333EA' },
  }),
  unit({
    id: 'unit_jonin_elite', name: 'Jōnin de Elite de Konoha', title: 'Líder de Esquadrão', faction: 'Hokages', role: 'Jounin',
    cost: 4, attack: 4, health: 3, keywords: ['Apoio'],
    wikiTitle: 'J%C5%8Dnin', img: IMG.jonin, aniListSearch: 'Jonin',
    dna: { hairStyle: 'goatee_spiky', accentColor: '#F59E0B' },
  }),
  unit({
    id: 'unit_aoi_rokusho', name: 'Aoi Rokushō', title: 'Traidor da Folha', faction: 'Neutro', role: 'Jounin',
    cost: 4, attack: 4, health: 4, keywords: ['Intimidação'],
    abilityText: 'Entrada: crie a Espada do Deus do Trovão (Equipamento) na sua mão.',
    wikiTitle: 'Aoi_Rokush%C5%8D', img: IMG.aoi,
    dna: { hairColor: '#0F172A', hairStyle: 'indigo_long', outfitColor: '#334155', accentColor: '#FACC15', evolvedAura: '#FACC15' },
  }),

  // ---------- Custo 5 ----------
  unit({
    id: 'unit_esquadrao_anbu_elite', name: 'Esquadrão Anbu de Elite', title: 'Guarda do Hokage', faction: 'Hokages', role: 'Anbu',
    cost: 5, attack: 5, health: 4, keywords: ['Furtivo'],
    abilityText: 'Entrada: 2 de dano a um inimigo.',
    wikiTitle: 'Anbu', img: IMG.anbuCommander, aniListSearch: 'Anbu Konoha',
    dna: { outfitColor: '#0F172A', accentColor: '#E2E8F0', hasHeadband: false },
  }),
  unit({
    id: 'unit_raiga_kurosuki', name: 'Raiga Kurosuki', title: 'Espadachim do Trovão', faction: 'Névoa', role: 'Jounin',
    cost: 5, attack: 5, health: 4, keywords: ['Ágil', 'Impacto'],
    wikiTitle: 'Raiga_Kurosuki', img: IMG.raiga,
    dna: { hairColor: '#1E293B', hairStyle: 'black_wavy', outfitColor: '#1E293B', accentColor: '#FACC15', evolvedAura: '#FACC15' },
  }),
];

// ================= TOKENS DE GRUPO (criados pelas Unidades; não entram no baralho) =================
export const UNIT_TOKENS_G7: Record<string, UnitCardDef> = Object.fromEntries(
  [
    token({ id: 'token_meizu', name: 'Meizu', title: 'Token · Parceiro', faction: 'Névoa', role: 'Invocação', cost: 1, attack: 1, health: 1, keywords: ['Parceiro'], abilityText: 'Parceiro de Gōzu.', wikiTitle: 'Meizu', img: IMG.meizu, dna: { hairStyle: 'dark_hood' } }),
    token({ id: 'token_izumo', name: 'Izumo', title: 'Token · Guarda', faction: 'Hokages', role: 'Invocação', cost: 1, attack: 1, health: 2, keywords: ['Provocar'], wikiTitle: 'Izumo_Kamizuki', img: IMG.izumo, dna: { hairStyle: 'indigo_long' } }),
    token({ id: 'token_bandido', name: 'Bandido', title: 'Token · Capanga de Gatō', faction: 'Neutro', role: 'Invocação', cost: 1, attack: 1, health: 1, wikiTitle: 'Gat%C5%8D', img: IMG.gatoThugs, dna: { hasHeadband: false } }),
    token({ id: 'token_ninja_areia', name: 'Ninja de Areia', title: 'Token · Patrulha', faction: 'Areia', role: 'Invocação', cost: 1, attack: 1, health: 1, wikiTitle: 'Sunagakure', img: IMG.suna, dna: { hairStyle: 'dark_hood', outfitColor: '#92400E' } }),
    token({ id: 'token_ninja_som', name: 'Ninja do Som', title: 'Token · Otogakure', faction: 'Som & Sannin', role: 'Invocação', cost: 1, attack: 2, health: 1, keywords: ['Imprudente'], wikiTitle: 'Otogakure', img: IMG.teamDosu, dna: { hairStyle: 'dark_hood', outfitColor: '#475569' } }),
    token({ id: 'token_genin_chuva', name: 'Genin da Chuva', title: 'Token · Time Oboro', faction: 'Neutro', role: 'Invocação', cost: 1, attack: 1, health: 1, keywords: ['Formação'], wikiTitle: 'Mubi', img: IMG.mubi, dna: { hairStyle: 'dark_hood', outfitColor: '#E7E5E4' } }),
    token({ id: 'token_misumi', name: 'Misumi Tsurugi', title: 'Token · Parceiro', faction: 'Hokages', role: 'Invocação', cost: 1, attack: 1, health: 2, keywords: ['Parceiro'], abilityText: 'Parceiro de Yoroi.', wikiTitle: 'Misumi_Tsurugi', img: IMG.misumi, dna: { eyeStyle: 'sunglasses' } }),
    token({ id: 'token_anbu', name: 'Anbu', title: 'Token · Esquadrão', faction: 'Hokages', role: 'Invocação', cost: 1, attack: 2, health: 1, keywords: ['Furtivo'], wikiTitle: 'Anbu', img: IMG.anbuKonoha, dna: { hasHeadband: false, outfitColor: '#334155' } }),
    token({ id: 'token_guerreiro_fuma', name: 'Guerreiro Fūma', title: 'Token · Clã Fūma', faction: 'Som & Sannin', role: 'Invocação', cost: 1, attack: 1, health: 1, keywords: ['Provocar'], wikiTitle: 'Hanzaki', img: IMG.hanzaki, dna: { hairStyle: 'dark_hood' } }),
    token({ id: 'token_marionete', name: 'Marionete', title: 'Token · Marionete de Arashi', faction: 'Som & Sannin', role: 'Invocação', cost: 1, attack: 1, health: 1, wikiTitle: 'Arashi', img: IMG.arashi, dna: { hairStyle: 'pale_long', outfitColor: '#1E293B' } }),
    token({ id: 'token_irmao_estupido', name: 'Irmão Estúpido', title: 'Token · Irmãos Lendários', faction: 'Neutro', role: 'Invocação', cost: 1, attack: 2, health: 2, wikiTitle: 'Legendary_Stupid_Brothers', img: IMG.stupidBrothers, dna: { hasHeadband: false } }),
    token({ id: 'token_capanga_kurosuki', name: 'Capanga Kurosuki', title: 'Token · Família Kurosuki', faction: 'Névoa', role: 'Invocação', cost: 1, attack: 1, health: 1, wikiTitle: 'Kurosuki_Family', img: IMG.kurosuki, dna: { hairStyle: 'dark_hood' } }),
    token({ id: 'token_tonton', name: 'Ton-Ton', title: 'Token · Parceiro', faction: 'Hokages', role: 'Invocação', cost: 1, attack: 1, health: 2, keywords: ['Regenerar', 'Parceiro'], abilityText: 'Parceiro de Shizune.', wikiTitle: 'Tonton', img: IMG.tonton, dna: { skinTone: '#F9A8D4', hasHeadband: false } }),
  ].map((t) => [t.id, t])
);

/**
 * Registro (só conferência/testes) das Unidades que receberam Formação, Parceiro e Veneno X
 * do Grupo 5. As palavras-chave reais estão em `keywords`/`venenoX` de cada carta acima.
 */
export const UNIT_PENDING_KEYWORDS: Record<string, { formacao?: boolean; parceiro?: boolean; venenoX?: number }> = {
  unit_kin_tsuchi: { formacao: true },
  unit_dosu_kinuta: { formacao: true },
  unit_zaku_abumi: { formacao: true },
  unit_genin_chuva: { formacao: true },
  token_genin_chuva: { formacao: true },
  unit_genma_shiranui: { venenoX: 1 },
  unit_anko_mitarashi: { venenoX: 1 },
  token_meizu: { parceiro: true },
  token_misumi: { parceiro: true },
  token_tonton: { parceiro: true },
};

/** Tokens de Parceiro e a Unidade que eles acompanham (unitEffects usa summonPartner do Grupo 5). */
export const UNIT_PARTNER_TOKENS: Record<string, string> = {
  unit_gozu_meizu: 'token_meizu',
  unit_yoroi_misumi: 'token_misumi',
  unit_shizune: 'token_tonton',
};
