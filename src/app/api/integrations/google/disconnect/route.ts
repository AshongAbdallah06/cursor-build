import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  disconnectGoogleIntegration,
  setGoogleSyncEnabled,
} from "@/lib/integrations/calendar-integration";

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  try {
    await disconnectGoogleIntegration(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to disconnect Google Calendar:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const body = (await request.json()) as { syncEnabled?: boolean };
  if (typeof body.syncEnabled !== "boolean") {
    return NextResponse.json(
      { error: "syncEnabled must be a boolean" },
      { status: 400 },
    );
  }

  try {
    await setGoogleSyncEnabled(userId, body.syncEnabled);
    return NextResponse.json({ ok: true, syncEnabled: body.syncEnabled });
  } catch (err) {
    console.error("Failed to update Google sync settings:", err);
    return NextResponse.json(
      { error: "Failed to update sync settings" },
      { status: 500 },
    );
  }
}
