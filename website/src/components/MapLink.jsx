import { mapsUrl } from "../lib/maps.js";

// Small "Itinéraire" link (map-pin icon) opening Google Maps directions to a
// place. Renders nothing when the place is unknown / "à confirmer".
export default function MapLink({ place, label = "Itinéraire", className = "" }) {
  const url = mapsUrl(place);
  if (!url) return null;
  return (
    <a
      className={`map-link ${className}`.trim()}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Itinéraire vers ${place} (Google Maps)`}
    >
      <svg
        className="map-link__icon"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        />
      </svg>
      <span>{label}</span>
    </a>
  );
}
