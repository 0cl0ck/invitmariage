import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const BASE = import.meta.env.BASE_URL; // "./" when built with --base=./
const VIDEO_SRC = `${BASE}bg.mp4`;
const POSTER_SRC = `${BASE}img/mairie-dunkerque-hero.png`;
const FALLBACK_DURATION = 8.04; // seconds (real video length)

function detectCanScrub() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.matchMedia("(max-width: 820px)").matches;
  // Scrubbing a <video> via currentTime is only reliable on desktop pointers.
  return !reduced && !coarse && !small;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Full-screen scroll-scrubbed video hero built on the real Dunkirk town-hall
 * footage. Scroll progress drives video.currentTime; the centered invitation
 * card (passed as children) fades in on the final frames.
 *
 * Fallbacks:
 *  - mobile / coarse pointer / small screen -> static poster, no scrub
 *  - prefers-reduced-motion                 -> static poster, instant reveal
 *
 * Dev hook: window.__bgv = the background <video> element.
 */
export default function CinematicHero({ opening, children }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const openingRef = useRef(null);
  const revealRef = useRef(null);
  const hintRef = useRef(null);

  const [canScrub] = useState(detectCanScrub);

  useEffect(() => {
    const video = videoRef.current;
    window.__bgv = video;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      // Starting states
      gsap.set(openingRef.current, { opacity: 1 });

      if (prefersReduced) {
        // Reduced motion: show the card immediately, no scroll choreography.
        // Hide the opening text so it doesn't overlap the centered card.
        gsap.set(openingRef.current, { opacity: 0 });
        gsap.set(revealRef.current, { opacity: 1, y: 0, scale: 1 });
        gsap.set(hintRef.current, { opacity: 0 });
        return;
      }

      gsap.set(revealRef.current, { opacity: 0, y: 30, scale: 0.965 });

      if (!canScrub) {
        // STATIC FALLBACK (mobile): poster stays, choreograph on native scroll.
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(openingRef.current, { opacity: 1 - clamp01(p / 0.35) });
            gsap.set(hintRef.current, { opacity: 1 - clamp01(p / 0.2) });
            const cp = clamp01((p - 0.5) / 0.45);
            gsap.set(revealRef.current, {
              opacity: cp,
              y: 30 * (1 - cp),
              scale: 0.965 + 0.035 * cp,
            });
            gsap.set(overlayRef.current, { opacity: 0.45 + 0.35 * cp });
          },
        });
        return;
      }

      // SCRUB MODE (desktop): map scroll -> video.currentTime.
      video.pause();
      const seek = (t) => {
        const d = video.duration || FALLBACK_DURATION;
        const target = Math.min(t, d - 0.001);
        if (!Number.isNaN(target)) video.currentTime = target;
      };

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const d = video.duration || FALLBACK_DURATION;
          seek(p * d);

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

      // Refresh once the video knows its real duration / first frame is ready.
      const onReady = () => ScrollTrigger.refresh();
      if (video.readyState < 1) {
        video.addEventListener("loadedmetadata", onReady, { once: true });
      }
      video.addEventListener("loadeddata", onReady, { once: true });
    }, sectionRef);

    return () => {
      ctx.revert();
      if (window.__bgv === video) window.__bgv = undefined;
    };
  }, [canScrub]);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-stage">
        <video
          ref={videoRef}
          className="hero-video"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          preload={canScrub ? "auto" : "none"}
          aria-hidden="true"
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
