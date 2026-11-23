import React from 'react';

interface DomainPageShellProps {
  children: React.ReactNode;
  wide?: boolean;
  /** Menos padding e gaps verticais. */
  dense?: boolean;
  /** Ocupa a altura útil abaixo do nav (use com painéis internos scrolláveis). */
  fill?: boolean;
  className?: string;
}

/** Largura e padding consistentes em todas as páginas de menu. */
export const DomainPageShell: React.FC<DomainPageShellProps> = ({
  children,
  wide = false,
  dense = false,
  fill = false,
  className = '',
}) => {
  const max = wide ? 'w-full max-w-[1680px]' : 'w-full max-w-[1440px]';
  const gap = dense ? 'gap-2.5 sm:gap-3' : 'gap-4 sm:gap-5';
  const py = dense ? 'py-2 sm:py-3' : 'py-3 sm:py-4';
  const fillCls = fill ? 'flex-1 min-h-0 h-full max-h-full overflow-hidden' : '';
  return (
    <div className={`${max} mx-auto px-3 sm:px-4 lg:px-5 ${py} flex flex-col ${gap} ${fillCls} ${className}`}>
      {children}
    </div>
  );
};