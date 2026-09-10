import { getDatabase } from "@/lib/database/client";
import {
  pollErrorResponse,
  readCookie,
  voterCookieName,
} from "@/lib/polls/http";
import { getParticipantPoll } from "@/lib/polls/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { slug } = await context.params;

  try {
    const poll = await getParticipantPoll(
      slug,
      readCookie(request, voterCookieName(slug)),
      { db: getDatabase() },
    );

    return Response.json({ poll });
  } catch (error) {
    return pollErrorResponse(error);
  }
}
