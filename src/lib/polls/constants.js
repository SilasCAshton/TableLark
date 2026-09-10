export const MINIMUM_POLL_OPTIONS = 2;
export const MAXIMUM_POLL_OPTIONS = 20;
export const MINIMUM_BALLOTS = 2;
export const MAXIMUM_BALLOTS = 20;
export const MINIMUM_DURATION_MINUTES = 1;
export const MAXIMUM_DURATION_MINUTES = 30 * 24 * 60;
export const MAXIMUM_VOTER_NAME_LENGTH = 80;

export const POLL_STATUS = Object.freeze({
  OPEN: "open",
  AWAITING_ORGANIZER: "awaiting_organizer",
  FINAL: "final",
  NO_VOTES: "no_votes",
});

export const TIE_MODE = Object.freeze({
  RANDOM: "random",
  ORGANIZER: "organizer",
});

export const CLOSE_REASON = Object.freeze({
  DEADLINE: "deadline",
  MAXIMUM: "maximum",
  MANUAL: "manual",
});
