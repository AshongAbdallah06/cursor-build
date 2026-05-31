import { getAppUrl } from "@/lib/app-url";

export function getFacebookOAuthConfig() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ??
    `${getAppUrl()}/api/auth/facebook/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function isFacebookAuthConfigured(): boolean {
  const { clientId, clientSecret } = getFacebookOAuthConfig();
  return Boolean(clientId && clientSecret);
}

export const FACEBOOK_GRAPH_VERSION = "v21.0";
