import { NextResponse } from "next/server";
import { findOrCreateUserFromOAuth } from "@/lib/auth/user-auth";
import { getAuthProvider } from "@/lib/auth/providers/registry";
import { getAppUrl, setSessionCookie } from "@/lib/auth/session";
import { verifyLoginOAuthState } from "@/lib/google/oauth-state";
import { isAuthProviderId } from "@/lib/auth/providers/types";

function loginRedirect(message?: string) {
  const url = new URL("/login", getAppUrl());
  if (message) {
    url.searchParams.set("error", message);
  }
  return NextResponse.redirect(url);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params;

  if (!isAuthProviderId(providerId)) {
    return loginRedirect("Unknown sign-in provider.");
  }

  const provider = getAuthProvider(providerId);

  if (!provider?.isConfigured()) {
    return loginRedirect(`${provider?.name ?? providerId} sign-in is not configured.`);
  }

  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    return loginRedirect(`${provider.name} sign-in was cancelled or failed.`);
  }

  if (!code || !state) {
    return loginRedirect(`Missing ${provider.name} sign-in response.`);
  }

  const verified = verifyLoginOAuthState(state);
  if (!verified) {
    return loginRedirect("Invalid or expired sign-in state. Please try again.");
  }

  try {
    const profile = await provider.exchangeCode(code);
    const user = await findOrCreateUserFromOAuth(profile);
    const response = NextResponse.redirect(
      new URL(verified.nextPath, getAppUrl()),
    );
    setSessionCookie(response, user.id);
    return response;
  } catch (err) {
    console.error(`${provider.name} sign-in callback failed:`, err);
    return loginRedirect(
      `Could not complete ${provider.name} sign-in. Please try again.`,
    );
  }
}
