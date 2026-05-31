import type { OAuthProfile } from "@/lib/auth/providers/types";
import {
  FACEBOOK_GRAPH_VERSION,
  getFacebookOAuthConfig,
  isFacebookAuthConfigured,
} from "@/lib/auth/providers/facebook-config";

export { isFacebookAuthConfigured };

export function getFacebookLoginAuthUrl(state: string): string {
  const { clientId, redirectUri } = getFacebookOAuthConfig();

  if (!clientId || !redirectUri) {
    throw new Error("Facebook sign-in is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "email,public_profile",
    response_type: "code",
  });

  return `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

async function exchangeFacebookToken(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getFacebookOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${params.toString()}`,
  );

  const data = (await response.json()) as {
    access_token?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Facebook token exchange failed");
  }

  return data.access_token;
}

async function fetchFacebookProfile(accessToken: string): Promise<OAuthProfile> {
  const params = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me?${params.toString()}`,
  );

  const data = (await response.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
    error?: { message?: string };
  };

  if (!response.ok || !data.id || !data.email) {
    throw new Error(data.error?.message ?? "Facebook did not return a complete profile");
  }

  return {
    provider: "facebook",
    providerId: data.id,
    email: data.email.trim().toLowerCase(),
    fullName: data.name?.trim() || data.email.split("@")[0] || "User",
    imageUrl: data.picture?.data?.url ?? null,
  };
}

export async function exchangeFacebookLoginCode(
  code: string,
): Promise<OAuthProfile> {
  const accessToken = await exchangeFacebookToken(code);
  return fetchFacebookProfile(accessToken);
}
