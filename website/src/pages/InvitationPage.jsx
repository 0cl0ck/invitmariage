import { useEffect, useRef, useState } from "react";
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
  // Until "Continuer" is clicked, the content below is removed from the document
  // so there is nothing to scroll past — the visitor stops on the card (butée).
  const [continued, setContinued] = useState(false);

  useEffect(() => {
    document.title = `${wedding.couple} · ${variant.navLabel} · ${wedding.city}`;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) return; // content visible by default; skip motion
      // Only animate elements actually laid out (content is display:none until
      // "Continuer"); this effect re-runs when `continued` flips.
      const items = gsap.utils
        .toArray(rootRef.current.querySelectorAll(".reveal"))
        .filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 42 });
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

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [variant, continued]);

  const smoothScrollTo = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lenis = window.__lenis;
    // Desktop: drive Lenis (matches the site's smooth scroll). Touch devices:
    // Lenis doesn't manage native touch scroll, so use the browser's own smooth
    // scroll (reliable, and Lenis simply tracks it).
    if (lenis && typeof lenis.scrollTo === "function" && !coarse) {
      lenis.scrollTo(target, { duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Reveal the content (if still gated), then auto-scroll to a section.
  const revealThenScroll = (id) => {
    if (continued) {
      smoothScrollTo(id);
      return;
    }
    setContinued(true);
    // Let the revealed content lay out AND the reveal effect's own refresh settle
    // first — otherwise that refresh cancels the scroll mid-flight.
    setTimeout(() => {
      // The document just got taller; recompute Lenis's scroll limit, else
      // scrollTo clamps to the old (shorter) max and goes nowhere.
      if (window.__lenis && typeof window.__lenis.resize === "function") {
        window.__lenis.resize();
      }
      ScrollTrigger.refresh();
      smoothScrollTo(id);
    }, 130);
  };

  const handleContinue = () => revealThenScroll("apres-hero");
  const goToRsvp = (e) => {
    e.preventDefault();
    revealThenScroll("rsvp");
  };

  return (
    <div className="page" ref={rootRef}>
      <header className="topbar">
        <span className="topbar__monogram">{wedding.monogram}</span>
        <a className="topbar__cta" href="#rsvp" onClick={goToRsvp}>
          Répondre
        </a>
      </header>

      <CinematicHero opening={variant.opening} onContinue={handleContinue}>
        <InvitationCard card={variant.card} />
      </CinematicHero>

      <main
        id="apres-hero"
        className={"content" + (continued ? "" : " content--locked")}
      >
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
