import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/providers/registry";
import { createLoginOAuthState } from "@/lib/google/oauth-state";
import { isAuthProviderId } from "@/lib/auth/providers/types";

function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/calendar";
  }

  return next;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params;

  if (!isAuthProviderId(providerId)) {
    return NextResponse.json({ error: "Unknown sign-in provider" }, { status: 404 });
  }

  const provider = getAuthProvider(providerId);

  if (!provider?.isConfigured()) {
    return NextResponse.json(
      { error: `${provider?.name ?? providerId} sign-in is not configured` },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const state = createLoginOAuthState(nextPath);
  const authUrl = provider.getAuthorizeUrl(state);

  return NextResponse.redirect(authUrl);
}
