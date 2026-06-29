import MapLink from "./MapLink.jsx";

export default function ProgramTimeline({ program }) {
  return (
    <section className="section section--program">
      <div className="container">
        <header className="section-head reveal">
          <p className="kicker">{program.kicker}</p>
          <h2 className="section-title">{program.title}</h2>
        </header>

        <ol className="timeline">
          {program.steps.map((step, i) => (
            <li className="timeline__item reveal" key={i}>
              <span className="timeline__dot" aria-hidden="true" />
              <span className="timeline__time">{step.time}</span>
              <span className="timeline__body">
                <span className="timeline__name">{step.name}</span>
                <span className="timeline__place">{step.place}</span>
                <MapLink place={step.place} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
