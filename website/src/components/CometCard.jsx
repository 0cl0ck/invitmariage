import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Port of Aceternity's "Comet Card" (3D mouse-tilt + comet glare) to our stack:
// React + GSAP + CSS variables — no Tailwind, no framer-motion.
// Faithful mapping to the original (rotateDepth 17.5°, translateDepth 20px,
// radial white glare in mix-blend overlay, hover scale 1.05).
//
// We animate a plain proxy object with GSAP and write the transform string
// ourselves (rather than letting GSAP drive the CSS transform), which keeps the
// composition explicit and avoids GSAP's independent-transform reset warnings.
const ROT = 17.5; // deg — rotateDepth
const TR = 20; // px — translateDepth

export default function CometCard({ children, className = "" }) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    const glare = glareRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // No 3D tilt on touch (no hover) or when reduced motion is requested.
    if (reduce || coarse) return;

    const state = { rx: 0, ry: 0, tx: 0, ty: 0, sc: 1, tz: 0 };
    const apply = () => {
      el.style.transform =
        `translate3d(${state.tx}px, ${state.ty}px, ${state.tz}px) ` +
        `rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale(${state.sc})`;
    };
    const q = (prop, duration = 0.6) =>
      gsap.quickTo(state, prop, { duration, ease: "power3.out", onUpdate: apply });
    const rotX = q("rx");
    const rotY = q("ry");
    const tX = q("tx");
    const tY = q("ty");
    const sc = q("sc", 0.25);
    const tZ = q("tz", 0.25);

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const xPct = (e.clientX - r.left) / r.width - 0.5;
      const yPct = (e.clientY - r.top) / r.height - 0.5;
      rotX(yPct * 2 * ROT);
      rotY(-xPct * 2 * ROT);
      tX(xPct * 2 * TR);
      tY(-yPct * 2 * TR);
      if (glare) {
        glare.style.setProperty("--gx", `${(xPct + 0.5) * 100}%`);
        glare.style.setProperty("--gy", `${(yPct + 0.5) * 100}%`);
      }
    };
    const onEnter = () => {
      el.style.willChange = "transform"; // promote only while interacting
      sc(1.05);
      tZ(50);
      if (glare) glare.style.opacity = "0.6";
    };
    const onLeave = () => {
      rotX(0);
      rotY(0);
      tX(0);
      tY(0);
      sc(1);
      tZ(0);
      if (glare) glare.style.opacity = "0";
      el.style.willChange = "";
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(state);
    };
  }, []);

  return (
    <div className={`comet ${className}`}>
      <div className="comet__card" ref={cardRef}>
        {children}
        <div className="comet__glare" ref={glareRef} aria-hidden="true" />
      </div>
    </div>
  );
}
