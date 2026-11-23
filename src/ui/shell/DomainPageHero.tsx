import React from 'react';
import { DOMAIN_PAGE_META, ACCENT_CLASS, type MenuDomain } from './domainTheme';

interface DomainPageHeroProps {
  domain: MenuDomain;
  actions?: React.ReactNode;
  /** Substitui o subtítulo padrão do domínio. */
  subtitle?: string;
  compact?: boolean;
}

export const DomainPageHero: React.FC<DomainPageHeroProps> = ({
  domain,
  actions,
  subtitle,
  compact = false,
}) => {
  const meta = DOMAIN_PAGE_META[domain];
  const accentClass = ACCENT_CLASS[meta.accent];

  return (
    <header
      className={`domain-page-hero ${accentClass} ${compact ? 'domain-page-hero--compact' : ''}`.trim()}
    >
      <div className="domain-page-hero__glow" aria-hidden="true" />
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 relative">
        <div className="space-y-2">
          <p className="domain-eyebrow">{meta.eyebrow}</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display text-white tracking-wide text-balance">
            {meta.title}
          </h1>
          <p className="text-sm text-slate-300/90 max-w-2xl leading-relaxed">
            {subtitle ?? meta.subtitle}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
};