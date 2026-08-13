import {
  SearchValidationError,
  validateRestaurantSearch,
} from "@/lib/restaurants/validation";
import { PlacesServiceError } from "@/lib/restaurants/places-client";
import { searchRestaurants } from "@/lib/restaurants/search-restaurants";

export const runtime = "nodejs";

const MAX_REQUEST_BODY_BYTES = 10000;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_REQUESTS = 12;
const requestWindows = new Map();

function getClientIdentifier(request) {
  return (
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function checkRateLimit(identifier) {
  const now = Date.now();

  if (requestWindows.size >= 1000) {
    for (const [key, window] of requestWindows) {
      if (
        now - window.startedAt >= RATE_LIMIT_WINDOW_MS
      ) {
        requestWindows.delete(key);
      }
    }
  }

  const existingWindow = requestWindows.get(identifier);

  if (
    !existingWindow ||
    now - existingWindow.startedAt >= RATE_LIMIT_WINDOW_MS
  ) {
    requestWindows.set(identifier, {
      startedAt: now,
      requestCount: 1,
    });

    return null;
  }

  existingWindow.requestCount += 1;

  if (existingWindow.requestCount <= RATE_LIMIT_REQUESTS) {
    return null;
  }

  return Math.max(
    Math.ceil(
      (RATE_LIMIT_WINDOW_MS -
        (now - existingWindow.startedAt)) /
        1000,
    ),
    1,
  );
}

export async function POST(request) {
  const contentLength = Number(
    request.headers.get("content-length") ?? 0,
  );

  if (contentLength > MAX_REQUEST_BODY_BYTES) {
    return Response.json(
      { error: "The search request is too large." },
      { status: 413 },
    );
  }

  const retryAfter = checkRateLimit(
    getClientIdentifier(request),
  );

  if (retryAfter !== null) {
    return Response.json(
      {
        error:
          "Too many restaurant searches. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  let payload;

  try {
    const rawBody = await request.text();
    const actualBodyBytes = new TextEncoder().encode(
      rawBody,
    ).byteLength;

    if (actualBodyBytes > MAX_REQUEST_BODY_BYTES) {
      return Response.json(
        { error: "The search request is too large." },
        { status: 413 },
      );
    }

    payload = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "The search request must contain valid JSON." },
      { status: 400 },
    );
  }

  try {
    const search = validateRestaurantSearch(payload);
    const result = await searchRestaurants(
      search,
      request.signal,
    );

    return Response.json({
      restaurants: result.restaurants,
      meta: {
        resultCount: result.restaurants.length,
        googleRequestCount: result.requestCount,
      },
    });
  } catch (error) {
    if (error instanceof SearchValidationError) {
      return Response.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (error instanceof PlacesServiceError) {
      return Response.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    console.error("Restaurant search route failed:", error);

    return Response.json(
      {
        error:
          "The restaurant search could not be completed.",
      },
      { status: 500 },
    );
  }
}
