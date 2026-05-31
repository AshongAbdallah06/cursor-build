import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isGoogleCalendarConfigured } from "@/lib/google/config";
import { createOAuthState } from "@/lib/google/oauth-state";
import { getGoogleAuthUrl } from "@/lib/google/client";

export async function GET() {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar integration is not configured" },
      { status: 503 },
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "No active session. Sign in first." },
      { status: 401 },
    );
  }

  const state = createOAuthState(userId);
  const authUrl = getGoogleAuthUrl(userId, state);

  return NextResponse.redirect(authUrl);
}
