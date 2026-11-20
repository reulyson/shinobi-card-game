import { useLayoutEffect, useRef } from 'react';

/** Espelha o fit de gen_v7o.py: só .nm,.rules,.cap,.traits,.lvl; k até 0.8. */
const FIT_SELECTOR = '.nm, .rules, .cap, .traits, .lvl';
const MIN_SCALE = 0.8;
const STEP = 0.04;

/**
 * Reduz fontes do painel até caber (sem clip), como no script da referência.
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

    const reset = () => {
      els.forEach((el, i) => {
        el.style.fontSize = `${bases[i]}px`;
      });
    };

    const applyScale = (k: number) => {
      els.forEach((el, i) => {
        el.style.fontSize = `${bases[i] * k}px`;
      });
    };

    const fit = () => {
      reset();
      let k = 1;
      // gen_v7o: while scrollHeight > clientHeight+8 && k > .8
      while (box.scrollHeight > box.clientHeight + 8 && k > MIN_SCALE) {
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
