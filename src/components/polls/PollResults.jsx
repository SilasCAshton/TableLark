function formatPriceLevel(priceLevel) {
  const labels = {
    FREE: "Free",
    INEXPENSIVE: "$",
    MODERATE: "$$",
    EXPENSIVE: "$$$",
    VERY_EXPENSIVE: "$$$$",
  };

  return labels[priceLevel] ?? "";
}

export default function PollResults({ results, winnerId }) {
  if (!results?.length) {
    return null;
  }

  return (
    <details className="poll-card poll-results">
      <summary>View full results</summary>
      <ol className="poll-results__list">
        {results.map((result, index) => (
          <li key={result.id}>
            <details className="poll-result">
              <summary>
                <span className="poll-result__position">{index + 1}</span>
                <span className="poll-result__name">
                  {result.name}
                  {result.id === winnerId ? (
                    <span className="poll-result__winner">Winner</span>
                  ) : null}
                </span>
                <span className="poll-result__points">
                  {result.points} {result.points === 1 ? "point" : "points"}
                </span>
              </summary>
              <div className="poll-result__details">
                <div className="poll-result__restaurant-details">
                  {result.rating != null ? (
                    <span>★ {result.rating.toFixed(1)}</span>
                  ) : null}
                  {formatPriceLevel(result.priceLevel) ? (
                    <span>{formatPriceLevel(result.priceLevel)}</span>
                  ) : null}
                </div>
                <p className="poll-result__address">{result.address}</p>
              </div>
              {result.googleMapsURI ? (
                <a href={result.googleMapsURI} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              ) : null}
            </details>
          </li>
        ))}
      </ol>
    </details>
  );
}
