import { getAppUrl } from "@/lib/app-url";

export function getGitHubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ??
    `${getAppUrl()}/api/auth/github/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function isGitHubAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGitHubOAuthConfig();
  return Boolean(clientId && clientSecret);
}
