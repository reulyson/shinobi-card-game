import type { CSSProperties, ReactNode } from 'react';

const BG = {
  o: 'linear-gradient(180deg,#FFE55A 0%,#FFAA22 45%,#F0501A 100%)',
  r: 'linear-gradient(180deg,#FF7A7A,#C81E1E)',
  b: 'linear-gradient(180deg,#7DC4FF,#1D5FD6)',
  k: 'linear-gradient(180deg,#444,#111)',
} as const;

export type TabTone = keyof typeof BG;

/** Etiqueta skew do mockup gen_b4.tab. */
export function TabLabel({
  children,
  tone = 'o',
  size = 15,
  style,
  className = '',
}: {
  children: ReactNode;
  tone?: TabTone;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`inline-block border-[2.5px] border-black px-3.5 py-px ${className}`}
      style={{
        transform: 'skewX(-12deg)',
        background: BG[tone],
        boxShadow: '0 0 0 2px #fff, 0 3px 6px #000a',
        ...style,
      }}
    >
      <span
        className="inline-block font-display tracking-wide text-white"
        style={{
          transform: 'skewX(12deg)',
          fontSize: size,
          WebkitTextStroke: '3px #111',
          paintOrder: 'stroke fill',
        }}
      >
        {children}
      </span>
    </div>
  );
}
