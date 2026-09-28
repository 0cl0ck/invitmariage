# Changelog

- 2026-09-24 · Choix des menus du repas (lien personnel par foyer `/menu/<token>`, confirmation définitive + email Resend, quota 20 parts par gâteau, page `/espace-maries/menus` avec envoi, relance, totaux et CSV) : le restaurant demande le choix de chaque convive, et le verrouillage évite les changements de dernière minute.
- 2026-09-28 · Menus : date limite affichée passée au 4 octobre (la précédente, 27/09, était échue avant la mise en prod) et `.env.example` maintenu suivi malgré `.env*`.
- 2026-09-28 · Menus : retrait du choix de gâteau (champ, quota, comptage, colonne SQL via `supabase/2026-09-28-sans-gateau.sql`) : le gâteau se choisira sur place, décision d'Hugo.
