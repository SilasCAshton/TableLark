export function moveRestaurantInOrder(optionIds, optionId, offset) {
  const from = optionIds.indexOf(optionId);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= optionIds.length) return optionIds;
  const next = [...optionIds];
  next.splice(from, 1);
  next.splice(to, 0, optionId);
  return next;
}

export function assignRankingSelection(
  rankings,
  rankIndex,
  optionId,
) {
  const nextRankings = [...rankings];
  const previousRankIndex = nextRankings.indexOf(optionId);

  if (
    previousRankIndex !== -1 &&
    previousRankIndex !== rankIndex
  ) {
    if (!nextRankings[rankIndex]) {
      return rankings;
    }

    nextRankings[previousRankIndex] = "";
  }

  nextRankings[rankIndex] = optionId;
  return nextRankings;
}
