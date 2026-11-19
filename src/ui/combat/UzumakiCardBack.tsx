/**
 * Verso universal v3 (espiral Uzumaki) — placeholder Part 3.
 * Quando a Part 2 (`./components/card`) estiver merged, trocar o import nos
 * consumidores por `CardBack` de lá; o footprint visual deve permanecer.
 */
export function UzumakiCardBack({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-md border-2 border-[#9CA3AF] shadow ${className}`}
      data-card-back="verso-v3"
      style={{
        background:
          'linear-gradient(#000,#000) padding-box, linear-gradient(135deg,#F3F4F6,#9CA3AF 28%,#F9FAFB 48%,#6B7280 72%,#D1D5DB) border-box',
        border: '3px solid transparent',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <div
        className="absolute inset-[6px] flex items-center justify-center overflow-hidden rounded-[6px] border-2 border-orange-500"
        style={{ background: '#000' }}
      >
        {/* espiral decorativa de fundo */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M50 50 m0 -42 a42 42 0 1 1 0.1 0"
            fill="none"
            stroke="#fff"
            strokeWidth="1.2"
          />
          <path
            d="M50 50 Q72 32 78 50 Q72 78 50 72 Q28 64 32 48 Q38 30 50 36"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {/* brasão Uzumaki (disco vermelho + espiral escura) */}
        <svg
          viewBox="0 0 100 100"
          className="relative z-[1] h-[70%] w-[70%] drop-shadow-[0_0_10px_rgba(249,115,22,0.45)]"
        >
          <defs>
            <radialGradient id="uzg-combat" cx="0.38" cy="0.32" r="0.8">
              <stop stopColor="#F26B4E" />
              <stop offset="0.55" stopColor="#D62B2B" />
              <stop offset="1" stopColor="#8E1B22" />
            </radialGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="47.1"
            fill="url(#uzg-combat)"
            stroke="#120706"
            strokeWidth="3.8"
          />
          <g transform="translate(377.82751,-78.047013)">
            <path
              d="m -328.72021,125.89667 c -6.23476,11.87438 2.65313,18.94216 8.11428,18.86569 11.67673,-0.16351 15.7183,-11.91714 15.82283,-17.03998 0.19656,-9.633 -7.34199,-23.69935 -22.31425,-23.73425 -7.7016,-0.0179 -26.48729,5.2265 -26.37139,27.18283 0.15886,30.09072 31.13034,42.38055 49.09135,37.52851"
              fill="none"
              stroke="#120706"
              strokeWidth="5.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
