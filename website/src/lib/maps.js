// Build a Google Maps directions URL from a place label.
// Returns null for missing or placeholder ("à confirmer", "[ ... ]") places.
export function mapsUrl(place) {
  if (!place) return null;
  const s = String(place).trim();
  if (!s || /à confirmer/i.test(s) || /[[\]]/.test(s)) return null;
  // "Temple protestant · quai aux Bois" -> "Temple protestant quai aux Bois"
  let q = s.replace(/·/g, " ").replace(/\s+/g, " ").trim();
  // Disambiguate venues that don't already name the city.
  if (!/dunkerque/i.test(q)) q += " Dunkerque";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}
