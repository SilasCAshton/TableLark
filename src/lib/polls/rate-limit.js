const requestWindows = new Map();

function clientIdentifier(request) {
  return (
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function checkPollRateLimit(
  request,
  bucket,
  { limit, windowMs = 60_000 },
) {
  const now = Date.now();
  const key = `${bucket}:${clientIdentifier(request)}`;

  if (requestWindows.size >= 2_000) {
    for (const [storedKey, window] of requestWindows) {
      if (now - window.startedAt >= windowMs) {
        requestWindows.delete(storedKey);
      }
    }
  }

  const existing = requestWindows.get(key);

  if (!existing || now - existing.startedAt >= windowMs) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return null;
  }

  existing.count += 1;

  if (existing.count <= limit) {
    return null;
  }

  return Math.max(
    Math.ceil((windowMs - (now - existing.startedAt)) / 1000),
    1,
  );
}

export function rateLimitResponse(retryAfter) {
  return Response.json(
    {
      error: "Too many polling requests. Please wait and try again.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
