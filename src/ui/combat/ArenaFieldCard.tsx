import type { CSSProperties } from 'react';
import { CardBack } from '../card/CardBack';
import { CardFace } from '../card/CardFace';
import { compareStat, type StatColorState } from '../card/theme';
import { FIELD_FACE_H, FIELD_FACE_W, SLOT_H, SLOT_SCALE, SLOT_W } from './grid';
import { resolveArenaCardDef } from './resolveArenaCard';
import type { ArenaCardRef } from './types';

export interface ArenaFieldCardProps {
  card: ArenaCardRef;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  style?: CSSProperties;
  /** `field` = CardFace aprovado (119×165) no slot; `hand` = mão. */
  size?: 'field' | 'hand';
}

function toneToState(value: number, base: number): StatColorState {
  return compareStat(value, base);
}

/**
 * CardFace size="field" idêntico ao aprovado (compare-final-campo).
 * Slot B4 menor → só `transform: scale` uniforme (sem reflow/CSS de arena).
 * Combate = mesma carta; só plaquinhas mudam na prévia.
 */
export function ArenaFieldCard({
  card,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
  style,
  size = 'field',
}: ArenaFieldCardProps) {
  const def = resolveArenaCardDef(card.cardId);
  const preview = card.preview;
  const rankLevel =
    card.rank === 'jounnin' ? 3 : card.rank === 'chuunin' ? 2 : card.rank === 'gennin' ? 1 : undefined;
  const kwOverride = card.keywordsOverride;

  if (size === 'hand') {
    if (card.faceDown || !def) {
      return (
        <button
          type="button"
          data-uid={card.uid}
          data-card-id={card.cardId}
          data-arena-card="hand"
          className={`relative block overflow-visible border-0 bg-transparent p-0 ${className}`}
          style={style}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          aria-label={card.faceDown ? 'Carta virada' : card.name}
        >
          <CardBack size="hand" sized />
        </button>
      );
    }
    return (
      <button
        type="button"
        data-uid={card.uid}
        data-card-id={def.id}
        data-arena-card="hand"
        className={`relative block overflow-visible border-0 bg-transparent p-0 text-left ${className}`}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={def.name}
      >
        <CardFace
          card={def}
          size="hand"
          power={preview?.power}
          vitality={preview?.vitality}
          powerState={preview ? toneToState(preview.power, preview.basePower) : undefined}
          vitalityState={preview ? toneToState(preview.vitality, preview.baseVitality) : undefined}
          rankLevel={rankLevel as 1 | 2 | 3 | undefined}
          keywordsOverride={kwOverride}
        />
      </button>
    );
  }

  // —— field: footprint do slot + CardFace nativo 119×165 com scale uniforme ——
  if (card.faceDown || !def) {
    return (
      <div
        data-uid={card.uid}
        data-card-id={card.cardId}
        data-arena-card="field"
        className={`relative overflow-visible ${className}`}
        style={{ width: SLOT_W, height: SLOT_H, ...style }}
      >
        <div
          className="origin-top-left"
          style={{
            width: FIELD_FACE_W,
            height: FIELD_FACE_H,
            transform: `scale(${SLOT_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <CardBack size="field" sized />
        </div>
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          aria-label={card.faceDown ? 'Carta virada' : card.name}
        />
      </div>
    );
  }

  const power = preview?.power;
  const vitality = preview?.vitality;
  const powerState =
    preview != null ? toneToState(preview.power, preview.basePower) : undefined;
  const vitalityState =
    preview != null ? toneToState(preview.vitality, preview.baseVitality) : undefined;

  return (
    <div
      data-uid={card.uid}
      data-card-id={def.id}
      data-arena-card="field"
      data-preview-dying={preview?.dying ? '1' : undefined}
      className={`relative overflow-visible ${className}`}
      style={{ width: SLOT_W, height: SLOT_H, ...style }}
    >
      <div
        className="pointer-events-none origin-top-left"
        style={{
          width: FIELD_FACE_W,
          height: FIELD_FACE_H,
          transform: `scale(${SLOT_SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <CardFace
          card={def}
          size="field"
          power={power}
          vitality={vitality}
          powerState={powerState}
          vitalityState={vitalityState}
          rankLevel={rankLevel as 1 | 2 | 3 | undefined}
          keywordsOverride={kwOverride}
        />
      </div>
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={def.name}
      />
    </div>
  );
}
