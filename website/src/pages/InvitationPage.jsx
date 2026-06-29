import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CinematicHero from "../components/CinematicHero.jsx";
import InvitationCard from "../components/InvitationCard.jsx";
import ProgramTimeline from "../components/ProgramTimeline.jsx";
import InfoSection from "../components/InfoSection.jsx";
import CarpoolBoard from "../components/CarpoolBoard.jsx";
import RsvpForm from "../components/RsvpForm.jsx";
import ClosingSection from "../components/ClosingSection.jsx";
import { wedding } from "../content/variants.js";

export default function InvitationPage({ variant }) {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = `${wedding.couple} · ${variant.navLabel} · ${wedding.city}`;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) return; // content is visible by default; skip motion
      const items = gsap.utils.toArray(rootRef.current.querySelectorAll(".reveal"));
      gsap.set(items, { opacity: 0, y: 42 });
      // Reveal each section's elements in a soft cascade as they enter view.
      ScrollTrigger.batch(items, {
        start: "top 86%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.12,
            overwrite: true,
          }),
      });
    }, rootRef);

    // Recompute trigger positions after first paint / fonts.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [variant]);

  const goToRsvp = (e) => {
    e.preventDefault();
    const target = document.getElementById("rsvp");
    if (!target) return;
    if (window.__lenis) window.__lenis.scrollTo(target);
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="page" ref={rootRef}>
      <header className="topbar">
        <span className="topbar__monogram">{wedding.monogram}</span>
        <a className="topbar__cta" href="#rsvp" onClick={goToRsvp}>
          Répondre
        </a>
      </header>

      <CinematicHero opening={variant.opening}>
        <InvitationCard card={variant.card} />
      </CinematicHero>

      <main className="content">
        <ProgramTimeline program={variant.program} />
        <InfoSection info={variant.info} />
        <CarpoolBoard variant={variant} />
        <section id="rsvp" className="section section--rsvp">
          <RsvpForm variant={variant} />
        </section>
        <ClosingSection variant={variant} />
      </main>
    </div>
  );
}
