import { and, asc, eq } from "drizzle-orm";

import {
  ballotRanks,
  ballots,
  pollOptions,
  polls,
  pollTieCandidates,
} from "../database/schema.js";

export async function createPollRecords(db, poll, options) {
  await db.transaction(async (tx) => {
    await tx.insert(polls).values(poll);
    await tx.insert(pollOptions).values(options);
  });
}

export async function selectPollBySlug(
  db,
  publicSlug,
  { forUpdate = false } = {},
) {
  let query = db
    .select()
    .from(polls)
    .where(eq(polls.publicSlug, publicSlug))
    .limit(1);

  if (forUpdate) {
    query = query.for("update");
  }

  const [poll] = await query;
  return poll ?? null;
}

export function selectPollOptions(db, pollId) {
  return db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId))
    .orderBy(asc(pollOptions.displayOrder));
}

export async function selectBallotByTokenHash(
  db,
  pollId,
  voterTokenHash,
) {
  if (!voterTokenHash) {
    return null;
  }

  const [ballot] = await db
    .select()
    .from(ballots)
    .where(
      and(
        eq(ballots.pollId, pollId),
        eq(ballots.voterTokenHash, voterTokenHash),
      ),
    )
    .limit(1);

  return ballot ?? null;
}

export async function selectOrganizerBallot(db, pollId) {
  const [ballot] = await db
    .select()
    .from(ballots)
    .where(
      and(
        eq(ballots.pollId, pollId),
        eq(ballots.isOrganizerBallot, true),
      ),
    )
    .limit(1);

  return ballot ?? null;
}

export function selectBallotRanks(db, ballotId) {
  return db
    .select({
      optionId: ballotRanks.optionId,
      rank: ballotRanks.rank,
    })
    .from(ballotRanks)
    .where(eq(ballotRanks.ballotId, ballotId))
    .orderBy(asc(ballotRanks.rank));
}

export function selectAllPollRankings(db, pollId) {
  return db
    .select({
      optionId: ballotRanks.optionId,
      rank: ballotRanks.rank,
    })
    .from(ballotRanks)
    .where(eq(ballotRanks.pollId, pollId));
}

export async function countPollBallots(db, pollId) {
  const rows = await db
    .select({ id: ballots.id })
    .from(ballots)
    .where(eq(ballots.pollId, pollId));

  return rows.length;
}

export function selectPollVoterNames(db, pollId) {
  return db
    .select({ name: ballots.optionalName })
    .from(ballots)
    .where(eq(ballots.pollId, pollId))
    .orderBy(asc(ballots.createdAt), asc(ballots.id));
}

export async function saveBallot(
  tx,
  {
    ballot,
    existingBallotId,
    pollId,
    rankings,
  },
) {
  const ballotId = existingBallotId ?? ballot.id;

  if (existingBallotId) {
    await tx
      .update(ballots)
      .set({
        voterTokenHash: ballot.voterTokenHash,
        optionalName: ballot.optionalName,
        isOrganizerBallot: ballot.isOrganizerBallot,
        updatedAt: ballot.updatedAt,
      })
      .where(eq(ballots.id, existingBallotId));
    await tx
      .delete(ballotRanks)
      .where(eq(ballotRanks.ballotId, existingBallotId));
  } else {
    await tx.insert(ballots).values(ballot);
  }

  await tx.insert(ballotRanks).values(
    rankings.map((ranking) => ({
      pollId,
      ballotId,
      optionId: ranking.optionId,
      rank: ranking.rank,
    })),
  );

  return ballotId;
}

export async function updatePollClosure(
  tx,
  pollId,
  {
    status,
    closeReason,
    closedAt,
    winnerOptionId = null,
  },
) {
  const [updatedPoll] = await tx
    .update(polls)
    .set({ status, closeReason, closedAt, winnerOptionId })
    .where(eq(polls.id, pollId))
    .returning();

  return updatedPoll;
}

export async function saveTieCandidates(
  tx,
  pollId,
  candidateIds,
) {
  await tx
    .delete(pollTieCandidates)
    .where(eq(pollTieCandidates.pollId, pollId));

  if (candidateIds.length > 0) {
    await tx.insert(pollTieCandidates).values(
      candidateIds.map((optionId) => ({ pollId, optionId })),
    );
  }
}

export function selectTieCandidateIds(db, pollId) {
  return db
    .select({ optionId: pollTieCandidates.optionId })
    .from(pollTieCandidates)
    .where(eq(pollTieCandidates.pollId, pollId));
}

export async function selectOptionById(db, optionId) {
  if (!optionId) {
    return null;
  }

  const [option] = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.id, optionId))
    .limit(1);

  return option ?? null;
}
