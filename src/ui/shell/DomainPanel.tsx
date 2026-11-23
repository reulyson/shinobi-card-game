import React from 'react';
import type { DomainAccent } from './domainTheme';

interface DomainPanelProps {
  accent?: DomainAccent;
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article';
}

export const DomainPanel: React.FC<DomainPanelProps> = ({
  accent = 'ember',
  className = '',
  children,
  as: Tag = 'div',
}) => {
  return (
    <Tag className={`domain-panel domain-panel--${accent} ${className}`.trim()}>
      {children}
    </Tag>
  );
};