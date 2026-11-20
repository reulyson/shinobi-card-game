import React from 'react';
import { CardIconId, iconPublicPath } from './theme';

interface CardIconProps {
  id: CardIconId;
  size?: number;
  className?: string;
  title?: string;
  alt?: string;
}

/** Ícone do conjunto v4 (SVG em public/icons/). */
export const CardIcon: React.FC<CardIconProps> = ({
  id,
  size = 24,
  className = '',
  title,
  alt,
}) => (
  <img
    src={iconPublicPath(id)}
    width={size}
    height={size}
    className={className}
    title={title}
    alt={alt ?? title ?? ''}
    draggable={false}
  />
);

export default CardIcon;
