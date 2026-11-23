/**
 * Carregador de imagens oficiais da Narutopedia (naruto.fandom.com).
 *
 * Regras:
 * 1. A carta usa primeiro a URL salva em `imageUrl` / `imageUrls` (src/data/cards.ts).
 * 2. Só se a carta não tiver URL salva é que consultamos a API pública da Narutopedia
 *    pelo `wikiTitle` (títulos acentuados como "Kurenai_Yūhi" são codificados corretamente).
 * 3. Não existe nenhum fallback por nome em outros sites (AniList/MyAnimeList foram removidos),
 *    porque eles podiam devolver outro personagem. Se a Narutopedia falhar, o componente
 *    mostra um placeholder com o nome da carta.
 */
import type { CardDef, RankImageUrls } from '../types/game';

const WIKI_API = 'https://naruto.fandom.com/api.php';
const WIKI_CACHE_KEY = 'shinobi_chronicles_wiki_media_v5';
const WIKI_RANK_CACHE_KEY = 'shinobi_chronicles_wiki_ranks_v5';

type RankTuple = [string | null, string | null, string | null];

const wikiMemoryCache: Record<string, string | null> = {};
const rankMemoryCache: Record<string, RankTuple> = {};
const wikiInflight = new Map<string, Promise<string | null>>();
const rankInflight = new Map<string, Promise<RankTuple>>();

function loadCache<T>(storageKey: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function saveCacheEntry<T>(storageKey: string, key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    const stored = loadCache<T>(storageKey);
    stored[key] = value;
    localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch {
    // Ignora erros de cota do localStorage
  }
}

/**
 * Normaliza um título da wiki para a forma canônica com sublinhados e sem
 * codificação prévia (ex.: "Mind%27s_Eye" → "Mind's_Eye", "Kurenai Yūhi" → "Kurenai_Yūhi").
 */
export function normalizeWikiTitle(title: string): string {
  let t = title.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    // Título já estava decodificado
  }
  return t.replace(/ /g, '_');
}

/** Codifica o título para uso em URL (ū, ō, apóstrofos etc. viram %XX corretamente). */
export function encodeWikiTitle(title: string): string {
  return encodeURIComponent(normalizeWikiTitle(title));
}

/** URL da página da Narutopedia para um título. */
export function wikiPageUrl(title: string): string {
  return `https://naruto.fandom.com/wiki/${encodeWikiTitle(title)}`;
}

async function fetchJson(url: string, timeoutMs = 7000): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, referrerPolicy: 'no-referrer' });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Imagem principal (pageimage) de uma página da Narutopedia, ou null.
 * Usado apenas quando a carta não tem `imageUrl` salvo.
 */
export function fetchWikiImage(wikiTitle: string): Promise<string | null> {
  if (!wikiTitle) return Promise.resolve(null);
  const key = normalizeWikiTitle(wikiTitle);

  if (key in wikiMemoryCache) return Promise.resolve(wikiMemoryCache[key]);
  const stored = loadCache<string>(WIKI_CACHE_KEY);
  if (stored[key]) {
    wikiMemoryCache[key] = stored[key];
    return Promise.resolve(stored[key]);
  }
  if (wikiInflight.has(key)) return wikiInflight.get(key)!;

  const promise = (async () => {
    const url =
      `${WIKI_API}?action=query&format=json&origin=*&redirects=1` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=600&titles=${encodeWikiTitle(key)}`;
    const json = await fetchJson(url);
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const page = pages[0] as { missing?: string; thumbnail?: { source?: string } } | undefined;
    const src = page && page.missing === undefined ? page.thumbnail?.source || null : null;
    wikiMemoryCache[key] = src;
    if (src) saveCacheEntry(WIKI_CACHE_KEY, key, src);
    return src;
  })().finally(() => wikiInflight.delete(key));

  wikiInflight.set(key, promise);
  return promise;
}

/**
 * Retratos do infobox da página do personagem (abas Parte I / Parte II / Parte III),
 * na ordem em que aparecem. Usado só quando o Ninja não tem `imageUrls` salvo.
 */
export function fetchWikiRankImages(wikiTitle: string): Promise<RankTuple> {
  if (!wikiTitle) return Promise.resolve([null, null, null]);
  const key = normalizeWikiTitle(wikiTitle);

  if (rankMemoryCache[key]) return Promise.resolve(rankMemoryCache[key]);
  const stored = loadCache<RankTuple>(WIKI_RANK_CACHE_KEY);
  if (stored[key]) {
    rankMemoryCache[key] = stored[key];
    return Promise.resolve(stored[key]);
  }
  if (rankInflight.has(key)) return rankInflight.get(key)!;

  const promise = (async (): Promise<RankTuple> => {
    const url =
      `${WIKI_API}?action=parse&format=json&origin=*&redirects=1` +
      `&prop=text&section=0&page=${encodeWikiTitle(key)}`;
    const json = await fetchJson(url);
    const html: string = json?.parse?.text?.['*'] || '';
    const portraits: string[] = [];
    const imgRe = /<img [^>]*>/g;
    let match: RegExpExecArray | null;
    while ((match = imgRe.exec(html))) {
      const tag = match[0];
      const name = /data-image-name="([^"]+)"/.exec(tag)?.[1] || '';
      const src = /(?:data-src|src)="(https:\/\/static\.wikia\.nocookie\.net[^"]+)"/.exec(tag)?.[1];
      if (!src || !name || /\.svg$/i.test(name)) continue;
      const clean = src.replace(/&amp;/g, '&');
      if (!portraits.includes(clean)) portraits.push(clean);
    }
    const base = portraits[0] || (await fetchWikiImage(key));
    const tuple: RankTuple = [
      base,
      portraits[1] || base,
      portraits[2] || portraits[1] || base,
    ];
    rankMemoryCache[key] = tuple;
    if (base) saveCacheEntry(WIKI_RANK_CACHE_KEY, key, tuple);
    return tuple;
  })().finally(() => rankInflight.delete(key));

  rankInflight.set(key, promise);
  return promise;
}

/** URL salva na carta para a graduação pedida (sem rede). */
export function getSavedCardImage(card: CardDef, rank: 1 | 2 | 3 = 1): string | null {
  if (card.kind === 'ninja' && card.imageUrls) {
    const byRank: Record<1 | 2 | 3, keyof RankImageUrls> = {
      1: 'gennin',
      2: 'chuunin',
      3: 'jounnin',
    };
    return card.imageUrls[byRank[rank]] || card.imageUrl || null;
  }
  return card.imageUrl || null;
}

/**
 * Resolve a imagem de uma carta: primeiro a URL salva, depois a API da Narutopedia.
 * Nunca devolve imagem de outra fonte; retorna null para o placeholder.
 */
export async function resolveCardImage(card: CardDef, rank: 1 | 2 | 3 = 1): Promise<string | null> {
  const saved = getSavedCardImage(card, rank);
  if (saved) return saved;
  if (!card.wikiTitle) return null;
  if (card.kind === 'ninja') {
    const tuple = await fetchWikiRankImages(card.wikiTitle);
    return tuple[rank - 1] || null;
  }
  return fetchWikiImage(card.wikiTitle);
}
