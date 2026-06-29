export default function InfoSection({ info }) {
  return (
    <section className="section section--info">
      <div className="container">
        <header className="section-head reveal">
          <p className="kicker">{info.kicker}</p>
          <h2 className="section-title">{info.title}</h2>
        </header>

        <div className="info-grid">
          {info.blocks.map((block, i) => (
            <article className="info-card reveal" key={i}>
              <h3 className="info-card__title">{block.h}</h3>
              {(Array.isArray(block.p) ? block.p : [block.p]).map((line, j) => (
                <p className="info-card__text" key={j}>
                  {line}
                </p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
