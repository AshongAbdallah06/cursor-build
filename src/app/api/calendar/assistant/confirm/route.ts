import { NextResponse } from "next/server";
import { commitAssistantScheduleDraft } from "@/lib/ai/calendar-tools";
import type { AssistantScheduleDraft } from "@/lib/ai/types";
import { getSessionUserId } from "@/lib/auth/session";
import { formatApiError } from "@/lib/errors/format-api-error";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { draft?: AssistantScheduleDraft };

    const draft = body.draft;
    if (
      !draft?.id ||
      !draft.title?.trim() ||
      !draft.startTime ||
      !draft.endTime
    ) {
      return NextResponse.json(
        { error: "A valid draft is required to confirm." },
        { status: 400 },
      );
    }

    const result = await commitAssistantScheduleDraft(userId, {
      id: draft.id,
      title: draft.title.trim(),
      description: draft.description ?? null,
      startTime: draft.startTime,
      endTime: draft.endTime,
      priority: draft.priority ?? "MEDIUM",
      syncToGoogle: draft.syncToGoogle !== false,
    });

    return NextResponse.json({
      calendarUpdated: true,
      result,
    });
  } catch (err) {
    console.error("Calendar assistant confirm failed:", err);
    const message = formatApiError(
      err,
      "Could not add that event. Please try again.",
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
