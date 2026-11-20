import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BattleLogEntry } from '../../types/game';
import './HistoricoScroll.css';

const WIDTH = 214;
const HEIGHT = 588;
const ROLL_H = 26;
const PAPER_MAX = HEIGHT - ROLL_H - 34 - 8;

export type HistoricoLine = string | BattleLogEntry;

export interface HistoricoScrollProps {
  /** Linhas do log (string pronta ou `BattleLogEntry` formatada como `R{n} · texto`). */
  entries: HistoricoLine[];
  /**
   * Dispara a animação de abrir (0→1). Passe `true` ao iniciar a batalha.
   * Se omitido, abre ao montar.
   */
  open?: boolean;
  /** Progresso forçado 0..1 (para demos/frames). Sobrescreve a animação interna. */
  progress?: number;
  /** Duração da abertura em ms (ignorada com `prefers-reduced-motion`). */
  unrollMs?: number;
  className?: string;
  style?: React.CSSProperties;
  /** id de teste / a11y */
  'data-testid'?: string;
}

function formatEntry(entry: HistoricoLine): string {
  if (typeof entry === 'string') return entry;
  return `R${entry.round} · ${entry.text}`;
}

function easeOut(p: number): number {
  const t = Math.max(0, Math.min(1, p));
  return 1 - (1 - t) ** 2.2;
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

const PawBullet: React.FC = () => (
  <svg className="historico-paw" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <g fill="#9B1C1C">
      <ellipse cx="7" cy="9.5" rx="3.6" ry="3" />
      <circle cx="2.6" cy="6" r="1.5" />
      <circle cx="5.3" cy="3" r="1.5" />
      <circle cx="8.7" cy="3" r="1.5" />
      <circle cx="11.4" cy="6" r="1.5" />
    </g>
  </svg>
);

const ScrollRoller: React.FC<{ top: number; height?: number }> = ({ top, height = 22 }) => (
  <div className="historico-roller" style={{ top, height }} aria-hidden="true">
    <div className="historico-roller-body" style={{ height }} />
    <div className="historico-roller-cap historico-roller-cap--left" style={{ height: height + 8, top: -4 }} />
    <div className="historico-roller-cap historico-roller-cap--right" style={{ height: height + 8, top: -4 }} />
    <div className="historico-roller-hole historico-roller-hole--left" style={{ top: height / 2 - 5 }} />
    <div className="historico-roller-hole historico-roller-hole--right" style={{ top: height / 2 - 5 }} />
  </div>
);

/**
 * Pergaminho de Histórico estilo Naruto (214×588).
 * Abrir: papel desce do rolo superior; rolo inferior acompanha (`p` 0→1, ease-out).
 */
export const HistoricoScroll: React.FC<HistoricoScrollProps> = ({
  entries,
  open = true,
  progress,
  unrollMs = 1100,
  className,
  style,
  'data-testid': testId = 'historico-scroll',
}) => {
  const reduced = usePrefersReducedMotion();
  const [animP, setAnimP] = useState(() => (open ? (reduced ? 1 : 0) : 0));
  const rafRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof progress === 'number') return;
    if (!open) {
      setAnimP(0);
      return;
    }
    if (reduced) {
      setAnimP(1);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / unrollMs);
      setAnimP(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    setAnimP(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, unrollMs, reduced, progress]);

  const p = typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : animP;
  const e = easeOut(p);
  const paperH = Math.round(e * PAPER_MAX);
  const paperTop = ROLL_H - 6;
  const bottomRollerTop = paperTop + paperH + 2;
  const lines = useMemo(() => entries.map(formatEntry), [entries]);

  useEffect(() => {
    const el = listRef.current;
    if (el && p > 0.85) el.scrollTop = el.scrollHeight;
  }, [lines, p]);

  return (
    <div
      className={`historico-scroll${className ? ` ${className}` : ''}`}
      style={{ width: WIDTH, height: HEIGHT, ...style }}
      data-testid={testId}
      data-progress={p.toFixed(3)}
      role="log"
      aria-label="Histórico de combate"
    >
      <div
        className="historico-paper"
        style={{
          top: paperTop,
          height: Math.max(paperH + 8, p < 0.02 ? 0 : paperH + 8),
          opacity: p < 0.02 ? 0 : 1,
        }}
      >
        <div className="historico-edge historico-edge--left" />
        <div className="historico-edge historico-edge--right" />
        <div className="historico-inner" ref={listRef}>
          <div className="historico-title-row">
            <div className="historico-title">HISTÓRICO</div>
            <div className="historico-hanko" aria-hidden="true" title="Selo" />
          </div>
          <div className="historico-title-accent" />
          <ul className="historico-lines">
            {lines.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`} className="historico-line">
                <PawBullet />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {p > 0.02 ? <ScrollRoller top={bottomRollerTop} height={22} /> : null}
      <ScrollRoller top={0} height={ROLL_H} />

      {p > 0.02 ? (
        <>
          <div className="historico-cord" aria-hidden="true" />
          <div className="historico-tassel" aria-hidden="true" />
        </>
      ) : (
        <div className="historico-closed-curl" aria-hidden="true" />
      )}
    </div>
  );
};

export default HistoricoScroll;
