import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSmoothScroll } from "./lib/smoothScroll.js";
import InvitationPage from "./pages/InvitationPage.jsx";
import AdminPage from "./components/AdminPage.jsx";
import { variants } from "./content/variants.js";

export default function App() {
  // Lenis + GSAP ScrollTrigger wiring + dev hooks (window.__lenis / window.__ST)
  useSmoothScroll();

  return (
    <BrowserRouter>
      <Routes>
        {/* Default landing = full-program variant */}
        <Route path="/" element={<Navigate to="/ceremonie" replace />} />
        <Route
          path="/ceremonie"
          element={<InvitationPage key="ceremonie" variant={variants.ceremonie} />}
        />
        <Route
          path="/vin-dhonneur"
          element={<InvitationPage key="vin-dhonneur" variant={variants.vinDhonneur} />}
        />
        {/* Espace privé des mariés (non lié, noindex, connexion requise). */}
        <Route path="/espace-maries" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/ceremonie" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
