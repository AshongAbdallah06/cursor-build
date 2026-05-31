import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/auth/session";
import { exchangeGoogleCode } from "@/lib/google/client";
import { verifyOAuthState } from "@/lib/google/oauth-state";
import { saveGoogleIntegration } from "@/lib/integrations/calendar-integration";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/settings", getAppUrl());

  if (error) {
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("message", error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("message", "missing_code");
    return NextResponse.redirect(settingsUrl);
  }

  const verified = verifyOAuthState(state);
  if (!verified) {
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("message", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    await saveGoogleIntegration(verified.userId, tokens);
    settingsUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("message", "token_exchange_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
