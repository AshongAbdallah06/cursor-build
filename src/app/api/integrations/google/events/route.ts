import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  fetchGoogleEventsForUser,
  fetchProviderGoogleBusySlots,
} from "@/lib/integrations/calendar-integration";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMinRaw = searchParams.get("timeMin");
  const timeMaxRaw = searchParams.get("timeMax");
  const includeProviderBusy = searchParams.get("includeProviderBusy") === "true";

  if (!timeMinRaw || !timeMaxRaw) {
    return NextResponse.json(
      { error: "timeMin and timeMax are required" },
      { status: 400 },
    );
  }

  const timeMin = new Date(timeMinRaw);
  const timeMax = new Date(timeMaxRaw);

  if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const [userEvents, providerBusyEvents] = await Promise.all([
      fetchGoogleEventsForUser(userId, timeMin, timeMax),
      includeProviderBusy
        ? fetchProviderGoogleBusySlots(timeMin, timeMax)
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      events: userEvents,
      providerBusyEvents,
    });
  } catch (err) {
    console.error("Failed to fetch Google Calendar events:", err);
    return NextResponse.json(
      { error: "Failed to fetch Google Calendar events", events: [], providerBusyEvents: [] },
      { status: 502 },
    );
  }
}
