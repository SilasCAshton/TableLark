export class PollRequestError extends Error {
  constructor(message, { code = "POLL_REQUEST_FAILED", status = 500 } = {}) {
    super(message);
    this.name = "PollRequestError";
    this.code = code;
    this.status = status;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new PollRequestError(
      payload?.error ?? "The polling request could not be completed.",
      {
        code: payload?.code,
        status: response.status,
      },
    );
  }

  return payload;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function createPollRequest(payload) {
  return requestJson("/api/polls", jsonOptions("POST", payload));
}

export function getParticipantPollRequest(slug) {
  return requestJson(`/api/polls/${encodeURIComponent(slug)}`);
}

export function getOrganizerPollRequest(slug) {
  return requestJson(
    `/api/polls/${encodeURIComponent(slug)}/manage`,
  );
}

export function submitBallotRequest(slug, payload) {
  return requestJson(
    `/api/polls/${encodeURIComponent(slug)}/ballot`,
    jsonOptions("PUT", payload),
  );
}

export function closePollRequest(slug) {
  return requestJson(
    `/api/polls/${encodeURIComponent(slug)}/close`,
    { method: "POST" },
  );
}

export function resolveTieRequest(slug, optionId) {
  return requestJson(
    `/api/polls/${encodeURIComponent(slug)}/tie-decision`,
    jsonOptions("POST", { optionId }),
  );
}
