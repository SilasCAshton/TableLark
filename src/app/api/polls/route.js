import { getDatabase } from "@/lib/database/client";
import {
  ownerCookieName,
  pollErrorResponse,
  readJsonBody,
  setPrivateCookie,
} from "@/lib/polls/http";
import {
  checkPollRateLimit,
  rateLimitResponse,
} from "@/lib/polls/rate-limit";
import { createPoll } from "@/lib/polls/service";

export const runtime = "nodejs";

export async function POST(request) {
  const retryAfter = checkPollRateLimit(request, "create", {
    limit: 10,
  });

  if (retryAfter !== null) {
    return rateLimitResponse(retryAfter);
  }

  try {
    const payload = await readJsonBody(request);
    const result = await createPoll(payload, {
      db: getDatabase(),
    });
    const response = Response.json(
      {
        poll: result.poll,
        sharePath: `/polls/${result.poll.slug}`,
      },
      { status: 201 },
    );

    setPrivateCookie(
      response,
      ownerCookieName(result.poll.slug),
      result.ownerToken,
    );

    return response;
  } catch (error) {
    return pollErrorResponse(error);
  }
}
