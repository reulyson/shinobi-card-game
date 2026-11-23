import { useLayoutEffect, useRef, useState } from 'react';

const COLLECTION_BASE_W = 312;
/** Abaixo disso o auto-fit distorce stats/arte (ex.: faixa do lobby). */
const COLLECTION_FIT_MIN_W = 200;

/** Escala cartas de coleção à largura do wrapper (cqw não funciona dentro de transform). */
export function useCollectionCardScale(enabled: boolean) {
  const scaleRef = useRef<HTMLDivElement>(null);
  const [wideForFit, setWideForFit] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = scaleRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.clientWidth;
      if (w > 0) {
        el.style.setProperty('--sc-collection-scale', String(w / COLLECTION_BASE_W));
        setWideForFit(w >= COLLECTION_FIT_MIN_W);
      }
    };

    apply();
    requestAnimationFrame(apply);
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);

  return { ref: scaleRef, wideForFit };
}