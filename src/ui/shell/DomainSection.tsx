import React from 'react';
import type { DomainAccent } from './domainTheme';

interface DomainSectionProps {
  title: string;
  description?: string;
  accent?: DomainAccent;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Cabeçalho menor — ocupa menos altura. */
  dense?: boolean;
}

export const DomainSection: React.FC<DomainSectionProps> = ({
  title,
  description,
  accent = 'ember',
  icon,
  actions,
  children,
  className = '',
  dense = false,
}) => {
  const gap = dense ? 'gap-2' : 'gap-3 sm:gap-4';
  const titleCls = dense
    ? 'text-base sm:text-lg font-display text-white tracking-wide flex items-center gap-2'
    : 'text-lg sm:text-xl font-display text-white tracking-wide flex items-center gap-2';
  return (
    <section className={`flex flex-col ${gap} min-h-0 ${className}`}>
      {!dense && <div className={`domain-section-rule domain-section-rule--${accent}`} aria-hidden="true" />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className={titleCls}>
            {icon}
            <span>{title}</span>
          </h2>
          {description && !dense && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl leading-snug">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 w-full sm:w-auto">{actions}</div>}
      </div>
      {children}
    </section>
  );
};