import { getDatabase } from "@/lib/database/client";
import {
  ownerCookieName,
  pollErrorResponse,
  readCookie,
} from "@/lib/polls/http";
import {
  checkPollRateLimit,
  rateLimitResponse,
} from "@/lib/polls/rate-limit";
import { manuallyClosePoll } from "@/lib/polls/service";

export const runtime = "nodejs";

export async function POST(request, context) {
  const { slug } = await context.params;
  const retryAfter = checkPollRateLimit(request, "close", {
    limit: 10,
  });

  if (retryAfter !== null) {
    return rateLimitResponse(retryAfter);
  }

  try {
    const poll = await manuallyClosePoll(
      slug,
      readCookie(request, ownerCookieName(slug)),
      { db: getDatabase() },
    );

    return Response.json({ poll });
  } catch (error) {
    return pollErrorResponse(error);
  }
}
