import { PollError } from "./errors.js";

const MAXIMUM_POLL_BODY_BYTES = 25_000;
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

function safeCookieSlug(slug) {
  return String(slug).replace(/[^A-Za-z0-9_-]/g, "");
}

export function ownerCookieName(slug) {
  return `tablelark_owner_${safeCookieSlug(slug)}`;
}

export function voterCookieName(slug) {
  return `tablelark_voter_${safeCookieSlug(slug)}`;
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = part.slice(0, separatorIndex).trim();

    if (cookieName === name) {
      try {
        return decodeURIComponent(
          part.slice(separatorIndex + 1).trim(),
        );
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function setPrivateCookie(response, name, value) {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  response.headers.append("Set-Cookie", attributes.join("; "));
}

export async function readJsonBody(request) {
  const contentLength = Number(
    request.headers.get("content-length") ?? 0,
  );

  if (contentLength > MAXIMUM_POLL_BODY_BYTES) {
    throw new PollError("The request is too large.", {
      code: "REQUEST_TOO_LARGE",
      status: 413,
    });
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    throw new PollError("The request body could not be read.", {
      code: "INVALID_JSON",
      status: 400,
    });
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAXIMUM_POLL_BODY_BYTES) {
    throw new PollError("The request is too large.", {
      code: "REQUEST_TOO_LARGE",
      status: 413,
    });
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new PollError("The request must contain valid JSON.", {
      code: "INVALID_JSON",
      status: 400,
    });
  }
}

export function pollErrorResponse(error) {
  if (error instanceof PollError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error("Polling request failed:", error);

  return Response.json(
    {
      error: "The polling request could not be completed.",
      code: "POLL_SERVICE_ERROR",
    },
    { status: 500 },
  );
}
