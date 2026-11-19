import { ATT_Y, BLK_Y, COL_CX, SLOT_H } from './grid';
import type { ArenaArrow } from './types';

const PAL = {
  player: { c1: '#FFD23F', c2: '#F97316', ink: '#7C2D12' },
  enemy: { c1: '#FF8A8A', c2: '#DC2626', ink: '#450A0A' },
} as const;

function bez(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const a = (1 - t) ** 2;
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

function ctrl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend: number
): [number, number] {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  return [mx - (dy / L) * bend * L, my + (dx / L) * bend * L];
}

/**
 * Seta de alvo variante A: rastro de pincel + ponta de kunai.
 * Laranja = eu; vermelho = rival.
 */
export function AttackArrows({ arrows }: { arrows: ArenaArrow[] }) {
  if (arrows.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={1600}
      height={900}
      viewBox="0 0 1600 900"
      style={{ zIndex: 13 }}
      data-attack-arrows
    >
      {arrows.map((a) => {
        const cx = COL_CX[a.fromCol] ?? 800;
        const who = a.who === 'player' ? 'player' : 'enemy';
        const { c1, c2, ink } = PAL[who];
        // Rival ataca de cima (ATT_Y) para baixo (BLK_Y); eu ataco de baixo para cima.
        const y1 = a.direction === 'down' ? ATT_Y + SLOT_H - 8 : BLK_Y + 8;
        const y2 = a.direction === 'down' ? BLK_Y + 8 : ATT_Y + SLOT_H - 8;
        const bend = a.direction === 'down' ? 0.14 : -0.14;
        const p0: [number, number] = [cx, y1];
        const p2: [number, number] = [cx + (a.fromCol - 2) * 4, y2];
        const p1 = ctrl(p0[0], p0[1], p2[0], p2[1], bend);
        const N = 36;
        const pts = Array.from({ length: N + 1 }, (_, i) => bez(p0, p1, p2, i / N));
        const end = Math.floor(N * 0.88);
        const w = 11;

        const nrm = (i: number): [number, number] => {
          const aa = pts[Math.max(i - 1, 0)]!;
          const bb = pts[Math.min(i + 1, N)]!;
          const d = Math.atan2(bb[1] - aa[1], bb[0] - aa[0]);
          return [-Math.sin(d), Math.cos(d)];
        };

        const L: Array<[number, number]> = [];
        const R: Array<[number, number]> = [];
        for (let i = 0; i <= end; i++) {
          const t = i / end;
          const wd = w * (0.12 + 0.88 * t ** 0.8) * (1 + 0.12 * Math.sin(i * 1.9));
          const [nx, ny] = nrm(i);
          const pt = pts[i]!;
          L.push([pt[0] + nx * wd * 0.5, pt[1] + ny * wd * 0.5]);
          R.push([pt[0] - nx * wd * 0.5, pt[1] - ny * wd * 0.5]);
        }
        const poly = [...L, ...R.reverse()].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
        const gid = `arr-${a.id}`;
        const tip = pts[N]!;
        const before = pts[end]!;
        const ang = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
        const s = w * 1.7;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const P = (u: number, v: number) =>
          `${(tip[0] + u * ca - v * sa).toFixed(1)},${(tip[1] + u * sa + v * ca).toFixed(1)}`;
        const blade = [P(0, 0), P(-0.5 * s, -0.42 * s), P(-1.5 * s, 0), P(-0.5 * s, 0.42 * s)].join(' ');

        return (
          <g key={a.id}>
            <defs>
              <linearGradient id={gid} x1={p0[0]} y1={p0[1]} x2={p2[0]} y2={p2[1]} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={c2} stopOpacity={0.15} />
                <stop offset="0.5" stopColor={c2} />
                <stop offset="1" stopColor={c1} />
              </linearGradient>
            </defs>
            {a.blocked && (
              <line
                x1={cx}
                y1={ATT_Y + SLOT_H}
                x2={cx}
                y2={BLK_Y}
                stroke="#FFD23F"
                strokeWidth={2}
                opacity={0.75}
              />
            )}
            <polygon points={poly} fill="#000" opacity={0.35} transform="translate(2,3)" />
            <polygon
              points={poly}
              fill={`url(#${gid})`}
              stroke={ink}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            {Array.from({ length: 5 }).map((_, k) => {
              const i = Math.floor(end * (0.25 + 0.14 * k));
              const [nx, ny] = nrm(i);
              const o = w * 0.7 * (k % 2 ? 1 : -1);
              const pt = pts[i]!;
              return (
                <circle
                  key={k}
                  cx={pt[0] + nx * o}
                  cy={pt[1] + ny * o}
                  r={1.4 + k * 0.35}
                  fill={c1}
                  stroke={ink}
                  strokeWidth={0.8}
                />
              );
            })}
            <polygon
              points={blade}
              fill="#E5E7EB"
              stroke={ink}
              strokeWidth={s * 0.2}
              strokeLinejoin="round"
            />
            {!a.blocked && a.unblockedDamage != null && a.unblockedDamage > 0 && (
              <text
                x={cx}
                y={a.direction === 'down' ? BLK_Y + SLOT_H / 2 : ATT_Y + SLOT_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-display"
                fill="#FF5252"
                stroke="#fff"
                strokeWidth={4}
                paintOrder="stroke fill"
                fontSize={42}
                style={{ fontFamily: 'Bangers, sans-serif' }}
              >
                −{a.unblockedDamage}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
