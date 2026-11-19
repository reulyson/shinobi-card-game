import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import './TurnCoin.css';

/** Path Uzumaki (viewBox 0..100) — `mockup/gen_v4.py::spiral(50,50,44,2.4,120,.08)`. */
const SWIRL_PATH =
  'M53.52,50.00L53.83,50.48L54.06,51.04L54.21,51.67L54.27,52.35L54.21,53.06L54.04,53.80L53.75,54.53L53.33,55.25L52.79,55.93L52.13,56.56L51.35,57.10L50.48,57.55L49.50,57.89L48.46,58.10L47.35,58.16L46.20,58.07L45.04,57.81L43.89,57.39L42.76,56.80L41.69,56.03L40.71,55.11L39.83,54.03L39.08,52.80L38.48,51.46L38.05,50.00L37.81,48.46L37.77,46.86L37.95,45.23L38.34,43.59L38.97,41.98L39.81,40.43L40.88,38.97L42.15,37.63L43.62,36.44L45.26,35.42L47.06,34.61L49.00,34.03L51.03,33.69L53.12,33.62L55.26,33.82L57.39,34.30L59.48,35.07L61.49,36.11L63.39,37.43L65.13,39.01L66.68,40.83L68.01,42.87L69.09,45.10L69.89,47.49L70.39,50.00L70.56,52.60L70.40,55.24L69.90,57.88L69.05,60.47L67.86,62.97L66.34,65.34L64.50,67.53L62.37,69.49L59.97,71.19L57.34,72.60L54.52,73.67L51.53,74.39L48.44,74.72L45.29,74.66L42.14,74.20L39.02,73.33L36.00,72.05L33.13,70.39L30.47,68.34L28.05,65.95L25.93,63.23L24.14,60.24L22.74,57.00L21.74,53.57L21.18,50.00L21.07,46.35L21.43,42.66L22.26,39.02L23.56,35.47L25.32,32.07L27.52,28.89L30.12,25.97L33.11,23.39L36.44,21.18L40.05,19.38L43.90,18.05L47.94,17.20L52.08,16.86L56.29,17.05L60.47,17.78L64.57,19.04L68.52,20.82L72.24,23.12L75.68,25.88L78.77,29.09L81.46,32.70L83.70,36.66L85.43,40.90L86.62,45.37L87.25,50.00L87.29,54.71L86.74,59.43L85.58,64.09L83.83,68.60L81.50,72.89L78.63,76.89L75.25,80.52L71.41,83.73L67.15,86.45L62.55,88.64L57.68,90.24L52.59,91.22L47.39,91.56L42.13,91.23L36.92,90.24L31.84,88.59L26.97,86.30L22.38,83.38L18.17,79.89L14.40,75.86';

const TURN_MS = 60_000;
const POOF_MS = 520;

export type TurnSide = 'player' | 'rival';
export type ConfirmLabel = 'CONFIRMAR ATAQUE' | 'CONFIRMAR BLOQUEIOS' | string;

export interface TurnCoinHandle {
  pause: () => void;
  resume: () => void;
  reset: (side?: TurnSide) => void;
  /** Fração de laranja 0..1 (de baixo para cima). */
  getLevel: () => number;
}

export interface TurnCoinProps {
  /** Quem tem a vez. Ao mudar, dispara poof e reinicia o líquido. */
  side: TurnSide;
  /** Rótulo do botão no seu turno (SPEC: CONFIRMAR ATAQUE / CONFIRMAR BLOQUEIOS). */
  confirmLabel?: ConfirmLabel;
  /** Duração do timer (ms). Default 60000. */
  durationMs?: number;
  /** Pausa controlada pelo motor (cinemáticas, etc.). */
  paused?: boolean;
  /** Muda para resetar o timer sem trocar de lado. */
  resetKey?: string | number;
  disabled?: boolean;
  onConfirm?: () => void;
  /**
   * Timeout do timer:
   * - seu turno (laranja vazio) → motor deve passar automaticamente;
   * - rival (laranja cheio) → sinal visual de fim do turno do rival.
   */
  onTimeout?: () => void;
  size?: number;
  /** Oculta o botão (útil quando o anel de chakra envolve só a moeda). */
  hideButton?: boolean;
  className?: string;
  'data-testid'?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

const PUFFS: Array<[number, number, number]> = [
  [0, 0, 40],
  [-34, -14, 30],
  [34, -14, 30],
  [-26, 26, 28],
  [26, 26, 28],
  [0, -40, 28],
  [0, 40, 26],
  [-48, 6, 22],
  [48, 6, 22],
  [-14, -52, 18],
  [18, -50, 18],
  [-44, -34, 16],
  [44, -34, 16],
  [-40, 40, 16],
  [40, 40, 16],
];

const PoofCloud: React.FC<{ p: number }> = ({ p }) => {
  const sp = 0.45 + 1.0 * p;
  const sc = 0.8 + 0.5 * p;
  const op = p < 0.85 ? 1 : 0.55;
  const showStars = p > 0.15 && p < 0.85;
  return (
    <svg
      className="turn-coin-poof"
      width="240"
      height="240"
      viewBox="-20 -20 240 240"
      style={{ opacity: op }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="turn-coin-pf" cx=".4" cy=".35" r=".8">
          <stop stopColor="#FFFFFF" />
          <stop offset=".7" stopColor="#E5E7EB" />
          <stop offset="1" stopColor="#B8BEC8" />
        </radialGradient>
      </defs>
      {PUFFS.map(([dx, dy, r], k) => {
        const x = 100 + dx * sp;
        const y = 100 + dy * sp;
        const rr = r * sc;
        return (
          <circle
            key={`o-${k}`}
            cx={x}
            cy={y}
            r={rr}
            fill="url(#turn-coin-pf)"
            stroke="#4B5563"
            strokeWidth="3"
          />
        );
      })}
      {PUFFS.map(([dx, dy, r], k) => {
        const x = 100 + dx * sp;
        const y = 100 + dy * sp;
        const rr = Math.max(r * sc - 3, 1);
        return <circle key={`i-${k}`} cx={x} cy={y} r={rr} fill="url(#turn-coin-pf)" />;
      })}
      {showStars
        ? [0.4, 1.9, 3.1, 4.4, 5.5].map((a, i) => {
            const sx = 100 + Math.cos(a) * (70 + p * 30);
            const sy = 100 + Math.sin(a) * (70 + p * 30);
            return (
              <path
                key={i}
                d={`M${sx.toFixed(0)} ${sy.toFixed(0)} l4 -10 l4 10 l-10 -4 l10 -4z`}
                fill="#FFD23F"
                stroke="#111"
                strokeWidth="1.5"
                opacity=".9"
              />
            );
          })
        : null}
    </svg>
  );
};

const ShinobiKanji: React.FC<{ size: number }> = ({ size }) => (
  <span
    className="turn-coin-kanji"
    style={{
      fontSize: size,
      transform: `translate(${(-0.08 * size).toFixed(1)}px, ${(-0.1 * size).toFixed(1)}px)`,
    }}
    aria-hidden="true"
  >
    忍
  </span>
);

const SwirlIcon: React.FC<{ size: number; color?: string }> = ({ size, color = '#1F2937' }) => (
  <svg
    className="turn-coin-swirl"
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
  >
    <path d={SWIRL_PATH} stroke={color} strokeWidth="10" strokeLinecap="round" />
  </svg>
);

/**
 * Moeda de turno + timer visual de 1 minuto (sem números).
 * Seu turno: laranja esvazia de cima→baixo; ao zerar, poof → swirl e `onTimeout`.
 * Rival: laranja enche de baixo→cima; ao encher, poof → 忍 e `onTimeout`.
 * Pausável / resetável via props ou `ref` (`pause` / `resume` / `reset`).
 */
export const TurnCoin = forwardRef<TurnCoinHandle, TurnCoinProps>(function TurnCoin(
  {
    side,
    confirmLabel = 'CONFIRMAR ATAQUE',
    durationMs = TURN_MS,
    paused = false,
    resetKey,
    disabled = false,
    onConfirm,
    onTimeout,
    size = 104,
    hideButton = false,
    className,
    'data-testid': testId = 'turn-coin',
  },
  ref
) {
  const reduced = usePrefersReducedMotion();
  const [level, setLevel] = useState(() => (side === 'player' ? 1 : 0));
  const [displaySide, setDisplaySide] = useState<TurnSide>(side);
  const [poof, setPoof] = useState<number | null>(null);
  const [localPaused, setLocalPaused] = useState(false);

  const levelRef = useRef(level);
  const sideRef = useRef(side);
  const displaySideRef = useRef(displaySide);
  const pausedRef = useRef(paused || localPaused);
  const onTimeoutRef = useRef(onTimeout);
  const firedTimeoutRef = useRef(false);
  const transformingRef = useRef(false);
  const timerRafRef = useRef<number | null>(null);
  const poofRafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const remainingRef = useRef(durationMs);

  levelRef.current = level;
  sideRef.current = side;
  displaySideRef.current = displaySide;
  pausedRef.current = paused || localPaused;
  onTimeoutRef.current = onTimeout;

  const cancelPoof = useCallback(() => {
    if (poofRafRef.current != null) {
      cancelAnimationFrame(poofRafRef.current);
      poofRafRef.current = null;
    }
  }, []);

  const applyLevelFromRemaining = useCallback(
    (remaining: number, forSide: TurnSide) => {
      const t = Math.max(0, Math.min(1, remaining / durationMs));
      // player: starts full (1) and drains; rival: starts empty (0) and fills
      const next = forSide === 'player' ? t : 1 - t;
      setLevel(next);
      levelRef.current = next;
    },
    [durationMs]
  );

  const startCycle = useCallback(
    (forSide: TurnSide, withPoof: boolean) => {
      cancelPoof();
      firedTimeoutRef.current = false;
      remainingRef.current = durationMs;
      lastTsRef.current = null;
      applyLevelFromRemaining(durationMs, forSide);

      const reveal = () => {
        setDisplaySide(forSide);
        displaySideRef.current = forSide;
        transformingRef.current = false;
        setPoof(null);
      };

      if (!withPoof || reduced) {
        reveal();
        return;
      }

      transformingRef.current = true;
      const start = performance.now();
      const midSwapped = { done: false };
      const tickPoof = (now: number) => {
        const t = Math.min(1, (now - start) / POOF_MS);
        setPoof(t);
        if (t >= 0.45 && !midSwapped.done) {
          midSwapped.done = true;
          setDisplaySide(forSide);
          displaySideRef.current = forSide;
        }
        if (t < 1) {
          poofRafRef.current = requestAnimationFrame(tickPoof);
        } else {
          reveal();
        }
      };
      setPoof(0);
      poofRafRef.current = requestAnimationFrame(tickPoof);
    },
    [applyLevelFromRemaining, cancelPoof, durationMs, reduced]
  );

  useImperativeHandle(
    ref,
    () => ({
      pause: () => setLocalPaused(true),
      resume: () => setLocalPaused(false),
      reset: (s) => {
        const next = s ?? sideRef.current;
        startCycle(next, false);
      },
      getLevel: () => levelRef.current,
    }),
    [startCycle]
  );

  const prevSideRef = useRef<TurnSide | null>(null);
  // Side change → poof + reset timer
  useEffect(() => {
    const prev = prevSideRef.current;
    prevSideRef.current = side;
    startCycle(side, prev != null && prev !== side);
  }, [side, startCycle]);

  const prevResetRef = useRef(resetKey);
  // External resetKey
  useEffect(() => {
    if (resetKey === undefined) return;
    if (prevResetRef.current === resetKey) return;
    prevResetRef.current = resetKey;
    startCycle(sideRef.current, false);
  }, [resetKey, startCycle]);

  // Timer loop (independent of poof RAF)
  useEffect(() => {
    const tick = (now: number) => {
      timerRafRef.current = requestAnimationFrame(tick);
      if (transformingRef.current) return;
      if (pausedRef.current) {
        lastTsRef.current = now;
        return;
      }
      if (lastTsRef.current == null) {
        lastTsRef.current = now;
        return;
      }
      const dt = now - lastTsRef.current;
      lastTsRef.current = now;
      remainingRef.current = Math.max(0, remainingRef.current - dt);
      applyLevelFromRemaining(remainingRef.current, sideRef.current);

      if (remainingRef.current <= 0 && !firedTimeoutRef.current) {
        firedTimeoutRef.current = true;
        onTimeoutRef.current?.();
      }
    };
    timerRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRafRef.current != null) cancelAnimationFrame(timerRafRef.current);
      cancelPoof();
    };
  }, [applyLevelFromRemaining, cancelPoof]);

  const isPlayerVisual = displaySide === 'player';
  const showKanji = isPlayerVisual;
  const activeBtn = isPlayerVisual && !disabled;
  const label = isPlayerVisual ? confirmLabel : 'AGUARDE O RIVAL';
  const topPct = (1 - level) * 100;
  const kanjiSize = Math.round(size * 0.48);

  return (
    <div
      className={`turn-coin-wrap${hideButton ? ' turn-coin-wrap--coin-only' : ''}${className ? ` ${className}` : ''}`}
      data-testid={testId}
      data-side={displaySide}
      data-level={level.toFixed(3)}
    >
      <div className="turn-coin" style={{ width: size, height: size }}>
        <div
          className={`turn-coin-disc${isPlayerVisual ? ' turn-coin-disc--active' : ''}`}
          style={{ width: size, height: size }}
        >
          <div className="turn-coin-fill turn-coin-fill--grey" />
          <div
            className="turn-coin-fill turn-coin-fill--orange"
            style={{ clipPath: `inset(${topPct.toFixed(2)}% 0 0 0)` }}
          />
          {level > 0.02 && level < 0.98 ? (
            <div
              className="turn-coin-meniscus"
              style={{ top: `calc(${topPct.toFixed(2)}% - 2px)` }}
            />
          ) : null}
        </div>
        <div className="turn-coin-symbol">
          {showKanji ? (
            <ShinobiKanji size={kanjiSize} />
          ) : (
            <SwirlIcon size={size - 26} />
          )}
        </div>
        {poof != null ? <PoofCloud p={poof} /> : null}
      </div>

      {hideButton ? null : (
        <button
          type="button"
          className={`turn-coin-btn${activeBtn ? ' turn-coin-btn--active' : ' turn-coin-btn--wait'}`}
          disabled={!activeBtn}
          data-testid="turn-coin-confirm"
          onClick={() => {
            if (activeBtn) onConfirm?.();
          }}
        >
          <span>{label}</span>
        </button>
      )}
    </div>
  );
});

/** Botão slanted do TurnCoin, para montar abaixo do ChakraRing. */
export const TurnCoinButton: React.FC<{
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ active, label, disabled, onClick }) => (
  <button
    type="button"
    className={`turn-coin-btn${active ? ' turn-coin-btn--active' : ' turn-coin-btn--wait'}`}
    disabled={disabled || !active}
    data-testid="turn-coin-confirm"
    onClick={() => {
      if (active && !disabled) onClick?.();
    }}
  >
    <span>{label}</span>
  </button>
);

export default TurnCoin;
