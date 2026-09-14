const SCORE_FIELDS = [
  "points",
  "favoriteCount",
  "secondFavoriteCount",
  "thirdFavoriteCount",
];

export function calculatePollOutcome(optionIds, rankings) {
  const scores = new Map(
    optionIds.map((optionId) => [
      optionId,
      {
        optionId,
        points: 0,
        voteCount: 0,
        favoriteCount: 0,
        secondFavoriteCount: 0,
        thirdFavoriteCount: 0,
      },
    ]),
  );

  for (const ranking of rankings) {
    const score = scores.get(ranking.optionId);

    if (!score || ranking.rank < 1 || ranking.rank > 3) {
      continue;
    }

    score.points += 4 - ranking.rank;
    score.voteCount += 1;

    if (ranking.rank === 1) {
      score.favoriteCount += 1;
    } else if (ranking.rank === 2) {
      score.secondFavoriteCount += 1;
    } else {
      score.thirdFavoriteCount += 1;
    }
  }

  if (rankings.length === 0) {
    return {
      kind: "no_votes",
      scores: [...scores.values()],
      candidateIds: [],
    };
  }

  let candidateIds = [...optionIds];

  for (const field of SCORE_FIELDS) {
    const highestValue = Math.max(
      ...candidateIds.map((optionId) => scores.get(optionId)[field]),
    );
    candidateIds = candidateIds.filter(
      (optionId) => scores.get(optionId)[field] === highestValue,
    );

    if (candidateIds.length === 1) {
      break;
    }
  }

  return {
    kind: candidateIds.length === 1 ? "winner" : "tie",
    winnerOptionId:
      candidateIds.length === 1 ? candidateIds[0] : null,
    candidateIds,
    scores: [...scores.values()],
  };
}

export function calculatePollResults(optionIds, rankings) {
  const optionOrder = new Map(
    optionIds.map((optionId, index) => [optionId, index]),
  );

  return calculatePollOutcome(optionIds, rankings).scores.sort(
    (a, b) =>
      b.points - a.points ||
      b.favoriteCount - a.favoriteCount ||
      b.secondFavoriteCount - a.secondFavoriteCount ||
      b.thirdFavoriteCount - a.thirdFavoriteCount ||
      b.voteCount - a.voteCount ||
      optionOrder.get(a.optionId) - optionOrder.get(b.optionId),
  );
}
