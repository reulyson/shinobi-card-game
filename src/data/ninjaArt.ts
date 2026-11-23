import type { RankImageUrls } from '../types/game';

/** Pasta pública por ninja: `public/art/ninjas/<cardId>/`. O `cardId` = campo `id` em `ninjas.ts`. */
export const NINJA_ART_ROOT = '/art/ninjas';

export type NinjaRankFile = keyof RankImageUrls;

/** URL servida pelo Vite para retrato local (PNG/WebP com fundo transparente). */
export function ninjaArtPath(cardId: string, rank: NinjaRankFile, ext: 'png' | 'webp' = 'png'): string {
  return `${NINJA_ART_ROOT}/${cardId}/${rank}.${ext}`;
}

/** Três patentes no mesmo diretório do ninja. */
export function ninjaLocalImageUrls(cardId: string, ext: 'png' | 'webp' = 'png'): RankImageUrls {
  return {
    gennin: ninjaArtPath(cardId, 'gennin', ext),
    chuunin: ninjaArtPath(cardId, 'chuunin', ext),
    jounnin: ninjaArtPath(cardId, 'jounnin', ext),
  };
}

/** Pop-out opcional: mesmo arquivo ou `gennin-popout.png` se o recorte for diferente. */
export function ninjaPopoutPath(cardId: string, rank: NinjaRankFile, ext: 'png' | 'webp' = 'png'): string {
  return `${NINJA_ART_ROOT}/${cardId}/${rank}-popout.${ext}`;
}