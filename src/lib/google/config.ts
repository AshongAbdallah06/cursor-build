import { getAppUrl } from "@/lib/app-url";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const GOOGLE_AUTH_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${getAppUrl()}/api/integrations/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleAuthOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_AUTH_REDIRECT_URI ??
    `${getAppUrl()}/api/auth/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function isGoogleCalendarConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(clientId && clientSecret);
}

export function isGoogleAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleAuthOAuthConfig();
  return Boolean(clientId && clientSecret);
}
