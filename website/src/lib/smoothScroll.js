import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sets up Lenis smooth scrolling synced with GSAP ScrollTrigger.
 * Exposes dev hooks: window.__lenis and window.__ST.
 * Respects prefers-reduced-motion (falls back to native scrolling).
 */
export function useSmoothScroll() {
  useEffect(() => {
    // Dev hook: ScrollTrigger is always available for debugging.
    window.__ST = ScrollTrigger;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      // No smooth scroll; native scrolling only.
      window.__lenis = null;
      return () => {
        window.__ST = undefined;
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // Touch stays native for reliability (see mobile fallback in CinematicHero).
      syncTouch: false,
    });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.__lenis = undefined;
      window.__ST = undefined;
    };
  }, []);
}
