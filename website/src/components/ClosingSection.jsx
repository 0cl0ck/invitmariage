import { wedding } from "../content/variants.js";

export default function ClosingSection({ variant }) {
  const closing = variant.closing;
  return (
    <footer className="section section--closing">
      <div className="container closing">
        <p className="closing__line reveal">{closing.line}</p>
        <p className="closing__signature reveal">{closing.signature}</p>
        <p className="closing__meta reveal">
          {wedding.city} · {wedding.dateLong}
          <span aria-hidden="true"> · </span>
          {wedding.contactEmails.map((m, i) => (
            <span key={m}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <a href={`mailto:${m}`}>{m}</a>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
