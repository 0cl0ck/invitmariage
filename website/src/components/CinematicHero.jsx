import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FRAME_COUNT, FRAME_PAD, FRAME_EXT, FRAME_DIR } from "../lib/frames-manifest.js";

const BASE = import.meta.env.BASE_URL; // "./" when built with --base=./
const frameUrl = (i) =>
  `${BASE}${FRAME_DIR}/frame-${String(i + 1).padStart(FRAME_PAD, "0")}.${FRAME_EXT}`;
const POSTER = frameUrl(0);

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Full-screen scroll-scrubbed hero of the real Dunkirk town hall.
 *
 * Instead of seeking a <video> (which mobile browsers throttle — only a few
 * frames render while scrolling), we pre-extract the footage into WebP frames
 * and draw them to a <canvas> as the scroll advances. Drawing a decoded image
 * is instant on every device, so the scrub is smooth on mobile AND desktop.
 *
 * The centered invitation card (children) fades in on the final frames.
 * prefers-reduced-motion -> static first frame + instant card, no scrub.
 *
 * Dev hook: window.__bgv = the background <canvas>.
 */
export default function CinematicHero({ opening, children }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const openingRef = useRef(null);
  const revealRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    window.__bgv = canvas;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const images = new Array(FRAME_COUNT);
    let lastDrawn = -1;

    const drawFrame = (target) => {
      let idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(target)));
      let img = images[idx];
      if (!img || !img.complete || !img.naturalWidth) {
        // Requested frame not loaded yet — keep the last good frame on screen.
        if (lastDrawn < 0) return;
        img = images[lastDrawn];
        idx = lastDrawn;
        if (!img || !img.complete || !img.naturalWidth) return;
      }
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.max(cw / iw, ch / ih); // cover
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      lastDrawn = idx;
    };

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      drawFrame(lastDrawn >= 0 ? lastDrawn : 0);
    };

    const loadFrame = (i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i);
      img.onload = () => {
        if (lastDrawn < 0 && i === 0) drawFrame(0);
        else if (i === lastDrawn) drawFrame(i);
      };
      images[i] = img;
    };

    // Frame 0 always (initial paint). Rest only when we actually scrub.
    loadFrame(0);
    resize();
    if (images[0].complete) drawFrame(0);
    if (!prefersReduced) {
      for (let i = 1; i < FRAME_COUNT; i++) loadFrame(i);
    }
    window.addEventListener("resize", resize);

    const ctxGsap = gsap.context(() => {
      gsap.set(openingRef.current, { opacity: 1 });

      if (prefersReduced) {
        gsap.set(openingRef.current, { opacity: 0 });
        gsap.set(revealRef.current, { opacity: 1, y: 0, scale: 1 });
        gsap.set(hintRef.current, { opacity: 0 });
        return;
      }

      gsap.set(revealRef.current, { opacity: 0, y: 30, scale: 0.965 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          drawFrame(p * (FRAME_COUNT - 1));

          gsap.set(openingRef.current, { opacity: 1 - clamp01(p / 0.18) });
          gsap.set(hintRef.current, { opacity: 1 - clamp01(p / 0.1) });

          const cp = clamp01((p - 0.82) / 0.16);
          gsap.set(revealRef.current, {
            opacity: cp,
            y: 30 * (1 - cp),
            scale: 0.965 + 0.035 * cp,
          });
          gsap.set(overlayRef.current, { opacity: 0.45 + 0.35 * cp });
        },
      });

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => {
      window.removeEventListener("resize", resize);
      ctxGsap.revert();
      for (const img of images) {
        if (img) {
          img.onload = null;
          img.src = "";
        }
      }
      if (window.__bgv === canvas) window.__bgv = undefined;
    };
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-stage">
        <canvas
          ref={canvasRef}
          className="hero-video"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${POSTER})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="hero-overlay" ref={overlayRef} />
        <div className="hero-grain" aria-hidden="true" />

        <div className="hero-opening" ref={openingRef}>
          <p className="kicker">{opening.kicker}</p>
          <h1 className="hero-title">{opening.title}</h1>
          <p className="hero-sub">{opening.subtitle}</p>
        </div>

        <div className="hero-reveal" ref={revealRef}>
          {children}
        </div>

        <div className="scroll-hint" ref={hintRef} aria-hidden="true">
          <span>{opening.hint}</span>
          <span className="scroll-hint__line" />
        </div>
      </div>
    </section>
  );
}
