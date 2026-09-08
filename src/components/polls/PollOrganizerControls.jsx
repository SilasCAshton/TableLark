export default function PollOrganizerControls({ poll, isActing, onClose }) {
  return (
    <section className="poll-card poll-organizer">
      <p className="poll-eyebrow">Organizer controls</p>
      <h2>
        Picks submitted: {poll.acceptedBallots}
        {poll.organizerHasVoted ? " (including yours)" : ""}
      </h2>
      <p>Up to {poll.maximumBallots} people can submit their picks.</p>
      <button
        type="button"
        className="danger"
        disabled={isActing}
        onClick={onClose}
      >
        {isActing ? "Finishing…" : "Everyone has picked"}
      </button>
    </section>
  );
}

export function PollTieDecision({ poll, isActing, onChoose }) {
  return (
    <>
      <p className="poll-eyebrow">Final tie</p>
      <h2>Choose the winning restaurant</h2>
      <div className="poll-choice-list">
        {poll.tieCandidates.map((option) => (
          <button
            type="button"
            key={option.id}
            disabled={isActing}
            onClick={() => onChoose(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </>
  );
}
