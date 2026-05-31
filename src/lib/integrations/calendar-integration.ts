import { prisma } from "@/lib/prisma";
import {
  GoogleCalendarAuthError,
  insertGoogleCalendarEventWithAuth,
  listGoogleCalendarEventsWithAuth,
} from "@/lib/google/client";
import type { GoogleCalendarEvent } from "@/types";

export { GoogleCalendarAuthError };

interface TokenUpdate {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

export interface CalendarIntegrationStatus {
  connected: boolean;
  provider: "GOOGLE";
  calendarEmail: string | null;
  syncEnabled: boolean;
  connectedAt: string | null;
}

function mapGoogleEvent(
  event: {
    id?: string | null;
    summary?: string | null;
    description?: string | null;
    location?: string | null;
    htmlLink?: string | null;
    start?: { dateTime?: string | null; date?: string | null };
    end?: { dateTime?: string | null; date?: string | null };
  },
  options?: { hideDetails?: boolean },
): GoogleCalendarEvent | null {
  if (!event.id) return null;

  const startRaw = event.start?.dateTime ?? event.start?.date;
  const endRaw = event.end?.dateTime ?? event.end?.date;
  if (!startRaw) return null;

  const startTime = new Date(startRaw);
  const endTime = endRaw
    ? new Date(endRaw)
    : new Date(startTime.getTime() + 60 * 60 * 1000);
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);

  if (options?.hideDetails) {
    return {
      id: event.id,
      title: "Busy",
      description: null,
      location: null,
      htmlLink: null,
      startTime,
      endTime,
      allDay,
      source: "google",
      hideDetails: true,
    };
  }

  return {
    id: event.id,
    title: event.summary ?? "Untitled event",
    description: event.description ?? null,
    location: event.location ?? null,
    htmlLink: event.htmlLink ?? null,
    startTime,
    endTime,
    allDay,
    source: "google",
    hideDetails: false,
  };
}

async function refreshIntegrationTokens(
  integrationId: string,
  tokens: TokenUpdate,
) {
  await prisma.calendarIntegration.update({
    where: { id: integrationId },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? undefined,
      tokenExpiry: tokens.tokenExpiry,
    },
  });
}

export async function getGoogleIntegrationStatus(
  userId: string,
): Promise<CalendarIntegrationStatus> {
  const integration = await prisma.calendarIntegration.findUnique({
    where: {
      userId_provider: { userId, provider: "GOOGLE" },
    },
  });

  if (!integration) {
    return {
      connected: false,
      provider: "GOOGLE",
      calendarEmail: null,
      syncEnabled: false,
      connectedAt: null,
    };
  }

  return {
    connected: true,
    provider: "GOOGLE",
    calendarEmail: integration.calendarEmail,
    syncEnabled: integration.syncEnabled,
    connectedAt: integration.createdAt.toISOString(),
  };
}

export async function saveGoogleIntegration(
  userId: string,
  data: TokenUpdate & { calendarEmail: string | null },
) {
  await prisma.calendarIntegration.upsert({
    where: {
      userId_provider: { userId, provider: "GOOGLE" },
    },
    create: {
      userId,
      provider: "GOOGLE",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.tokenExpiry,
      calendarEmail: data.calendarEmail,
      syncEnabled: true,
    },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? undefined,
      tokenExpiry: data.tokenExpiry,
      calendarEmail: data.calendarEmail,
      syncEnabled: true,
    },
  });
}

export async function disconnectGoogleIntegration(userId: string) {
  await prisma.calendarIntegration.deleteMany({
    where: { userId, provider: "GOOGLE" },
  });
}

export async function setGoogleSyncEnabled(userId: string, enabled: boolean) {
  await prisma.calendarIntegration.update({
    where: {
      userId_provider: { userId, provider: "GOOGLE" },
    },
    data: { syncEnabled: enabled },
  });
}

async function getIntegrationForUser(userId: string) {
  return prisma.calendarIntegration.findUnique({
    where: {
      userId_provider: { userId, provider: "GOOGLE" },
    },
  });
}

function buildCalendarCredentials(
  integration: NonNullable<Awaited<ReturnType<typeof getIntegrationForUser>>>,
) {
  return {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    tokenExpiry: integration.tokenExpiry,
    onTokenRefresh: (tokens: TokenUpdate) =>
      refreshIntegrationTokens(integration.id, tokens),
  };
}

export async function fetchGoogleEventsForUser(
  userId: string,
  timeMin: Date,
  timeMax: Date,
  options?: { hideDetails?: boolean },
): Promise<GoogleCalendarEvent[]> {
  const integration = await getIntegrationForUser(userId);
  if (!integration || !integration.syncEnabled) {
    return [];
  }

  try {
    const items = await listGoogleCalendarEventsWithAuth(
      buildCalendarCredentials(integration),
      {
        calendarId: integration.calendarId,
        timeMin,
        timeMax,
      },
    );

    return items
      .map((event) => mapGoogleEvent(event, options))
      .filter((event): event is GoogleCalendarEvent => event !== null);
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) {
      throw error;
    }
    throw error;
  }
}

/** Provider Google events shown as anonymous busy blocks to clients */
export async function fetchProviderGoogleBusySlots(
  providerId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleCalendarEvent[]> {
  return fetchGoogleEventsForUser(providerId, timeMin, timeMax, {
    hideDetails: true,
  });
}

export async function createGoogleEventForUser(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
  },
): Promise<GoogleCalendarEvent> {
  const integration = await getIntegrationForUser(userId);
  if (!integration || !integration.syncEnabled) {
    throw new Error(
      "Google Calendar is not connected. Connect it in Settings to sync events.",
    );
  }

  const created = await insertGoogleCalendarEventWithAuth(
    buildCalendarCredentials(integration),
    {
      calendarId: integration.calendarId,
      summary: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
    },
  );

  const mapped = mapGoogleEvent(created);
  if (!mapped) {
    throw new Error("Failed to create Google Calendar event");
  }

  return mapped;
}

export async function getScheduleContextForUser(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const timeMin = new Date(`${startDate}T00:00:00`);
  const timeMax = new Date(`${endDate}T23:59:59`);

  if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
    throw new Error("Invalid date range");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const tasks = await prisma.task.findMany({
    where:
      user.role === "PROVIDER"
        ? {
            assignedToId: userId,
            startTime: { lte: timeMax },
            endTime: { gte: timeMin },
          }
        : {
            createdById: userId,
            startTime: { lte: timeMax },
            endTime: { gte: timeMin },
          },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      startTime: true,
      endTime: true,
    },
  });

  let googleEvents: GoogleCalendarEvent[] = [];
  let googleConnected = false;

  try {
    const integration = await getIntegrationForUser(userId);
    googleConnected = Boolean(integration?.syncEnabled);
    if (googleConnected) {
      googleEvents = await fetchGoogleEventsForUser(userId, timeMin, timeMax);
    }
  } catch {
    googleEvents = [];
  }

  return {
    startDate,
    endDate,
    googleConnected,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      startTime: task.startTime.toISOString(),
      endTime: task.endTime.toISOString(),
    })),
    googleEvents: googleEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startTime:
        event.startTime instanceof Date
          ? event.startTime.toISOString()
          : String(event.startTime),
      endTime:
        event.endTime instanceof Date
          ? event.endTime.toISOString()
          : String(event.endTime),
    })),
  };
}
