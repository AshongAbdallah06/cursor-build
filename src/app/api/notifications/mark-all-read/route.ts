import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/notifications/notification-service";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  try {
    await markAllNotificationsRead(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to mark notifications read:", err);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
