import { randomInt, randomUUID } from "node:crypto";

import {
  CLOSE_REASON,
  POLL_STATUS,
  TIE_MODE,
} from "./constants.js";
import {
  PollConflictError,
  PollForbiddenError,
  PollNotFoundError,
} from "./errors.js";
import {
  countPollBallots,
  createPollRecords,
  saveBallot,
  saveTieCandidates,
  selectAllPollRankings,
  selectBallotByTokenHash,
  selectBallotRanks,
  selectOptionById,
  selectOrganizerBallot,
  selectPollBySlug,
  selectPollOptions,
  selectPollVoterNames,
  selectTieCandidateIds,
  updatePollClosure,
} from "./repository.js";
import { calculatePollOutcome } from "./scoring.js";
import {
  createPrivateToken,
  createPublicSlug,
  hashToken,
  isValidPollSlug,
  tokenMatchesHash,
} from "./tokens.js";
import {
  validateBallot,
  validateCreatePoll,
  validateTieDecision,
} from "./validation.js";

function requirePoll(poll) {
  if (!poll) {
    throw new PollNotFoundError();
  }

  return poll;
}

function requireOrganizer(poll, ownerToken) {
  if (!tokenMatchesHash(ownerToken, poll.ownerTokenHash)) {
    throw new PollForbiddenError();
  }
}

function publicOption(option) {
  return {
    id: option.id,
    name: option.name,
    address: option.address,
    primaryTypeDisplayName: option.primaryTypeDisplayName,
    googleMapsURI: option.googleMapsUrl,
  };
}

async function closePoll(tx, poll, reason, now) {
  const options = await selectPollOptions(tx, poll.id);
  const rankings = await selectAllPollRankings(tx, poll.id);
  const outcome = calculatePollOutcome(
    options.map((option) => option.id),
    rankings,
  );

  if (outcome.kind === "no_votes") {
    return updatePollClosure(tx, poll.id, {
      status: POLL_STATUS.NO_VOTES,
      closeReason: reason,
      closedAt: now,
    });
  }

  if (outcome.kind === "winner") {
    return updatePollClosure(tx, poll.id, {
      status: POLL_STATUS.FINAL,
      closeReason: reason,
      closedAt: now,
      winnerOptionId: outcome.winnerOptionId,
    });
  }

  if (poll.tieMode === TIE_MODE.RANDOM) {
    const winnerOptionId =
      outcome.candidateIds[randomInt(outcome.candidateIds.length)];

    await saveTieCandidates(tx, poll.id, outcome.candidateIds);

    return updatePollClosure(tx, poll.id, {
      status: POLL_STATUS.FINAL,
      closeReason: reason,
      closedAt: now,
      winnerOptionId,
    });
  }

  await saveTieCandidates(tx, poll.id, outcome.candidateIds);

  return updatePollClosure(tx, poll.id, {
    status: POLL_STATUS.AWAITING_ORGANIZER,
    closeReason: reason,
    closedAt: now,
  });
}

async function closeIfExpired(tx, poll, now) {
  if (
    poll.status === POLL_STATUS.OPEN &&
    poll.deadlineAt.getTime() <= now.getTime()
  ) {
    return closePoll(tx, poll, CLOSE_REASON.DEADLINE, now);
  }

  return poll;
}

async function buildParticipantView(
  tx,
  poll,
  voterTokenHash,
) {
  const options = await selectPollOptions(tx, poll.id);
  const ballot = await selectBallotByTokenHash(
    tx,
    poll.id,
    voterTokenHash,
  );
  const rankings = ballot
    ? await selectBallotRanks(tx, ballot.id)
    : [];
  const winner = await selectOptionById(
    tx,
    poll.winnerOptionId,
  );

  return {
    slug: poll.publicSlug,
    status: poll.status,
    deadlineAt: poll.deadlineAt.toISOString(),
    options: options.map(publicOption),
    ballot: ballot
      ? {
          name: ballot.optionalName,
          rankings,
          updatedAt: ballot.updatedAt.toISOString(),
        }
      : null,
    winner: winner ? publicOption(winner) : null,
  };
}

async function buildOrganizerView(tx, poll) {
  const voters = await selectPollVoterNames(tx, poll.id);
  const voterNames = voters.map(({ name }) => name?.trim()).filter(Boolean);
  const organizerBallot = await selectOrganizerBallot(tx, poll.id);
  const candidateRows = await selectTieCandidateIds(tx, poll.id);
  const options = await selectPollOptions(tx, poll.id);
  const optionById = new Map(
    options.map((option) => [option.id, option]),
  );
  const winner = await selectOptionById(
    tx,
    poll.winnerOptionId,
  );

  return {
    slug: poll.publicSlug,
    status: poll.status,
    deadlineAt: poll.deadlineAt.toISOString(),
    maximumBallots: poll.maximumBallots,
    acceptedBallots: voters.length,
    voterNames,
    unnamedVotes: voters.length - voterNames.length,
    organizerHasVoted: Boolean(organizerBallot),
    closeReason: poll.closeReason,
    tieCandidates: candidateRows
      .map(({ optionId }) => optionById.get(optionId))
      .filter(Boolean)
      .map(publicOption),
    winner: winner ? publicOption(winner) : null,
  };
}

export async function createPoll(
  payload,
  { db, now = new Date() } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  const input = validateCreatePoll(payload);
  const pollId = randomUUID();
  const publicSlug = createPublicSlug();
  const ownerToken = createPrivateToken();
  const deadlineAt = new Date(
    now.getTime() + input.durationMinutes * 60_000,
  );
  const options = input.restaurants.map((restaurant, index) => ({
    id: randomUUID(),
    pollId,
    displayOrder: index,
    ...restaurant,
  }));

  await createPollRecords(
    db,
    {
      id: pollId,
      publicSlug,
      ownerTokenHash: hashToken(ownerToken),
      status: POLL_STATUS.OPEN,
      deadlineAt,
      maximumBallots: input.maximumBallots,
      tieMode: input.tieMode,
    },
    options,
  );

  return {
    ownerToken,
    poll: {
      slug: publicSlug,
      status: POLL_STATUS.OPEN,
      deadlineAt: deadlineAt.toISOString(),
      maximumBallots: input.maximumBallots,
      tieMode: input.tieMode,
      options: options.map(publicOption),
    },
  };
}

export async function getParticipantPoll(
  publicSlug,
  voterToken,
  { db, now = new Date() } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  if (!isValidPollSlug(publicSlug)) {
    throw new PollNotFoundError();
  }

  return db.transaction(async (tx) => {
    let poll = requirePoll(
      await selectPollBySlug(tx, publicSlug, {
        forUpdate: true,
      }),
    );
    poll = await closeIfExpired(tx, poll, now);

    return buildParticipantView(tx, poll, hashToken(voterToken));
  });
}

export async function submitBallot(
  publicSlug,
  payload,
  { db, now = new Date(), ownerToken, voterToken } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  if (!isValidPollSlug(publicSlug)) {
    throw new PollNotFoundError();
  }

  const resolvedVoterToken = voterToken || createPrivateToken();
  const voterTokenHash = hashToken(resolvedVoterToken);

  const result = await db.transaction(async (tx) => {
    let poll = requirePoll(
      await selectPollBySlug(tx, publicSlug, {
        forUpdate: true,
      }),
    );
    poll = await closeIfExpired(tx, poll, now);

    if (poll.status !== POLL_STATUS.OPEN) {
      throw new PollConflictError(
        "Voting has ended for this poll.",
        "POLL_CLOSED",
      );
    }

    const options = await selectPollOptions(tx, poll.id);
    const ballotInput = validateBallot(
      payload,
      new Set(options.map((option) => option.id)),
    );
    const isOrganizer = tokenMatchesHash(
      ownerToken,
      poll.ownerTokenHash,
    );
    let existingBallot = await selectBallotByTokenHash(
      tx,
      poll.id,
      voterTokenHash,
    );
    const organizerBallot = await selectOrganizerBallot(tx, poll.id);

    if (isOrganizer && !existingBallot && organizerBallot) {
      existingBallot = organizerBallot;
    }

    const ballotCount = await countPollBallots(tx, poll.id);

    if (!existingBallot) {
      const participantCapacity = organizerBallot
        ? poll.maximumBallots
        : poll.maximumBallots - 1;

      if (!isOrganizer && ballotCount >= participantCapacity) {
        throw new PollConflictError(
          "The remaining ballot position is reserved for the organizer.",
          "ORGANIZER_BALLOT_RESERVED",
        );
      }

      if (ballotCount >= poll.maximumBallots) {
        throw new PollConflictError(
          "This poll has accepted its maximum number of ballots.",
          "POLL_FULL",
        );
      }
    }

    await saveBallot(tx, {
      ballot: {
        id: randomUUID(),
        pollId: poll.id,
        voterTokenHash,
        optionalName: ballotInput.optionalName,
        isOrganizerBallot:
          existingBallot?.isOrganizerBallot || isOrganizer,
        createdAt: existingBallot?.createdAt ?? now,
        updatedAt: now,
      },
      existingBallotId: existingBallot?.id,
      pollId: poll.id,
      rankings: ballotInput.rankings,
    });

    const updatedCount = await countPollBallots(tx, poll.id);

    if (updatedCount >= poll.maximumBallots) {
      poll = await closePoll(
        tx,
        poll,
        CLOSE_REASON.MAXIMUM,
        now,
      );
    }

    return buildParticipantView(tx, poll, voterTokenHash);
  });

  return { poll: result, voterToken: resolvedVoterToken };
}

export async function getOrganizerPoll(
  publicSlug,
  ownerToken,
  { db, now = new Date() } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  if (!isValidPollSlug(publicSlug)) {
    throw new PollNotFoundError();
  }

  return db.transaction(async (tx) => {
    let poll = requirePoll(
      await selectPollBySlug(tx, publicSlug, {
        forUpdate: true,
      }),
    );
    requireOrganizer(poll, ownerToken);
    poll = await closeIfExpired(tx, poll, now);

    return buildOrganizerView(tx, poll);
  });
}

export async function manuallyClosePoll(
  publicSlug,
  ownerToken,
  { db, now = new Date() } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  if (!isValidPollSlug(publicSlug)) {
    throw new PollNotFoundError();
  }

  return db.transaction(async (tx) => {
    let poll = requirePoll(
      await selectPollBySlug(tx, publicSlug, {
        forUpdate: true,
      }),
    );
    requireOrganizer(poll, ownerToken);
    poll = await closeIfExpired(tx, poll, now);

    if (poll.status === POLL_STATUS.OPEN) {
      poll = await closePoll(
        tx,
        poll,
        CLOSE_REASON.MANUAL,
        now,
      );
    }

    return buildOrganizerView(tx, poll);
  });
}

export async function resolvePollTie(
  publicSlug,
  payload,
  ownerToken,
  { db, now = new Date() } = {},
) {
  if (!db) {
    throw new Error("A database connection is required.");
  }

  if (!isValidPollSlug(publicSlug)) {
    throw new PollNotFoundError();
  }

  return db.transaction(async (tx) => {
    const poll = requirePoll(
      await selectPollBySlug(tx, publicSlug, {
        forUpdate: true,
      }),
    );
    requireOrganizer(poll, ownerToken);

    if (poll.status !== POLL_STATUS.AWAITING_ORGANIZER) {
      throw new PollConflictError(
        "This poll is not awaiting an organizer tie decision.",
        "TIE_DECISION_NOT_REQUIRED",
      );
    }

    const candidateRows = await selectTieCandidateIds(tx, poll.id);
    const winnerOptionId = validateTieDecision(
      payload,
      new Set(candidateRows.map(({ optionId }) => optionId)),
    );
    const updatedPoll = await updatePollClosure(tx, poll.id, {
      status: POLL_STATUS.FINAL,
      closeReason: poll.closeReason,
      closedAt: poll.closedAt ?? now,
      winnerOptionId,
    });

    return buildOrganizerView(tx, updatedPoll);
  });
}
