import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isGoogleCalendarConfigured } from "@/lib/google/config";
import { getGoogleIntegrationStatus } from "@/lib/integrations/calendar-integration";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "No active session" },
      { status: 401 },
    );
  }

  try {
    const status = await getGoogleIntegrationStatus(userId);
    return NextResponse.json({
      ...status,
      configured: isGoogleCalendarConfigured(),
    });
  } catch (err) {
    console.error("Failed to load Google integration status:", err);

    const message =
      err instanceof Error ? err.message : "Unknown database error";
    const isConnectionError =
      message.includes("Can't reach database") ||
      message.includes("ECONNREFUSED") ||
      message.includes("P1001");

    return NextResponse.json(
      {
        connected: false,
        provider: "GOOGLE",
        calendarEmail: null,
        syncEnabled: false,
        connectedAt: null,
        configured: isGoogleCalendarConfigured(),
        error: isConnectionError ? "database_unavailable" : "database_error",
        message: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 200 },
    );
  }
}
