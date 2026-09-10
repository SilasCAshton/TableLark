import { getDatabase } from "@/lib/database/client";
import {
  ownerCookieName,
  pollErrorResponse,
  readCookie,
  readJsonBody,
  setPrivateCookie,
  voterCookieName,
} from "@/lib/polls/http";
import {
  checkPollRateLimit,
  rateLimitResponse,
} from "@/lib/polls/rate-limit";
import { submitBallot } from "@/lib/polls/service";

export const runtime = "nodejs";

export async function PUT(request, context) {
  const { slug } = await context.params;
  const retryAfter = checkPollRateLimit(request, "ballot", {
    limit: 30,
  });

  if (retryAfter !== null) {
    return rateLimitResponse(retryAfter);
  }

  try {
    const payload = await readJsonBody(request);
    const result = await submitBallot(slug, payload, {
      db: getDatabase(),
      ownerToken: readCookie(request, ownerCookieName(slug)),
      voterToken: readCookie(request, voterCookieName(slug)),
    });
    const response = Response.json({ poll: result.poll });

    setPrivateCookie(
      response,
      voterCookieName(slug),
      result.voterToken,
    );

    return response;
  } catch (error) {
    return pollErrorResponse(error);
  }
}
