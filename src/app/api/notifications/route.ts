import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/lib/notifications/notification-service";
import { serializeNotificationForJson } from "@/lib/notifications/serialize";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  try {
    const notifications = await listNotificationsForUser(userId);
    return NextResponse.json({
      notifications: notifications.map(serializeNotificationForJson),
    });
  } catch (err) {
    console.error("Failed to list notifications:", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}
