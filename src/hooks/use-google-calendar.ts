"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/providers/user-provider";
import {
  buildGoogleEventsCacheKey,
  getCachedGoogleEvents,
  getCachedGoogleStatus,
  isGoogleEventsFresh,
  isGoogleStatusFresh,
  setCachedGoogleEvents,
  setCachedGoogleStatus,
  type CachedGoogleEvents,
} from "@/lib/cache/google-calendar-cache";
import type { GoogleCalendarEvent, GoogleIntegrationStatus } from "@/types";

interface GoogleEventsResponse {
  events: GoogleCalendarEvent[];
  providerBusyEvents: GoogleCalendarEvent[];
  error?: string;
  errorCode?: string;
}

const DEFAULT_STATUS: GoogleIntegrationStatus = {
  connected: false,
  provider: "GOOGLE",
  calendarEmail: null,
  syncEnabled: false,
  connectedAt: null,
  configured: false,
};

function parseGoogleEvents(data: GoogleEventsResponse): CachedGoogleEvents {
  return {
    events: data.events.map((event) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    })),
    providerBusyEvents: (data.providerBusyEvents ?? []).map((event) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    })),
  };
}

export function useGoogleIntegrationStatus() {
  const { currentUser } = useUser();
  const cached = getCachedGoogleStatus(currentUser.id);
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(
    () => cached?.data ?? null,
  );
  const [loading, setLoading] = useState(() => !cached);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;

      if (!force && isGoogleStatusFresh(currentUser.id)) {
        const entry = getCachedGoogleStatus(currentUser.id);
        if (entry) {
          setStatus(entry.data);
          setLoading(false);
          return;
        }
      }

      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current;
        return;
      }

      const hasCachedData = Boolean(getCachedGoogleStatus(currentUser.id));
      if (!hasCachedData) {
        setLoading(true);
      }

      const fetchPromise = (async () => {
        try {
          const response = await fetch("/api/integrations/google/status");
          const data = (await response.json()) as GoogleIntegrationStatus;
          setCachedGoogleStatus(currentUser.id, data);
          setStatus(data);
        } catch {
          const fallback = { ...DEFAULT_STATUS };
          setCachedGoogleStatus(currentUser.id, fallback);
          setStatus(fallback);
        } finally {
          setLoading(false);
          fetchInFlightRef.current = null;
        }
      })();

      fetchInFlightRef.current = fetchPromise;
      await fetchPromise;
    },
    [currentUser.id],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}

export function useGoogleCalendarEvents(options: {
  timeMin: Date | null;
  timeMax: Date | null;
  includeProviderBusy: boolean;
  enabled?: boolean;
}) {
  const { currentUser } = useUser();
  const cacheKey =
    options.timeMin && options.timeMax
      ? buildGoogleEventsCacheKey(
          currentUser.id,
          options.timeMin,
          options.timeMax,
          options.includeProviderBusy,
        )
      : null;

  const cachedEntry = cacheKey ? getCachedGoogleEvents(cacheKey) : undefined;

  const [events, setEvents] = useState<GoogleCalendarEvent[]>(
    () => cachedEntry?.data.events ?? [],
  );
  const [providerBusyEvents, setProviderBusyEvents] = useState<
    GoogleCalendarEvent[]
  >(() => cachedEntry?.data.providerBusyEvents ?? []);
  const [loading, setLoading] = useState(
    () => Boolean(cacheKey && options.enabled !== false && !cachedEntry),
  );
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const fetchEvents = useCallback(
    async (fetchOptions?: { force?: boolean }) => {
      const force = fetchOptions?.force ?? false;

      if (
        !cacheKey ||
        !options.timeMin ||
        !options.timeMax ||
        options.enabled === false
      ) {
        setEvents([]);
        setProviderBusyEvents([]);
        setLoading(false);
        return;
      }

      if (!force && isGoogleEventsFresh(cacheKey)) {
        const entry = getCachedGoogleEvents(cacheKey);
        if (entry) {
          setEvents(entry.data.events);
          setProviderBusyEvents(entry.data.providerBusyEvents);
          setLoading(false);
          setError(null);
          return;
        }
      }

      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current;
        return;
      }

      const hasCachedData = Boolean(getCachedGoogleEvents(cacheKey));
      if (!hasCachedData) {
        setLoading(true);
      }

      const fetchPromise = (async () => {
        setError(null);
        setNeedsReconnect(false);

        try {
          const params = new URLSearchParams({
            timeMin: options.timeMin!.toISOString(),
            timeMax: options.timeMax!.toISOString(),
            includeProviderBusy: String(options.includeProviderBusy),
          });

          const response = await fetch(
            `/api/integrations/google/events?${params.toString()}`,
          );
          const data = (await response.json()) as GoogleEventsResponse;

          if (!response.ok && !data.events) {
            if (data.errorCode === "reconnect_required") {
              setNeedsReconnect(true);
            }
            throw new Error(data.error ?? "Failed to load Google Calendar events");
          }

          const parsed = parseGoogleEvents(data);
          setCachedGoogleEvents(cacheKey, parsed);
          setEvents(parsed.events);
          setProviderBusyEvents(parsed.providerBusyEvents);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load events";
          setError(message);

          const entry = getCachedGoogleEvents(cacheKey);
          if (entry) {
            setEvents(entry.data.events);
            setProviderBusyEvents(entry.data.providerBusyEvents);
          } else {
            setEvents([]);
            setProviderBusyEvents([]);
          }
        } finally {
          setLoading(false);
          fetchInFlightRef.current = null;
        }
      })();

      fetchInFlightRef.current = fetchPromise;
      await fetchPromise;
    },
    [
      cacheKey,
      options.timeMin,
      options.timeMax,
      options.includeProviderBusy,
      options.enabled,
    ],
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    providerBusyEvents,
    loading,
    error,
    needsReconnect,
    refresh: () => fetchEvents({ force: true }),
  };
}
