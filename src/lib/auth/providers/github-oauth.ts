import type { OAuthProfile } from "@/lib/auth/providers/types";
import {
  getGitHubOAuthConfig,
  isGitHubAuthConfigured,
} from "@/lib/auth/providers/github-config";

export { isGitHubAuthConfigured };

export function getGitHubLoginAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGitHubOAuthConfig();

  if (!clientId || !redirectUri) {
    throw new Error("GitHub sign-in is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

async function exchangeGitHubToken(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getGitHubOAuthConfig();

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "GitHub token exchange failed");
  }

  return data.access_token;
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "CalTask",
  };

  const userResponse = await fetch("https://api.github.com/user", { headers });
  if (!userResponse.ok) {
    throw new Error("Failed to load GitHub profile");
  }

  const user = (await userResponse.json()) as GitHubUserResponse;
  let email = user.email?.trim().toLowerCase() ?? null;

  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers,
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as GitHubEmailResponse[];
      const primary = emails.find((entry) => entry.primary && entry.verified);
      email = (primary ?? emails.find((entry) => entry.verified))?.email
        ?.trim()
        .toLowerCase() ?? null;
    }
  }

  if (!email) {
    throw new Error("GitHub did not return a verified email address");
  }

  return {
    provider: "github",
    providerId: String(user.id),
    email,
    fullName: user.name?.trim() || user.login || email.split("@")[0] || "User",
    imageUrl: user.avatar_url,
  };
}

export async function exchangeGitHubLoginCode(code: string): Promise<OAuthProfile> {
  const accessToken = await exchangeGitHubToken(code);
  return fetchGitHubProfile(accessToken);
}
