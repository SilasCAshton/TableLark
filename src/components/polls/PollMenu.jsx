"use client";

import { useEffect, useState } from "react";

import { usePollBuilder } from "@/context/PollBuilderContext";
import {
  MAXIMUM_BALLOTS,
  MINIMUM_BALLOTS,
  MINIMUM_POLL_OPTIONS,
  TIE_MODE,
} from "@/lib/polls/constants";
import { createPollRequest } from "@/lib/polls/client";
import {
  ACTIVE_POLL_STORAGE_KEY,
  readActivePoll,
  rememberActivePoll,
} from "@/lib/polls/active-poll";
import PollExperience from "./PollExperience";

const POLL_DURATION_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 720, label: "12 hours" },
];

function PollMenu({ isOpen, onToggle }) {
  const [activePollSlug, setActivePollSlug] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const {
    pollRestaurants,
    removeRestaurant,
    clearRestaurants,
  } = usePollBuilder();
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [maximumBallots, setMaximumBallots] = useState(20);
  const [tieMode, setTieMode] = useState(TIE_MODE.RANDOM);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState("");
  const canCreate =
    pollRestaurants.length >= MINIMUM_POLL_OPTIONS &&
    !isCreating;

  useEffect(() => {
    function restoreActivePoll(event) {
      if (event && event.key !== ACTIVE_POLL_STORAGE_KEY && event.key !== null) {
        return;
      }

      try {
        setActivePollSlug(readActivePoll(window.localStorage));
      } catch {
        // Storage may be unavailable; poll creation still works for this visit.
      }
    }

    restoreActivePoll();
    window.addEventListener("storage", restoreActivePoll);
    return () => window.removeEventListener("storage", restoreActivePoll);
  }, []);

  const showActivePoll = Boolean(activePollSlug) && !isBuilding;

  async function handleCreatePoll(event) {
    event.preventDefault();

    if (!canCreate) {
      return;
    }

    setIsCreating(true);
    setCreationError("");

    try {
      const result = await createPollRequest({
        restaurants: pollRestaurants,
        durationMinutes: Number(durationMinutes),
        maximumBallots: Number(maximumBallots),
        tieMode,
      });

      setActivePollSlug(result.poll.slug);
      setIsBuilding(false);
      try {
        rememberActivePoll(window.localStorage, result.poll.slug);
      } catch {
        // The active poll is still available in memory if storage is blocked.
      }
      clearRestaurants();
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "Lark Together could not be started.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section
      className="poll-menu-controls"
      aria-label="Lark Together"
    >
      <div className="poll-menu">
        <button
          type="button"
          className="poll-menu__trigger"
          data-menu-trigger="poll"
          aria-expanded={isOpen}
          aria-controls="poll-menu-panel"
          onClick={onToggle}
        >
          Lark Together
        </button>

          <div
            id="poll-menu-panel"
            className={`poll-menu__panel${showActivePoll ? " poll-menu__panel--active" : ""}`}
            hidden={!isOpen}
          >
          {activePollSlug ? (
            <div className="poll-menu__views" aria-label="Lark Together views">
              <button
                type="button"
                aria-pressed={showActivePoll}
                onClick={() => setIsBuilding(false)}
              >
                Current choice
              </button>
              <button
                type="button"
                aria-pressed={!showActivePoll}
                onClick={() => setIsBuilding(true)}
              >
                Start new{pollRestaurants.length > 0 ? ` (${pollRestaurants.length})` : ""}
              </button>
            </div>
          ) : null}

          {activePollSlug ? (
            <div hidden={!showActivePoll}>
              <PollExperience
                key={activePollSlug}
                slug={activePollSlug}
                embedded
                isActive={isOpen && showActivePoll}
              />
            </div>
          ) : null}

          <div className="poll-menu__draft" hidden={showActivePoll}>
          <h2>Start choosing together</h2>
          {activePollSlug ? (
            <p>
              Starting a new group choice will replace the one remembered
              here. Your existing shared link will still work.
            </p>
          ) : null}

          {pollRestaurants.length === 0 ? (
            <p>
              Add restaurants from the search results to start choosing
              together.
            </p>
          ) : (
            <ul>
              {pollRestaurants.map((restaurant) => (
                <li
                  key={restaurant.id}
                  className="poll-menu__item"
                >
                  <span>{restaurant.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${restaurant.name} from Lark Together`}
                    onClick={() => removeRestaurant(restaurant.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pollRestaurants.length > 0 ? (
            <form
              className="poll-menu__form"
              onSubmit={handleCreatePoll}
            >
              <details className="poll-menu__settings">
                <summary>Lark Together settings</summary>
                <div className="poll-menu__settings-fields">
                  <label>
                    Time to choose
                    <select
                      value={durationMinutes}
                      onChange={(event) =>
                        setDurationMinutes(Number(event.target.value))
                      }
                    >
                      {POLL_DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Number of voters
                    <input
                      type="number"
                      min={MINIMUM_BALLOTS}
                      max={MAXIMUM_BALLOTS}
                      step="1"
                      value={maximumBallots}
                      onChange={(event) =>
                        setMaximumBallots(event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    In case of a final tie
                    <select
                      value={tieMode}
                      onChange={(event) =>
                        setTieMode(event.target.value)
                      }
                    >
                      <option value={TIE_MODE.RANDOM}>
                        Choose for me
                      </option>
                      <option value={TIE_MODE.ORGANIZER}>
                        Let me choose
                      </option>
                    </select>
                  </label>
                </div>
              </details>

              {pollRestaurants.length < MINIMUM_POLL_OPTIONS ? (
                <p className="poll-menu__hint">
                  Add at least two restaurants to start choosing together.
                </p>
              ) : null}

              {creationError ? (
                <p className="poll-menu__error" role="alert">
                  {creationError}
                </p>
              ) : null}

              <button
                type="submit"
                className="poll-menu__create"
                disabled={!canCreate}
              >
                {isCreating ? "Starting…" : "Start choosing"}
              </button>
            </form>
          ) : null}
          </div>
          </div>
      </div>
    </section>
  );
}

export default PollMenu;
