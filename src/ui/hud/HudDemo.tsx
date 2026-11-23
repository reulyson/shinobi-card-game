import React, { useEffect, useMemo, useState } from 'react';
import { HistoricoScroll } from './HistoricoScroll';
import { TurnChakraHud } from './TurnChakraHud';
import { getTimerFrame } from './timerFrames';
import type { TurnCoinPreview } from './TurnCoin';
import type { BattleLogEntry } from '../../types/game';

const DEMO_LINES: BattleLogEntry[] = [
  { id: 'd1', round: 4, text: 'Você declarou 4 ataques.', tone: 'combat', actor: 'player' },
  { id: 'd2', round: 4, text: 'Rival posicionou 3 bloqueios.', tone: 'combat', actor: 'enemy' },
  {
    id: 'd3',
    round: 4,
    text: 'Prévia: 3 mortes, 2 sobreviventes, 3 de dano à Vitalidade rival.',
    tone: 'info',
    actor: 'system',
  },
  { id: 'd4', round: 4, text: 'Confirme para resolver pela ordem 1→4.', tone: 'info', actor: 'system' },
  { id: 'd5', round: 3, text: 'Rival: Magen (Rápido).', tone: 'jutsu', actor: 'enemy' },
  { id: 'd6', round: 3, text: 'Você: Fūma Shuriken (Rápido).', tone: 'jutsu', actor: 'player' },
  { id: 'd7', round: 2, text: 'Rival jogou Zabuza.', tone: 'info', actor: 'enemy' },
  { id: 'd8', round: 1, text: 'Você jogou Naruto.', tone: 'info', actor: 'player' },
];

/**
 * Demo isolada Parte 4 (`?demo=part4`) para screenshots / GIF.
 * Timer acelerado (8s) para capturar dreno + poof sem esperar 1 minuto.
 * `?frame=0..13` congela o keyframe idêntico a gen_timer.FR / timer-XX.png.
 */
export const HudDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'player' | 'rival'>('player');
  const [label, setLabel] = useState<'CONFIRMAR ATAQUE' | 'CONFIRMAR BLOQUEIOS'>('CONFIRMAR ATAQUE');
  const [forceProgress, setForceProgress] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(8000);
  const [frameIdx, setFrameIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 200);
    return () => window.clearTimeout(t);
  }, []);

  // Query: ?demo=part4&scroll=0.45&side=rival&paused=1&ms=5000&block=1&frame=4
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const sp = q.get('scroll');
    if (sp != null && sp !== '') setForceProgress(Number(sp));
    const s = q.get('side');
    if (s === 'rival' || s === 'player') setSide(s);
    if (q.get('block') === '1') setLabel('CONFIRMAR BLOQUEIOS');
    setPaused(q.get('paused') === '1');
    if (q.get('realtime') === '1') setDurationMs(60_000);
    else if (q.get('ms')) setDurationMs(Number(q.get('ms')));
    const fr = q.get('frame');
    if (fr != null && fr !== '') {
      const n = Number(fr);
      if (Number.isFinite(n)) setFrameIdx(n);
    }
  }, []);

  const preview: TurnCoinPreview | null = useMemo(() => {
    if (frameIdx == null) return null;
    const fr = getTimerFrame(frameIdx);
    if (!fr) return null;
    return {
      level: fr.level,
      displaySide: fr.side,
      symbol: fr.symbol,
      poof: fr.poof,
    };
  }, [frameIdx]);

  const hudSide = preview?.displaySide ?? side;

  return (
    <div
      className="min-h-screen w-full flex flex-wrap items-start justify-center gap-10 p-8"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #1a2744 0%, #0b111a 55%, #070a12 100%)',
      }}
      data-testid="part4-demo"
    >
      <div>
        <div className="mb-3 font-display text-amber-300 text-lg tracking-wider">HistoricoScroll</div>
        <HistoricoScroll
          entries={DEMO_LINES}
          open={open}
          progress={forceProgress}
          unrollMs={1400}
        />
      </div>

      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="font-display text-amber-300 text-lg tracking-wider">TurnCoin + ChakraRing</div>
        <TurnChakraHud
          side={hudSide}
          confirmLabel={label}
          durationMs={durationMs}
          paused={paused || preview != null}
          preview={preview}
          size={104}
          player={{ filled: 7, unlocked: 9, reserve: 2 }}
          rival={{ filled: 6, unlocked: 8, reserve: 1 }}
          onConfirm={() => setSide((s) => (s === 'player' ? 'rival' : 'player'))}
          onTimeout={() => setSide((s) => (s === 'player' ? 'rival' : 'player'))}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-xs"
            onClick={() => setSide('player')}
          >
            Seu turno
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-xs"
            onClick={() => setSide('rival')}
          >
            Rival
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-xs"
            onClick={() =>
              setLabel((l) => (l === 'CONFIRMAR ATAQUE' ? 'CONFIRMAR BLOQUEIOS' : 'CONFIRMAR ATAQUE'))
            }
          >
            Alternar rótulo
          </button>
        </div>
      </div>
    </div>
  );
};

export default HudDemo;
