import type { CSSProperties } from 'react';
import { CardBack } from '../../components/card/CardBack';
import { CardFace } from '../../components/card/CardFace';
import { compareStat, type StatColorState } from '../../components/card/theme';
import { keywordsFromArenaLabels, resolveArenaCardDef } from './resolveArenaCard';
import type { ArenaCardRef } from './types';

export interface ArenaFieldCardProps {
  card: ArenaCardRef;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  /** `field` = slot 119×165; `hand` = face de mão 156×219. */
  size?: 'field' | 'hand';
}

function toneToState(value: number, base: number): StatColorState {
  return compareStat(value, base);
}

/**
 * Carta da arena B4 via CardFace size="field" (PR #1) — sem FieldCard mock.
 * Prévia de combate: power/vitality + powerState/vitalityState nas plaquinhas 32px.
 */
export function ArenaFieldCard({
  card,
  onClick,
  className = '',
  style,
  size = 'field',
}: ArenaFieldCardProps) {
  const def = resolveArenaCardDef(card.cardId);
  const preview = card.preview;
  const kwOverride = keywordsFromArenaLabels(card.keywords);
  const rankLevel =
    card.rank === 'jounnin' ? 3 : card.rank === 'chuunin' ? 2 : card.rank === 'gennin' ? 1 : undefined;

  if (card.faceDown || !def) {
    return (
      <button
        type="button"
        data-uid={card.uid}
        data-card-id={card.cardId}
        data-arena-card={size}
        className={`relative block overflow-visible border-0 bg-transparent p-0 ${className}`}
        style={style}
        onClick={onClick}
        aria-label={card.faceDown ? 'Carta virada' : card.name}
      >
        <CardBack size={size} sized />
      </button>
    );
  }

  const power = preview?.power;
  const vitality = preview?.vitality;
  const powerState =
    preview != null ? toneToState(preview.power, preview.basePower) : undefined;
  const vitalityState =
    preview != null ? toneToState(preview.vitality, preview.baseVitality) : undefined;

  return (
    <button
      type="button"
      data-uid={card.uid}
      data-card-id={def.id}
      data-arena-card={size}
      className={`relative block overflow-visible border-0 bg-transparent p-0 text-left ${
        card.dimmed || preview?.dying ? 'opacity-55' : ''
      } ${card.selected ? 'ring-2 ring-amber-300' : ''} ${className}`}
      style={style}
      onClick={onClick}
      aria-label={def.name}
    >
      <CardFace
        card={def}
        size={size}
        effectiveCost={card.cost}
        power={power}
        vitality={vitality}
        powerState={powerState}
        vitalityState={vitalityState}
        rankLevel={rankLevel as 1 | 2 | 3 | undefined}
        selected={card.selected}
        dimmed={card.dimmed || Boolean(preview?.dying)}
        keywordsOverride={kwOverride}
      />
    </button>
  );
}
