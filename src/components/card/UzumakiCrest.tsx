import React from 'react';

/** Brasão Uzumaki (verso-v3) — SVG vetorial, escala limpa em mão/campo/zoom. */
export const UzumakiCrest: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="sc-uzg" cx=".38" cy=".32" r=".8">
        <stop stopColor="#F26B4E" />
        <stop offset=".55" stopColor="#D62B2B" />
        <stop offset="1" stopColor="#8E1B22" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="47.1" fill="url(#sc-uzg)" stroke="#120706" strokeWidth="3.8" />
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
);

export default UzumakiCrest;
