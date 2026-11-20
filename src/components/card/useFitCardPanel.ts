import { useLayoutEffect, useRef } from 'react';

/**
 * Auto-fit do painel v7o.
 * - Nunca encolhe `.nm` / `.traits` (nome e patente íntegros).
 * - Encolhe progressivamente `.rules`, `.req`, `.cap`, `.lvl` (mín. 0.8 como gen_v7o).
 * - Se ainda não couber: sobe a altura do painel (LoR ou jutsu) sem clipar o nome.
 */
const SHRINK_SELECTOR = '.rules, .req, .cap, .lvl';
const MIN_SCALE = 0.8;
const STEP = 0.04;
const LOR_BASE_H = 212;
const LOR_MAX_H = 268;
const JUT_BASE_H = 150;
const JUT_MAX_H = 178;

export function useFitCardPanel(enabled: boolean, deps: readonly unknown[]) {
  const boxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!enabled || !box) return;

    const card = box.closest('.card6');
    const isLor = card?.classList.contains('lor') ?? false;
    const isJut = card?.classList.contains('jut') ?? false;
    const shrinkEls = Array.from(box.querySelectorAll<HTMLElement>(SHRINK_SELECTOR));
    const nm = box.querySelector<HTMLElement>('.nm');

    const bases = shrinkEls.map((el) => parseFloat(getComputedStyle(el).fontSize) || 10);

    const reset = () => {
      shrinkEls.forEach((el) => {
        el.style.removeProperty('font-size');
      });
      box.style.removeProperty('height');
      box.style.removeProperty('min-height');
    };

    const refreshBases = () => {
      shrinkEls.forEach((el, i) => {
        el.style.removeProperty('font-size');
        bases[i] = parseFloat(getComputedStyle(el).fontSize) || bases[i];
      });
    };

    const applyScale = (k: number) => {
      shrinkEls.forEach((el, i) => {
        el.style.setProperty('font-size', `${bases[i] * k}px`, 'important');
      });
    };

    const nameVisible = (): boolean => {
      if (!nm) return true;
      return nm.getBoundingClientRect().top >= box.getBoundingClientRect().top - 0.5;
    };

    const overflows = (): boolean =>
      box.scrollHeight > box.clientHeight + 8 || !nameVisible();

    const growBox = (base: number, max: number) => {
      let h = base;
      box.style.setProperty('height', `${h}px`, 'important');
      while (overflows() && h < max) {
        h += 4;
        box.style.setProperty('height', `${h}px`, 'important');
      }
    };

    const fit = () => {
      reset();
      refreshBases();

      let k = 1;
      while (overflows() && k > MIN_SCALE) {
        k -= STEP;
        applyScale(k);
      }

      if (overflows()) {
        if (isLor) growBox(LOR_BASE_H, LOR_MAX_H);
        else if (isJut) growBox(JUT_BASE_H, JUT_MAX_H);
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
