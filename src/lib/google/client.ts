import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { getGoogleOAuthConfig, GOOGLE_CALENDAR_SCOPES } from "@/lib/google/config";

export function createGoogleOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(userId: string, state: string): string {
  const oauth2Client = createGoogleOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeGoogleCode(code: string) {
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const profile = await oauth2.userinfo.get();

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    calendarEmail: profile.data.email ?? null,
  };
}

export function createAuthenticatedCalendarClient(credentials: {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date | null;
  }) => Promise<void>;
}) {
  const oauth2Client = createGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken ?? undefined,
    expiry_date: credentials.tokenExpiry?.getTime(),
  });

  if (credentials.onTokenRefresh) {
    oauth2Client.on("tokens", (tokens) => {
      if (!tokens.access_token) return;
      void credentials.onTokenRefresh?.({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? credentials.refreshToken,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });
    });
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function listGoogleCalendarEvents(
  calendar: calendar_v3.Calendar,
  options: {
    calendarId: string;
    timeMin: Date;
    timeMax: Date;
  },
) {
  const response = await calendar.events.list({
    calendarId: options.calendarId,
    timeMin: options.timeMin.toISOString(),
    timeMax: options.timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return response.data.items ?? [];
}

export async function insertGoogleCalendarEvent(
  calendar: calendar_v3.Calendar,
  options: {
    calendarId: string;
    summary: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
  },
) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const response = await calendar.events.insert({
    calendarId: options.calendarId,
    requestBody: {
      summary: options.summary,
      description: options.description ?? undefined,
      start: {
        dateTime: options.startTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: options.endTime.toISOString(),
        timeZone,
      },
    },
  });

  return response.data;
}
