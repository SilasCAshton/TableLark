import { getDatabase } from "@/lib/database/client";
import {
  ownerCookieName,
  pollErrorResponse,
  readCookie,
  readJsonBody,
} from "@/lib/polls/http";
import {
  checkPollRateLimit,
  rateLimitResponse,
} from "@/lib/polls/rate-limit";
import { resolvePollTie } from "@/lib/polls/service";

export const runtime = "nodejs";

export async function POST(request, context) {
  const { slug } = await context.params;
  const retryAfter = checkPollRateLimit(request, "tie", {
    limit: 10,
  });

  if (retryAfter !== null) {
    return rateLimitResponse(retryAfter);
  }

  try {
    const payload = await readJsonBody(request);
    const poll = await resolvePollTie(
      slug,
      payload,
      readCookie(request, ownerCookieName(slug)),
      { db: getDatabase() },
    );

    return Response.json({ poll });
  } catch (error) {
    return pollErrorResponse(error);
  }
}
