import { useEffect, useState, type ReactNode } from 'react';
import { SCREEN_H, SCREEN_W } from './grid';

interface FixedStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Viewport que contém a tela lógica 1600×900, escalada com transform: scale
 * para caber na janela mantendo a proporção.
 */
export function FixedStage({ children, className = '' }: FixedStageProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const sx = window.innerWidth / SCREEN_W;
      const sy = window.innerHeight / SCREEN_H;
      setScale(Math.min(sx, sy));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className={`arena-b4-viewport relative h-[100dvh] w-full overflow-hidden bg-[#05070c] ${className}`}
      data-arena-b4-stage
    >
      <div
        className="absolute left-1/2 top-1/2 origin-center"
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
