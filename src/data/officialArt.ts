/**
 * Arte oficial da Narutopedia (static.wikia.nocookie.net).
 * O CDN recusa imagens com Referer de outro site: use sempre referrerPolicy="no-referrer"
 * (a página já tem <meta name="referrer" content="no-referrer">) e o componente OfficialImage,
 * que tenta de novo com "nr=1" se a primeira carga falhar (cache antigo de 404).
 */
const W = 'https://static.wikia.nocookie.net/naruto/images';

export const OFFICIAL_ART = {
  /** Início: Monte Hokage sobre Konoha. */
  hokageRock: `${W}/c/cf/Hokage_Rock.png/revision/latest/scale-to-width-down/1280?cb=20170405113241`,
  /** Montar Deck / Grimório: vista aérea de Konohagakure. */
  konohaAerial: `${W}/3/34/Konohagakure.png/revision/latest/scale-to-width-down/1280?cb=20160728115517`,
  /** Guia Ninja / Histórico: pergaminhos (Céu e Terra). */
  scrolls: `${W}/8/83/Scrolls.png/revision/latest/scale-to-width-down/1280?cb=20150217201027`,
  /** Arenas */
  valleyOfTheEnd: `${W}/4/48/Valley_of_the_End.png/revision/latest/scale-to-width-down/1280?cb=20150414024937`,
  forestOfDeath: `${W}/c/cd/Forest_tower.png/revision/latest/scale-to-width-down/1280?cb=20150206065634`,
  chuninStadium: `${W}/9/9d/Ch%C5%ABnin_Exams_Stadium.png/revision/latest/scale-to-width-down/1280?cb=20170619080425`,
  konohaRooftops: `${W}/9/91/Konoha.png/revision/latest/scale-to-width-down/1280?cb=20150824051911`,
  /** Fundo fixo da batalha (fase clássica): Estádio do Exame Chūnin. */
  battleBackground: `${W}/9/9d/Ch%C5%ABnin_Exams_Stadium.png/revision/latest?cb=20170619080425`,
  /** Arte de carta (substitui retrato genérico) */
  demonicIllusion: `${W}/0/09/Demonic_Illusion.png/revision/latest/scale-to-width-down/1280?cb=20240820183706`,
} as const;

/** Símbolos oficiais (SVG) das vilas. */
export const VILLAGE_SYMBOLS = {
  konoha: `${W}/d/de/Konohagakure_Symbol.svg/revision/latest?cb=20090830222821`,
  suna: `${W}/1/18/Sunagakure_Symbol.svg/revision/latest?cb=20100714205222`,
  kiri: `${W}/e/e5/Kirigakure_Symbol.svg/revision/latest?cb=20090830222755`,
  oto: `${W}/f/f3/Otogakure_Symbol.svg/revision/latest?cb=20090830222821`,
  uzumaki: `${W}/8/89/Uzumaki_Symbol.svg/revision/latest?cb=20180407232103`,
} as const;

export type VillageKey = keyof typeof VILLAGE_SYMBOLS;

/** Vila de cada facção do jogo (para o símbolo no Portão). */
export function villageOfFaction(faction?: string): VillageKey {
  if (faction === 'Areia') return 'suna';
  if (faction === 'Névoa') return 'kiri';
  if (faction === 'Som & Sannin') return 'oto';
  return 'konoha';
}
