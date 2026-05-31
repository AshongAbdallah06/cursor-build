import { NextResponse } from "next/server";
import { runCalendarAssistantChat } from "@/lib/ai/calendar-assistant";
import { isGeminiConfigured } from "@/lib/ai/gemini-client";
import type { AssistantChatMessage } from "@/lib/ai/types";
import { getSessionUserId } from "@/lib/auth/session";
import { formatApiError } from "@/lib/errors/format-api-error";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gemini is not configured. Add GEMINI_API_KEY to your .env file and restart the server.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      messages?: AssistantChatMessage[];
    };

    const messages = body.messages?.filter(
      (message) =>
        message.content?.trim() &&
        (message.role === "user" || message.role === "assistant"),
    );

    if (!messages?.length) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 },
      );
    }

    const result = await runCalendarAssistantChat(userId, messages);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Calendar assistant chat failed:", err);
    const message = formatApiError(
      err,
      "The assistant could not respond right now. Please try again.",
    );
    const status =
      message.includes("Gemini") || message.includes("configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
