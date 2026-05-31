import {
  ClientCache,
  GOOGLE_EVENTS_STALE_MS,
  GOOGLE_STATUS_STALE_MS,
} from "@/lib/cache/client-cache";
import type { GoogleCalendarEvent, GoogleIntegrationStatus } from "@/types";

export interface CachedGoogleEvents {
  events: GoogleCalendarEvent[];
  providerBusyEvents: GoogleCalendarEvent[];
}

const statusCache = new ClientCache<GoogleIntegrationStatus>();
const eventsCache = new ClientCache<CachedGoogleEvents>();

let lastVisibleRange: { start: Date; end: Date } | null = null;

export function buildGoogleEventsCacheKey(
  userId: string,
  timeMin: Date,
  timeMax: Date,
  includeProviderBusy: boolean,
): string {
  return `${userId}|${timeMin.toISOString()}|${timeMax.toISOString()}|${includeProviderBusy}`;
}

export function getCachedGoogleStatus(userId: string) {
  return statusCache.get(userId);
}

export function setCachedGoogleStatus(userId: string, status: GoogleIntegrationStatus) {
  statusCache.set(userId, status);
}

export function isGoogleStatusFresh(userId: string) {
  return statusCache.isFresh(userId, GOOGLE_STATUS_STALE_MS);
}

export function getCachedGoogleEvents(key: string) {
  return eventsCache.get(key);
}

export function setCachedGoogleEvents(key: string, data: CachedGoogleEvents) {
  eventsCache.set(key, data);
}

export function isGoogleEventsFresh(key: string) {
  return eventsCache.isFresh(key, GOOGLE_EVENTS_STALE_MS);
}

export function getLastVisibleCalendarRange() {
  return lastVisibleRange;
}

export function setLastVisibleCalendarRange(range: { start: Date; end: Date }) {
  lastVisibleRange = range;
}

export function invalidateGoogleCalendarCache(userId?: string) {
  if (userId) {
    statusCache.invalidate(userId);
    eventsCache.invalidateMatching((key) => key.startsWith(`${userId}|`));
    return;
  }

  statusCache.invalidate();
  eventsCache.invalidate();
}
