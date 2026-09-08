"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  closePollRequest,
  getOrganizerPollRequest,
  getParticipantPollRequest,
  PollRequestError,
  resolveTieRequest,
  submitBallotRequest,
} from "@/lib/polls/client";
import { POLL_STATUS } from "@/lib/polls/constants";
import SortableRestaurantList from "./SortableRestaurantList";
import { moveRestaurantInOrder } from "@/lib/polls/ranking";
import { pollSharePath, rememberActivePoll } from "@/lib/polls/active-poll";
import PollOrganizerControls, { PollTieDecision } from "./PollOrganizerControls";

function formatTimeRemaining(deadlineAt, now) {
  const milliseconds = Math.max(
    0,
    new Date(deadlineAt).getTime() - now,
  );
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;
}

function BallotForm({ poll, onSaved, onCancel }) {
  const rankCount = poll.options.length === 2 ? 1 : 3;
  const [name, setName] = useState(poll.ballot?.name ?? "");
  const [optionOrder, setOptionOrder] = useState(() => {
    const savedIds = [...(poll.ballot?.rankings ?? [])]
      .sort((a, b) => a.rank - b.rank)
      .map((ranking) => ranking.optionId);
    return [
      ...savedIds,
      ...poll.options.map((option) => option.id).filter((id) => !savedIds.includes(id)),
    ];
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [chosenCount, setChosenCount] = useState(poll.ballot?.rankings.length ?? 0);

  function chooseRestaurant(optionId) {
    const index = optionOrder.indexOf(optionId);
    if (isSaving || isDragging || chosenCount >= rankCount || index < chosenCount || index < 0) return;
    setOptionOrder(moveRestaurantInOrder(optionOrder, optionId, chosenCount - index));
    setChosenCount(chosenCount + 1);
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || isDragging || chosenCount < rankCount) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await submitBallotRequest(poll.slug, {
        name,
        rankings: optionOrder.slice(0, rankCount).map((optionId, index) => ({
          optionId,
          rank: index + 1,
        })),
      });
      onSaved(result.poll);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your picks could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="poll-ballot" onSubmit={handleSubmit}>
      <label className="poll-ballot__name">
        Your name
        <input
          value={name}
          placeholder="(Optional)"
          maxLength="80"
          autoComplete="name"
          disabled={isSaving}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <section className="poll-ballot__step">
        <h3>Rank your restaurant choices</h3>
        <p>
          {chosenCount < rankCount
            ? `Click a restaurant for your ${["first", "second", "third"][chosenCount]} choice.`
            : "Drag and drop to adjust your choices."}
        </p>
        <SortableRestaurantList
          options={poll.options}
          order={optionOrder}
          rankCount={chosenCount}
          canChoose={chosenCount < rankCount && !isDragging}
          onChoose={chooseRestaurant}
          disabled={isSaving}
          onOrderChange={(order) => { setOptionOrder(order); setErrorMessage(""); }}
          onDraggingChange={setIsDragging}
        />
      </section>
      {errorMessage ? (
        <p className="poll-message poll-message--error" role="alert">{errorMessage}</p>
      ) : null}
      <div className="poll-button-row">
        <button type="submit" disabled={isSaving || isDragging || chosenCount < rankCount}>
          {isSaving ? "Saving…" : poll.ballot ? "Update my picks" : "Submit my picks"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={isSaving || isDragging}
          onClick={() => {
            setOptionOrder(poll.options.map((option) => option.id));
            setChosenCount(0);
            setErrorMessage("");
          }}
        >
          Reset
        </button>
        {onCancel ? (
          <button type="button" className="secondary" disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
function SavedBallot({ poll, onEdit }) {
  const optionById = new Map(
    poll.options.map((option) => [option.id, option]),
  );
  const rankedIds = new Set(
    poll.ballot.rankings.map((ranking) => ranking.optionId),
  );
  const otherOptions = poll.options.filter(
    (option) => !rankedIds.has(option.id),
  );
  const rankLabels = ["Favorite", "Second favorite", "Third favorite"];

  return (
    <section className="poll-card">
      <h2>Your picks are in</h2>
      <ol className="poll-ranking-summary">
        {poll.ballot.rankings.map((ranking, index) => (
          <li key={ranking.optionId}>
            <span>{rankLabels[index]}</span>
            {optionById.get(ranking.optionId)?.name}
          </li>
        ))}
      </ol>

      {otherOptions.length > 0 ? (
        <details className="poll-other-options">
          <summary>Other options</summary>
          <ul>
            {otherOptions.map((option) => (
              <li key={option.id}>{option.name}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <button type="button" className="secondary" onClick={onEdit}>
        Edit your picks
      </button>
    </section>
  );
}

export default function PollExperience({
  slug,
  embedded = false,
  isActive = true,
}) {
  const Container = embedded ? "div" : "main";
  const Title = embedded ? "h2" : "h1";
  const containerClassName = embedded ? "poll-embedded" : "poll-page";
  const sharePath = pollSharePath(slug);
  const [poll, setPoll] = useState(null);
  const [organizerPoll, setOrganizerPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  const loadPoll = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const participantResult = await getParticipantPollRequest(slug);
      setPoll(participantResult.poll);
      setErrorMessage("");

      try {
        const organizerResult = await getOrganizerPollRequest(slug);
        setOrganizerPoll(organizerResult.poll);
      } catch (error) {
        if (!(error instanceof PollRequestError) || error.status !== 403) {
          throw error;
        }

        setOrganizerPoll(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Lark Together could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (isActive) {
      // Keep the ballot mounted when reopening the Finder menu.
      loadPoll();
    }
  }, [isActive, loadPoll]);

  const organizerSlug = organizerPoll?.slug;
  useEffect(() => {
    if (!embedded && organizerSlug) {
      try {
        rememberActivePoll(window.localStorage, organizerSlug);
      } catch {
        // Public-link bookmarking is optional; authorization uses cookies.
      }
    }
  }, [embedded, organizerSlug]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const status = poll?.status;

  useEffect(() => {
    if (
      !isActive ||
      (status !== POLL_STATUS.OPEN &&
        status !== POLL_STATUS.AWAITING_ORGANIZER)
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => loadPoll(), 10_000);
    return () => window.clearInterval(timer);
  }, [isActive, loadPoll, status]);

  const rankedOptions = useMemo(() => {
    if (!poll?.ballot) {
      return [];
    }

    const optionById = new Map(
      poll.options.map((option) => [option.id, option]),
    );

    return poll.ballot.rankings
      .map((ranking) => optionById.get(ranking.optionId))
      .filter(Boolean);
  }, [poll]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(sharePath, window.location.origin).href,
      );
      setCopied(true);
      setErrorMessage("");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(
        "The link could not be copied. Open the shared page and copy its address instead.",
      );
    }
  }

  async function handleClosePoll() {
    if (
      !window.confirm(
        "Finish choosing now? Unsubmitted picks and unsaved edits will no longer be accepted.",
      )
    ) {
      return;
    }

    setIsActing(true);

    try {
      const result = await closePollRequest(slug);
      setOrganizerPoll(result.poll);
      await loadPoll();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Lark Together could not be finished.",
      );
    } finally {
      setIsActing(false);
    }
  }

  async function handleTieDecision(optionId) {
    setIsActing(true);

    try {
      const result = await resolveTieRequest(slug, optionId);
      setOrganizerPoll(result.poll);
      await loadPoll();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The winner could not be selected.",
      );
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) {
    return <Container className={containerClassName}><p role="status">Loading Lark Together…</p></Container>;
  }

  if (!poll) {
    return (
      <Container className={containerClassName}>
        <section className="poll-shell">
          <Title>Lark Together unavailable</Title>
          <p className="poll-message poll-message--error">{errorMessage}</p>
          <div className="poll-card">
            <button type="button" onClick={() => loadPoll()}>Try again</button>
          </div>
          {!embedded ? <Link href="/finder">Return to the restaurant finder</Link> : null}
        </section>
      </Container>
    );
  }

  if (embedded && !organizerPoll) {
    return (
      <div className="poll-embedded">
        <section className="poll-card">
          <h2>Organizer controls unavailable</h2>
          <p role="alert">
            {errorMessage || "This browser no longer has organizer access to this Lark Together."}
          </p>
          <Link href={sharePath} target="_blank" rel="noreferrer">
            Open the shared page
          </Link>
          <button type="button" className="secondary" onClick={() => loadPoll()}>
            Try again
          </button>
        </section>
      </div>
    );
  }

  const isOpen = poll.status === POLL_STATUS.OPEN;

  return (
    <Container className={containerClassName}>
      <section className="poll-shell">
        <header className="poll-page__header">
          {embedded ? (
            <Link
              href={sharePath}
              className="poll-page__brand"
              target="_blank"
              rel="noreferrer"
            >
              Open shared page
            </Link>
          ) : (
            <Link href="/" className="poll-page__brand poll-page__home" aria-label="TableLark home">
              <Image
                className="poll-page__logo"
                src="/tablelark-logo-classic.png"
                alt=""
                width={48}
                height={48}
                priority
              />
              <span className="poll-page__name">TableLark</span>
            </Link>
          )}
          {organizerPoll ? (
            <button type="button" className="secondary" onClick={copyShareLink}>
              {copied ? "Link copied" : "Copy share link"}
            </button>
          ) : null}
        </header>

        <div className="poll-card poll-card--intro">
          <p className="poll-eyebrow">
            {isOpen ? "Choosing is open" : "Choosing has ended"}
          </p>
          <Title>Choose the group’s restaurant</Title>
          {isOpen ? (
            <p>
              Time remaining:{" "}
              <strong>{formatTimeRemaining(poll.deadlineAt, now)}</strong>
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="poll-message poll-message--error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {poll.status === POLL_STATUS.FINAL && poll.winner ? (
          <section className="poll-card poll-winner">
            <p className="poll-eyebrow">The group chose</p>
            <h2>{poll.winner.name}</h2>
            <p>{poll.winner.address}</p>
            {poll.winner.googleMapsURI ? (
              <a
                href={poll.winner.googleMapsURI}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            ) : null}
          </section>
        ) : null}

        {poll.status === POLL_STATUS.NO_VOTES ? (
          <section className="poll-card">
            <h2>No picks were submitted</h2>
            <p>Lark Together ended without selecting a restaurant.</p>
          </section>
        ) : null}

        {isOpen && (!poll.ballot || isEditing) ? (
          <section className="poll-card">
            <h2>{poll.ballot ? "Edit your picks" : "Rank your favorites"}</h2>
            <BallotForm
              key={poll.ballot?.updatedAt ?? "new-ballot"}
              poll={poll}
              onSaved={(updatedPoll) => {
                setPoll(updatedPoll);
                setIsEditing(false);
                loadPoll();
              }}
              onCancel={
                poll.ballot ? () => setIsEditing(false) : undefined
              }
            />
          </section>
        ) : null}

        {isOpen && poll.ballot && !isEditing ? (
          <>
            <SavedBallot poll={poll} onEdit={() => setIsEditing(true)} />
            <section className="poll-card">
              <h2>Waiting for the final decision</h2>
              <p>
                Your latest saved picks will be counted when choosing ends.
              </p>
            </section>
          </>
        ) : null}

        {organizerPoll && isOpen ? (
          <PollOrganizerControls
            poll={organizerPoll}
            isActing={isActing}
            onClose={handleClosePoll}
          />
        ) : null}

        {poll.status === POLL_STATUS.AWAITING_ORGANIZER ? (
          <section className="poll-card">
            {organizerPoll ? (
              <PollTieDecision
                poll={organizerPoll}
                isActing={isActing}
                onChoose={handleTieDecision}
              />
            ) : (
              <>
                <h2>Waiting for the final decision</h2>
                <p>The organizer is resolving a final tie.</p>
              </>
            )}
          </section>
        ) : null}

        {!isOpen && poll.ballot && rankedOptions.length > 0 ? (
          <p className="poll-footnote">
            Your saved picks contained {rankedOptions.length} ranked{" "}
            {rankedOptions.length === 1 ? "restaurant" : "restaurants"}.
          </p>
        ) : null}
      </section>
    </Container>
  );
}
