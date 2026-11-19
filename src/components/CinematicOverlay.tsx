import React, { useLayoutEffect, useRef, useState } from 'react';
import { Bot, Swords, User } from 'lucide-react';
import { getCardById } from '../data/cards';
import { CardView } from './CardView';

export interface CinematicView {
  kind: 'reveal' | 'trap' | 'stack' | 'created' | 'effect' | 'pass' | 'stage' | 'combat' | 'round' | 'flash';
  side: 'player' | 'enemy' | 'system';
  title: string;
  cardId?: string;
  text?: string;
  originUid?: string;
  targetUids?: string[];
  /** Combate: projétil do atacante (originUid) até este alvo (ex.: 'gate-enemy'). */
  projectileTo?: string;
  /** Rodada: a Ficha de Ataque voa até este elemento (ex.: 'gate-player'). */
  tokenTo?: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Mede, relativo ao container do overlay, as cartas marcadas com data-uid. */
export function useUnitBoxes(
  ref: React.RefObject<HTMLDivElement | null>,
  uids: string[]
): { boxes: Record<string, Box>; size: { w: number; h: number } } {
  const [state, setState] = useState<{ boxes: Record<string, Box>; size: { w: number; h: number } }>({
    boxes: {},
    size: { w: 0, h: 0 },
  });
  const key = uids.join('|');
  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const base = host.getBoundingClientRect();
      const boxes: Record<string, Box> = {};
      for (const uid of uids) {
        const el = host.querySelector(`[data-uid="${CSS.escape(uid)}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        boxes[uid] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
      }
      setState({ boxes, size: { w: base.width, h: base.height } });
    };
    measure();
    const t = window.setTimeout(measure, 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

/**
 * Cena em overlay (posição absoluta dentro do tabuleiro). Não altera o layout.
 * - reveal/trap/stack/created: carta grande no centro + título + texto curto, depois "voa" para o lado de quem jogou.
 * - effect com origem: anel na carta de origem + setas até os alvos + legenda.
 * - pass/stage/combat: faixa curta (combat destaca o par com seta atacante → bloqueador).
 * Clique pula a cena.
 */
const CinematicOverlay: React.FC<{ cine: CinematicView; durationMs: number; onSkip: () => void }> = ({
  cine,
  durationMs,
  onSkip,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const card = cine.cardId ? getCardById(cine.cardId) : undefined;
  const targets = cine.targetUids ?? [];
  const uids = [
    ...(cine.originUid ? [cine.originUid] : []),
    ...targets,
    ...(cine.projectileTo ? [cine.projectileTo] : []),
    ...(cine.tokenTo ? [cine.tokenTo] : []),
  ];
  const { boxes, size } = useUnitBoxes(ref, uids);
  const origin = cine.originUid ? boxes[cine.originUid] : undefined;
  const hasOriginOnBoard = Boolean(origin);

  const isBig =
    Boolean(card) &&
    !hasOriginOnBoard &&
    (cine.kind === 'reveal' ||
      cine.kind === 'trap' ||
      cine.kind === 'stack' ||
      cine.kind === 'created' ||
      cine.kind === 'effect' ||
      cine.kind === 'flash');

  const sideCls =
    cine.side === 'enemy'
      ? 'border-red-400 bg-red-950/95 text-red-100'
      : cine.side === 'player'
        ? 'border-emerald-400 bg-emerald-950/95 text-emerald-100'
        : 'border-amber-400 bg-slate-950/95 text-amber-100';
  const kindCls =
    cine.kind === 'trap'
      ? 'border-purple-400 bg-purple-950/95 text-purple-100'
      : cine.kind === 'combat'
        ? 'border-orange-400 bg-orange-950/95 text-orange-100'
        : sideCls;
  const SideIcon = cine.side === 'enemy' ? Bot : User;
  const durStyle = { animationDuration: `${Math.max(300, durationMs)}ms` };

  // Ponto de partida das setas: carta de origem no tabuleiro, ou o centro (carta revelada).
  const from = origin
    ? { x: origin.x + origin.w / 2, y: origin.y + origin.h / 2 }
    : { x: size.w / 2, y: size.h / 2 };
  const arrows = targets
    .map((uid) => boxes[uid])
    .filter((b): b is Box => Boolean(b))
    .map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 }));

  const arrowLayer =
    arrows.length > 0 && size.w > 0 ? (
      <svg
        className="pointer-events-none absolute inset-0 z-[82] overflow-visible"
        width={size.w}
        height={size.h}
        aria-hidden="true"
      >
        <defs>
          <marker id="cine-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#fbbf24" />
          </marker>
        </defs>
        {arrows.map((to, i) => (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#fbbf24"
            strokeWidth={3}
            strokeLinecap="round"
            markerEnd="url(#cine-arrow-head)"
            className="cine-arrow"
          />
        ))}
      </svg>
    ) : null;

  const rings = (
    <>
      {origin && (
        <div
          className="cine-ring pointer-events-none absolute z-[81] rounded-xl border-[3px] border-amber-300"
          style={{ left: origin.x - 4, top: origin.y - 4, width: origin.w + 8, height: origin.h + 8 }}
        />
      )}
      {targets.map((uid) => {
        const b = boxes[uid];
        if (!b) return null;
        return (
          <div
            key={uid}
            className="cine-ring-target pointer-events-none absolute z-[81] rounded-xl border-2 border-red-400"
            style={{ left: b.x - 3, top: b.y - 3, width: b.w + 6, height: b.h + 6 }}
          />
        );
      })}
    </>
  );

  if (cine.kind === 'round') {
    const tokenBox = cine.tokenTo ? boxes[cine.tokenTo] : undefined;
    const tx = tokenBox ? tokenBox.x + tokenBox.w / 2 - size.w / 2 : 0;
    const ty = tokenBox ? tokenBox.y + tokenBox.h / 2 - (size.h / 2 + 58) : 0;
    const dur = `${Math.max(300, durationMs)}ms`;
    return (
      <div
        ref={ref}
        className="absolute inset-0 z-[80] cursor-pointer"
        onClick={onSkip}
        role="status"
        aria-label={cine.title}
        title="Clique para pular"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="round-banner px-10 py-4 rounded-2xl border-2 border-amber-400/80 bg-slate-950/95 shadow-2xl text-center"
            style={{ ['--dur' as string]: dur } as React.CSSProperties}
          >
            <div className="text-3xl font-display font-bold text-white tracking-wide">{cine.title}</div>
            {cine.text && (
              <div className={`text-sm font-semibold mt-1 ${cine.side === 'enemy' ? 'text-red-200' : 'text-emerald-200'}`}>
                {cine.text}
              </div>
            )}
          </div>
        </div>
        <div
          className="token-fly absolute left-1/2 top-[calc(50%+58px)] -ml-5 -mt-5 w-10 h-10 rounded-full bg-amber-500 border-2 border-amber-200 flex items-center justify-center text-slate-950 pointer-events-none"
          style={{ ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`, ['--dur' as string]: dur } as React.CSSProperties}
          aria-hidden="true"
        >
          <Swords className="w-5 h-5" />
        </div>
      </div>
    );
  }

  const projBox = cine.projectileTo ? boxes[cine.projectileTo] : undefined;
  const projectile =
    origin && projBox ? (
      <div
        className="cine-projectile pointer-events-none absolute z-[84] w-9 h-9 rounded-full"
        style={
          {
            left: origin.x + origin.w / 2,
            top: origin.y + origin.h / 2,
            ['--dx' as string]: `${projBox.x + projBox.w / 2 - (origin.x + origin.w / 2)}px`,
            ['--dy' as string]: `${projBox.y + projBox.h / 2 - (origin.y + origin.h / 2)}px`,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    ) : null;

  if (!isBig) {
    // Faixa curta (perto da linha entre o campo rival e a Zona de Combate)
    return (
      <div ref={ref} className="absolute inset-0 z-[80] pointer-events-none">
        {rings}
        {arrowLayer}
        {projectile}
        <div className="absolute left-1/2 top-[27%] -translate-x-1/2 max-w-[92%] pointer-events-auto">
          <button
            type="button"
            onClick={onSkip}
            className={`cine-pop px-4 py-2 rounded-xl border shadow-2xl text-left ${kindCls}`}
            title="Clique para pular"
          >
            <span className="flex items-center gap-1.5 text-sm font-bold whitespace-nowrap">
              {cine.side !== 'system' && <SideIcon className="w-3.5 h-3.5 shrink-0" />}
              {cine.title}
            </span>
            {cine.text && cine.kind === 'effect' && (
              <span className="block text-[11px] font-medium opacity-90 mt-0.5 max-w-[420px]">{cine.text}</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-slate-950/45 cursor-pointer"
      onClick={onSkip}
      role="dialog"
      aria-label={cine.title}
      title="Clique para pular"
    >
      {rings}
      {arrowLayer}
      <div
        className={`relative z-[83] flex items-center gap-4 ${
          cine.kind === 'flash' ? 'cine-flash' : `cine-reveal ${cine.side === 'enemy' ? 'cine-to-top' : 'cine-to-bottom'}`
        }`}
        style={durStyle}
      >
        <div className="w-[170px] pointer-events-none">{card && <CardView card={card} size="collection" />}</div>
        <div className={`max-w-[300px] rounded-xl border p-3 shadow-2xl ${kindCls} ${cine.kind === 'trap' ? 'cine-trap-alert border-2' : ''}`}>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
            <SideIcon className="w-3.5 h-3.5" />
            {cine.side === 'enemy' ? 'Oponente' : cine.side === 'player' ? 'Você' : 'Jogo'}
          </div>
          <div className="text-base font-display font-bold leading-tight mt-0.5">{cine.title}</div>
          {cine.text && <p className="text-xs leading-snug mt-1.5 opacity-90">{cine.text}</p>}
          <div className="text-[10px] mt-2 opacity-60">Clique para pular</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Setas da Pilha (estilo LoR): de cada item da Pilha até o alvo dele.
 * O item que resolve primeiro (topo) ganha a seta mais forte.
 */
export const StackTargetArrows: React.FC<{
  stack: Array<{ uid: string; targetUid?: string; caster: 'player' | 'enemy' }>;
}> = ({ stack }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const withTarget = stack.filter((e) => e.targetUid);
  const uids = withTarget.flatMap((e) => [`stack-${e.uid}`, e.targetUid as string]);
  const { boxes, size } = useUnitBoxes(ref, uids);
  const topUid = stack[stack.length - 1]?.uid;
  return (
    <div ref={ref} className="absolute inset-0 z-[45] pointer-events-none" aria-hidden="true">
      {size.w > 0 && (
        <svg className="absolute inset-0 overflow-visible" width={size.w} height={size.h}>
          <defs>
            <marker id="stack-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#e2e8f0" />
            </marker>
          </defs>
          {withTarget.map((e) => {
            const a = boxes[`stack-${e.uid}`];
            const b = boxes[e.targetUid as string];
            if (!a || !b) return null;
            const top = e.uid === topUid;
            return (
              <path
                key={e.uid}
                d={(() => {
                  const x1 = a.x + a.w / 2;
                  const y1 = b.y < a.y ? a.y : a.y + a.h;
                  const x2 = b.x + b.w / 2;
                  const y2 = b.y < a.y ? b.y + b.h : b.y;
                  const cx = (x1 + x2) / 2 + (x2 > x1 ? -40 : 40);
                  const cy = (y1 + y2) / 2;
                  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
                })()}
                fill="none"
                stroke={e.caster === 'player' ? '#67e8f9' : '#f87171'}
                strokeWidth={top ? 2.5 : 1.5}
                strokeDasharray={top ? undefined : '5 4'}
                strokeOpacity={top ? 0.95 : 0.6}
                markerEnd="url(#stack-arrow-head)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default CinematicOverlay;
