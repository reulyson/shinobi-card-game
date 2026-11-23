import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SCREEN_H, SCREEN_W } from './grid';

interface FixedStageProps {
  children: ReactNode;
  /** Fundo full-bleed que cobre todo o viewport sem bordas pretas em qualquer proporção. */
  background?: ReactNode;
  className?: string;
}

/**
 * Viewport responsivo que contém a tela lógica 1600×900 escalada proporcionalmente,
 * preenchendo 100% da janela com o fundo contínuo (zero letterbox preto).
 */
export function FixedStage({ children, background, className = '' }: FixedStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      const w = el?.clientWidth || window.innerWidth;
      const h = el?.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        setScale(Math.min(w / SCREEN_W, h / SCREEN_H));
      }
    };
    update();
    const ro =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(update)
        : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`arena-b4-viewport relative h-[100dvh] w-full overflow-hidden bg-[#0a0f1d] ${className}`}
      data-arena-b4-stage
    >
      {background ? <div className="pointer-events-none absolute inset-0 z-0">{background}</div> : null}
      <div
        className="absolute left-1/2 top-1/2 z-10 origin-center"
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
