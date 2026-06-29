import CometCard from "./CometCard.jsx";

export default function InvitationCard({ card }) {
  return (
    <CometCard>
      <article className="card">
        <div className="card__rule" aria-hidden="true" />
        <p className="kicker card__kicker">{card.kicker}</p>
        <p className="card__intro">{card.intro}</p>
        <h2 className="card__names">{card.names}</h2>
        <p className="card__date">{card.dateLong}</p>
        <p className="card__place">{card.place}</p>
        <p className="card__footnote">{card.footnote}</p>
        <div className="card__rule" aria-hidden="true" />
      </article>
    </CometCard>
  );
}
