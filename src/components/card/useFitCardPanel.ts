import { useLayoutEffect, useRef } from 'react';

/** Espelha o fit de gen_v7o.py: .nm,.rules,.cap,.traits,.lvl (+ req/pill/lvlbar). */
const FIT_SELECTOR = '.nm, .rules, .cap, .traits, .lvl, .req, .lvlbar b, .pill';
const MIN_PX = 7;
const MIN_SCALE = 0.62;
const STEP = 0.03;

/**
 * Reduz fontes do painel até caber (sem clip).
 * Ativo em hand/zoom/collection (escala nativa 312×438).
 */
export function useFitCardPanel(enabled: boolean, deps: readonly unknown[]) {
  const boxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!enabled || !box) return;

    const els = Array.from(box.querySelectorAll<HTMLElement>(FIT_SELECTOR));
    if (els.length === 0) return;

    const bases = els.map((el) => parseFloat(getComputedStyle(el).fontSize) || 10);
    const baseGap = parseFloat(getComputedStyle(box).gap) || 2;
    const basePadT = parseFloat(getComputedStyle(box).paddingTop) || 2;
    const basePadB = parseFloat(getComputedStyle(box).paddingBottom) || 2;

    const reset = () => {
      els.forEach((el, i) => {
        el.style.fontSize = `${bases[i]}px`;
        if (el.classList.contains('rules')) {
          el.style.lineHeight = '';
        }
      });
      box.style.gap = '';
      box.style.paddingTop = '';
      box.style.paddingBottom = '';
    };

    const applyScale = (k: number) => {
      els.forEach((el, i) => {
        el.style.fontSize = `${Math.max(MIN_PX, bases[i] * k)}px`;
        if (el.classList.contains('rules')) {
          el.style.lineHeight = `${Math.max(1.05, 1.22 * k)}`;
        }
      });
      box.style.gap = `${Math.max(0.5, baseGap * k)}px`;
      box.style.paddingTop = `${Math.max(1, basePadT * k)}px`;
      box.style.paddingBottom = `${Math.max(1, basePadB * k)}px`;
    };

    /** scrollHeight inclui ::after abspos do pergaminho; medimos fluxo in-flow. */
    const contentOverflow = () => {
      const styles = getComputedStyle(box);
      const gap = parseFloat(styles.gap) || 0;
      const pad =
        (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
      const kids = Array.from(box.children) as HTMLElement[];
      let h = 0;
      let inFlow = 0;
      for (const kid of kids) {
        const pos = getComputedStyle(kid).position;
        if (pos === 'absolute' || pos === 'fixed') continue;
        h += kid.offsetHeight;
        inFlow += 1;
      }
      const gaps = Math.max(0, inFlow - 1) * gap;
      return h + gaps + pad - box.clientHeight;
    };

    const fit = () => {
      reset();
      let k = 1;
      // gen_v7o: while scrollHeight > clientHeight+8
      while (contentOverflow() > 8 && k > MIN_SCALE) {
        k -= STEP;
        applyScale(k);
      }
    };

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      fit();
    };

    run();
    requestAnimationFrame(run);
    void document.fonts.ready.then(run);

    const ro = new ResizeObserver(run);
    ro.observe(box);
    return () => {
      cancelled = true;
      ro.disconnect();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed by caller
  }, [enabled, ...deps]);

  return boxRef;
}
