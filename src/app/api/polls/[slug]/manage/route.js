import { getDatabase } from "@/lib/database/client";
import {
  ownerCookieName,
  pollErrorResponse,
  readCookie,
} from "@/lib/polls/http";
import { getOrganizerPoll } from "@/lib/polls/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { slug } = await context.params;

  try {
    const poll = await getOrganizerPoll(
      slug,
      readCookie(request, ownerCookieName(slug)),
      { db: getDatabase() },
    );

    return Response.json({ poll });
  } catch (error) {
    return pollErrorResponse(error);
  }
}
