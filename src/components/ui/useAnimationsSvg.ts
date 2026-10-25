import { RefObject, useEffect } from "react";

// Les animations SVG (SMIL : <animate>, <animateMotion>) tournent sur le thread
// principal et recalculent les styles à chaque image, même hors écran ou dans la
// version masquée (mobile / bureau) d'un schéma. On ne les joue que lorsque le
// schéma est visible, et jamais si l'utilisateur réduit les animations.
export function useAnimationsSvg(ref: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    svg.pauseAnimations();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
    io.observe(svg);
    return () => io.disconnect();
  }, [ref]);
}
