import type { StatTone } from './types';

/** Cor da plaquinha vs base da carta (A5/A6). */
export function statTone(predicted: number, base: number): StatTone {
  if (predicted > base) return 'above';
  if (predicted < base) return 'below';
  return 'base';
}

export const STAT_COLORS: Record<StatTone, { text: string; border: string }> = {
  base: { text: '#FFFFFF', border: 'rgba(255,255,255,0.55)' },
  above: { text: '#4ADE80', border: '#4ADE80' },
  below: { text: '#FF5252', border: '#FF5252' },
};

/** Formata vitalidade da bandana: atual ou atual/previsto. */
export function formatVitality(current: number, predicted?: number): { text: string; predictedLower: boolean } {
  if (predicted === undefined || predicted === current) {
    return { text: String(current), predictedLower: false };
  }
  return { text: `${current}/${predicted}`, predictedLower: predicted < current };
}
