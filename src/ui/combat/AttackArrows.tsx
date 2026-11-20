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
 * Variante A (seta-ataque-variantes / seta.py v=1):
 * trilha de pincel chakra (afina na origem → engrossa na ponta) + kunai.
 * Mockup meu-ataque: AR(cx+4, BLK_Y+34, cx-4, ATT_Y+100, 'eu', 1, .0001, w=12).
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
        // gen_b4prev: AR(COL_CX[i]+4, BLK_Y+34, COL_CX[i]-4, ATT_Y+100, …)
        const fromTop = a.direction === 'down';
        const y1 = fromTop ? ATT_Y + 100 : BLK_Y + 34;
        const y2 = fromTop ? BLK_Y + 34 : ATT_Y + 100;
        const bend = 0.0001;
        const p0: [number, number] = [cx + 4, y1];
        const p2: [number, number] = [cx - 4, y2];
        const p1 = ctrl(p0[0], p0[1], p2[0], p2[1], bend);
        const N = 36;
        const pts = Array.from({ length: N + 1 }, (_, i) => bez(p0, p1, p2, i / N));
        const end = Math.floor(N * 0.88);
        const w = 12;

        const nrm = (i: number): [number, number] => {
          const aa = pts[Math.max(i - 1, 0)]!;
          const bb = pts[Math.min(i + 1, N)]!;
          const d = Math.atan2(bb[1] - aa[1], bb[0] - aa[0]);
          return [-Math.sin(d), Math.cos(d)];
        };

        const leftPts: Array<[number, number]> = [];
        const rightPts: Array<[number, number]> = [];
        for (let i = 0; i <= end; i++) {
          const t = i / Math.max(end, 1);
          // Fino na origem, grosso na chegada (pincel).
          const wd = w * (0.12 + 0.88 * Math.pow(t, 0.8)) * (1 + 0.12 * Math.sin(i * 1.9));
          const [nx, ny] = nrm(i);
          const pt = pts[i]!;
          leftPts.push([pt[0] + nx * wd * 0.5, pt[1] + ny * wd * 0.5]);
          rightPts.push([pt[0] - nx * wd * 0.5, pt[1] - ny * wd * 0.5]);
        }
        const poly = [...leftPts, ...rightPts.reverse()]
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(' ');
        const gid = `arr-${a.id}`;
        const tip = pts[N]!;
        const before = pts[end]!;
        const ang = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
        const s = w * 1.7;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const P = (u: number, v: number) =>
          `${(tip[0] + u * ca - v * sa).toFixed(1)},${(tip[1] + u * sa + v * ca).toFixed(1)}`;
        const blade = [P(0, 0), P(-0.5 * s, -0.42 * s), P(-1.5 * s, 0), P(-0.5 * s, 0.42 * s)].join(
          ' '
        );

        return (
          <g key={a.id}>
            <defs>
              <linearGradient
                id={gid}
                x1={p0[0]}
                y1={p0[1]}
                x2={p2[0]}
                y2={p2[1]}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor={c2} stopOpacity={0.18} />
                <stop offset="0.5" stopColor={c2} />
                <stop offset="1" stopColor={c1} />
              </linearGradient>
            </defs>
            {a.blocked && (
              <>
                {/* conn: 5px #FFD23F + borda 1.5 #111 (gen_b4grid.conn) */}
                <line
                  x1={cx}
                  y1={ATT_Y + SLOT_H}
                  x2={cx}
                  y2={BLK_Y}
                  stroke="#111"
                  strokeWidth={8}
                  opacity={0.9}
                />
                <line
                  x1={cx}
                  y1={ATT_Y + SLOT_H}
                  x2={cx}
                  y2={BLK_Y}
                  stroke="#FFD23F"
                  strokeWidth={5}
                  opacity={0.9}
                />
              </>
            )}
            {/* Sombra da trilha */}
            <polygon points={poly} fill="#000" opacity={0.35} transform="translate(2,3)" />
            {/* Trilha de pincel */}
            <polygon
              points={poly}
              fill={`url(#${gid})`}
              stroke={ink}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            {/* Respingos de tinta/chakra */}
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
            {/* Cabo + lâmina da kunai */}
            <line
              x1={tip[0] - 0.2 * s * ca}
              y1={tip[1] - 0.2 * s * sa}
              x2={tip[0] - 1.4 * s * ca}
              y2={tip[1] - 1.4 * s * sa}
              stroke={c2}
              strokeWidth={s * 0.12}
            />
            <line
              x1={tip[0] - 1.4 * s * ca}
              y1={tip[1] - 1.4 * s * sa}
              x2={tip[0] - 2.3 * s * ca}
              y2={tip[1] - 2.3 * s * sa}
              stroke="#1a1a1a"
              strokeWidth={s * 0.28}
              strokeLinecap="round"
            />
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
                y={fromTop ? BLK_Y + 38 + 27 : ATT_Y + 38 + 27}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                stroke="#DC2626"
                strokeWidth={6}
                paintOrder="stroke fill"
                fontSize={54}
                style={{ fontFamily: 'Bangers, Impact, sans-serif', letterSpacing: '1px' }}
              >
                -{a.unblockedDamage}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
