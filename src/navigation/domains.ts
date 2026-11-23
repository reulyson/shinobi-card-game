export type AppDomain =
  | 'lobby'
  | 'grimorio'
  | 'montar-deck'
  | 'guia-ninja'
  | 'historico'
  | 'batalha';

export type ScreenFromDomain = Exclude<AppDomain, 'batalha'> | 'battle';

export const DOMAIN_PATH: Record<AppDomain, string> = {
  lobby: '/',
  grimorio: '/grimorio',
  'montar-deck': '/montar-deck',
  'guia-ninja': '/guia-ninja',
  historico: '/historico',
  batalha: '/batalha',
};

const PATH_TO_DOMAIN: Record<string, AppDomain> = {
  '/': 'lobby',
  '/inicio': 'lobby',
  '/lobby': 'lobby',
  '/grimorio': 'grimorio',
  '/montar-deck': 'montar-deck',
  '/deck': 'montar-deck',
  '/guia-ninja': 'guia-ninja',
  '/guia': 'guia-ninja',
  '/rules': 'guia-ninja',
  '/historico': 'historico',
  '/history': 'historico',
  '/batalha': 'batalha',
};

export function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export type MontarDeckView = 'hub' | 'criar' | 'editar';

export function montarDeckViewFromPath(pathname: string): { view: MontarDeckView; deckId?: string } {
  const normalized = normalizePathname(pathname);
  if (normalized === '/montar-deck' || normalized === '/deck') {
    return { view: 'hub' };
  }
  if (normalized === '/montar-deck/criar') {
    return { view: 'criar' };
  }
  const editMatch = /^\/montar-deck\/editar\/([^/]+)$/.exec(normalized);
  if (editMatch) {
    return { view: 'editar', deckId: decodeURIComponent(editMatch[1]) };
  }
  return { view: 'hub' };
}

export function domainFromPathname(pathname: string): AppDomain {
  const normalized = normalizePathname(pathname);
  if (PATH_TO_DOMAIN[normalized]) return PATH_TO_DOMAIN[normalized];
  if (normalized.startsWith('/montar-deck') || normalized.startsWith('/deck/')) {
    return 'montar-deck';
  }
  return 'lobby';
}

export function pathForDomain(domain: AppDomain): string {
  return DOMAIN_PATH[domain];
}

export function screenFromDomain(domain: AppDomain): ScreenFromDomain {
  if (domain === 'batalha') return 'battle';
  if (domain === 'grimorio') return 'grimorio';
  if (domain === 'montar-deck') return 'montar-deck';
  if (domain === 'guia-ninja') return 'guia-ninja';
  if (domain === 'historico') return 'historico';
  return 'lobby';
}

export function navigateToPath(path: string, replace = false): void {
  if (typeof window === 'undefined') return;
  const domain = domainFromPathname(path);
  if (window.location.pathname === path) return;
  if (replace) {
    window.history.replaceState({ domain }, '', path);
  } else {
    window.history.pushState({ domain }, '', path);
  }
}

export function navigateToDomain(domain: AppDomain, replace = false): void {
  navigateToPath(pathForDomain(domain), replace);
}

export function pathForMontarDeckEditor(deckId?: string | null): string {
  if (!deckId) return '/montar-deck/criar';
  return `/montar-deck/editar/${encodeURIComponent(deckId)}`;
}