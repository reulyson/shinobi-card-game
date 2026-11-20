/** Prefixo de assets públicos (respeita base do Vite / GitHub Pages). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, '');
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return `${base}${clean}`;
}
