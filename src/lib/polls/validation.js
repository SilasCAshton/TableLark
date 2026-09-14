import {
  MAXIMUM_BALLOTS,
  MAXIMUM_DURATION_MINUTES,
  MAXIMUM_POLL_OPTIONS,
  MAXIMUM_VOTER_NAME_LENGTH,
  MINIMUM_BALLOTS,
  MINIMUM_DURATION_MINUTES,
  MINIMUM_POLL_OPTIONS,
  TIE_MODE,
} from "./constants.js";
import { PollValidationError } from "./errors.js";

function requireObject(value, message) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new PollValidationError(message);
  }

  return value;
}

function readInteger(value, label, minimum, maximum) {
  if (!Number.isInteger(value)) {
    throw new PollValidationError(
      `${label} must be an integer.`,
    );
  }

  if (value < minimum || value > maximum) {
    throw new PollValidationError(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }

  return value;
}

function readRequiredText(value, label, maximumLength) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PollValidationError(`${label} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length > maximumLength) {
    throw new PollValidationError(
      `${label} cannot exceed ${maximumLength} characters.`,
    );
  }

  return normalized;
}

function readOptionalText(value, label, maximumLength) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new PollValidationError(`${label} must be text.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maximumLength) {
    throw new PollValidationError(
      `${label} cannot exceed ${maximumLength} characters.`,
    );
  }

  return normalized;
}

function readOptionalHttpsUrl(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.length > 2048) {
    throw new PollValidationError(
      "Google Maps URL must be a valid HTTPS URL.",
    );
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    throw new PollValidationError(
      "Google Maps URL must be a valid HTTPS URL.",
    );
  }

  if (url.protocol !== "https:") {
    throw new PollValidationError(
      "Google Maps URL must be a valid HTTPS URL.",
    );
  }

  return url.toString();
}

function readOptionalRating(value, label) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new PollValidationError(`${label} must be a number between 0 and 5.`);
  }

  return value;
}

function readOptionalPriceLevel(value, label) {
  const priceLevel = readOptionalText(value, label, 32);
  const allowedLevels = new Set([
    "FREE",
    "INEXPENSIVE",
    "MODERATE",
    "EXPENSIVE",
    "VERY_EXPENSIVE",
  ]);

  if (priceLevel !== null && !allowedLevels.has(priceLevel)) {
    throw new PollValidationError(`${label} is not recognized.`);
  }

  return priceLevel;
}

function validateRestaurant(restaurant, index) {
  requireObject(
    restaurant,
    `Restaurant ${index + 1} must be an object.`,
  );

  return {
    googlePlaceId: readRequiredText(
      restaurant.id,
      `Restaurant ${index + 1} place ID`,
      255,
    ),
    name: readRequiredText(
      restaurant.name,
      `Restaurant ${index + 1} name`,
      200,
    ),
    address: readRequiredText(
      restaurant.address,
      `Restaurant ${index + 1} address`,
      500,
    ),
    primaryTypeDisplayName: readOptionalText(
      restaurant.primaryTypeDisplayName,
      `Restaurant ${index + 1} primary cuisine type`,
      120,
    ),
    rating: readOptionalRating(
      restaurant.rating,
      `Restaurant ${index + 1} rating`,
    ),
    priceLevel: readOptionalPriceLevel(
      restaurant.priceLevel,
      `Restaurant ${index + 1} price range`,
    ),
    googleMapsUrl: readOptionalHttpsUrl(
      restaurant.googleMapsURI,
    ),
  };
}

export function validateCreatePoll(payload) {
  requireObject(payload, "A poll request is required.");

  if (!Array.isArray(payload.restaurants)) {
    throw new PollValidationError(
      "Restaurants must be provided as a list.",
    );
  }

  if (
    payload.restaurants.length < MINIMUM_POLL_OPTIONS ||
    payload.restaurants.length > MAXIMUM_POLL_OPTIONS
  ) {
    throw new PollValidationError(
      `A poll must contain between ${MINIMUM_POLL_OPTIONS} and ${MAXIMUM_POLL_OPTIONS} restaurants.`,
    );
  }

  const restaurants = payload.restaurants.map(validateRestaurant);
  const placeIds = new Set(
    restaurants.map((restaurant) => restaurant.googlePlaceId),
  );

  if (placeIds.size !== restaurants.length) {
    throw new PollValidationError(
      "A restaurant can appear only once in a poll.",
    );
  }

  const tieMode = payload.tieMode;

  if (!Object.values(TIE_MODE).includes(tieMode)) {
    throw new PollValidationError(
      "Tie mode must be random or organizer.",
    );
  }

  return {
    restaurants,
    durationMinutes: readInteger(
      payload.durationMinutes,
      "Poll duration",
      MINIMUM_DURATION_MINUTES,
      MAXIMUM_DURATION_MINUTES,
    ),
    maximumBallots: readInteger(
      payload.maximumBallots,
      "Maximum ballots",
      MINIMUM_BALLOTS,
      MAXIMUM_BALLOTS,
    ),
    tieMode,
  };
}

export function validateBallot(payload, optionIds) {
  requireObject(payload, "A ballot request is required.");

  if (!Array.isArray(payload.rankings)) {
    throw new PollValidationError(
      "Ballot rankings must be provided as a list.",
    );
  }

  const expectedRankCount = optionIds.size === 2 ? 1 : 3;

  if (payload.rankings.length !== expectedRankCount) {
    throw new PollValidationError(
      optionIds.size === 2
        ? "A two-restaurant poll requires one favorite."
        : "A ballot requires a favorite, second favorite, and third favorite.",
    );
  }

  const rankings = payload.rankings.map((ranking, index) => {
    requireObject(
      ranking,
      `Ranking ${index + 1} must be an object.`,
    );

    const expectedRank = index + 1;

    if (ranking.rank !== expectedRank) {
      throw new PollValidationError(
        `Ranking ${index + 1} must use rank ${expectedRank}.`,
      );
    }

    if (
      typeof ranking.optionId !== "string" ||
      !optionIds.has(ranking.optionId)
    ) {
      throw new PollValidationError(
        "Every ranked restaurant must belong to this poll.",
      );
    }

    return {
      optionId: ranking.optionId,
      rank: expectedRank,
    };
  });

  if (
    new Set(rankings.map((ranking) => ranking.optionId)).size !==
    rankings.length
  ) {
    throw new PollValidationError(
      "A restaurant cannot occupy more than one rank.",
    );
  }

  let optionalName = null;

  if (payload.name !== null && payload.name !== undefined) {
    if (typeof payload.name !== "string") {
      throw new PollValidationError("Voter name must be text.");
    }

    optionalName = payload.name.trim() || null;

    if (optionalName?.length > MAXIMUM_VOTER_NAME_LENGTH) {
      throw new PollValidationError(
        `Voter name cannot exceed ${MAXIMUM_VOTER_NAME_LENGTH} characters.`,
      );
    }
  }

  return { optionalName, rankings };
}

export function validateTieDecision(payload, candidateIds) {
  requireObject(payload, "A tie decision is required.");

  if (
    typeof payload.optionId !== "string" ||
    !candidateIds.has(payload.optionId)
  ) {
    throw new PollValidationError(
      "The selected restaurant is not an eligible tied option.",
    );
  }

  return payload.optionId;
}
