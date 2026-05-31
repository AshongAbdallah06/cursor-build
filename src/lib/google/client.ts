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

export class GoogleCalendarAuthError extends Error {
  code: "reconnect_required";

  constructor(message: string) {
    super(message);
    this.name = "GoogleCalendarAuthError";
    this.code = "reconnect_required";
  }
}

function isGoogleAuthFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("invalid authentication credentials") ||
    message.includes("invalid_grant") ||
    message.includes("unauthorized") ||
    message.includes("invalid credentials")
  );
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

  return oauth2Client;
}

export async function getAuthenticatedCalendarClient(credentials: {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date | null;
  }) => Promise<void>;
}) {
  const oauth2Client = createAuthenticatedCalendarClient(credentials);

  const isExpired =
    !credentials.tokenExpiry ||
    credentials.tokenExpiry.getTime() <= Date.now() + 60_000;

  if (isExpired) {
    if (!credentials.refreshToken) {
      throw new GoogleCalendarAuthError(
        "Google Calendar session expired. Disconnect and reconnect in Settings.",
      );
    }

    try {
      const { credentials: refreshed } = await oauth2Client.refreshAccessToken();
      if (!refreshed.access_token) {
        throw new Error("Missing access token after refresh");
      }

      const updated = {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? credentials.refreshToken,
        tokenExpiry: refreshed.expiry_date
          ? new Date(refreshed.expiry_date)
          : null,
      };

      oauth2Client.setCredentials(refreshed);
      await credentials.onTokenRefresh?.(updated);
    } catch (error) {
      if (isGoogleAuthFailure(error)) {
        throw new GoogleCalendarAuthError(
          "Google Calendar authorization expired or permissions changed. Disconnect and reconnect in Settings.",
        );
      }
      throw error;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

async function withGoogleAuthRetry<T>(
  operation: () => Promise<T>,
  retry: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isGoogleAuthFailure(error)) {
      return retry();
    }
    throw error;
  }
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

export async function listGoogleCalendarEventsWithAuth(
  credentials: Parameters<typeof getAuthenticatedCalendarClient>[0],
  options: {
    calendarId: string;
    timeMin: Date;
    timeMax: Date;
  },
) {
  const calendar = await getAuthenticatedCalendarClient(credentials);

  return withGoogleAuthRetry(
    () => listGoogleCalendarEvents(calendar, options),
    async () => {
      const refreshedCalendar = await getAuthenticatedCalendarClient(credentials);
      return listGoogleCalendarEvents(refreshedCalendar, options);
    },
  );
}

export async function insertGoogleCalendarEventWithAuth(
  credentials: Parameters<typeof getAuthenticatedCalendarClient>[0],
  options: {
    calendarId: string;
    summary: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
  },
) {
  const calendar = await getAuthenticatedCalendarClient(credentials);

  return withGoogleAuthRetry(
    () => insertGoogleCalendarEvent(calendar, options),
    async () => {
      const refreshedCalendar = await getAuthenticatedCalendarClient(credentials);
      return insertGoogleCalendarEvent(refreshedCalendar, options);
    },
  );
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
