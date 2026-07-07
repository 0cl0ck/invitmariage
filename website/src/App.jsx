import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSmoothScroll } from "./lib/smoothScroll.js";
import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import InvitationPage from "./pages/InvitationPage.jsx";
import AdminPage from "./components/AdminPage.jsx";

export default function App() {
  // Lenis + GSAP ScrollTrigger wiring + dev hooks (window.__lenis / window.__ST)
  useSmoothScroll();

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Invitation unique servie à la racine. */}
          <Route path="/" element={<InvitationPage variantKey="ceremonie" />} />
          {/* Espace privé des mariés (non lié, noindex, connexion requise). */}
          <Route path="/espace-maries" element={<AdminPage />} />
          {/* Anciens liens (/ceremonie, /vin-dhonneur…) → invitation unique. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
