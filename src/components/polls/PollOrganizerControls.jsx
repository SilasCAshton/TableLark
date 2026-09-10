function PollVoters({ names = [], unnamedVotes = 0 }) {
  return (
    <div className="poll-voters">
      {names.length || unnamedVotes ? (
        <>
          {names.length ? (
            <ul aria-label="Voters">
              {names.map((name, index) => <li key={`${index}-${name}`}>{name}</li>)}
            </ul>
          ) : null}
          {unnamedVotes > 0 ? (
            <p>{unnamedVotes} unnamed {unnamedVotes === 1 ? "vote" : "votes"}</p>
          ) : null}
        </>
      ) : <p>No votes yet.</p>}
    </div>
  );
}

export default function PollOrganizerControls({ poll, isActing, onClose }) {
  return (
    <section className="poll-card poll-organizer">
      <h2>Votes: {poll.acceptedBallots}</h2>
      <PollVoters names={poll.voterNames} unnamedVotes={poll.unnamedVotes} />
      <button
        type="button"
        className="danger"
        disabled={isActing}
        onClick={onClose}
      >
        {isActing ? "Ending voting…" : "End voting"}
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
