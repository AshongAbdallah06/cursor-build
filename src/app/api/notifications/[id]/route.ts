import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications/notification-service";
import { serializeNotificationForJson } from "@/lib/notifications/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await markNotificationRead(userId, id);
    return NextResponse.json({
      notification: serializeNotificationForJson(notification),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update notification";
    const status = message === "Notification not found" ? 404 : 500;
    console.error("Failed to mark notification read:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
