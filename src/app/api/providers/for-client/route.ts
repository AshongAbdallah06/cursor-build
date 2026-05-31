import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getProviderPublicProfile } from "@/lib/tasks/task-service";
import { findLinkedProviderForClient } from "@/lib/users/provider-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const providerId = await findLinkedProviderForClient(userId);
  if (!providerId) {
    return NextResponse.json({ provider: null });
  }

  const provider = await getProviderPublicProfile(providerId);
  if (!provider) {
    return NextResponse.json({ provider: null });
  }

  return NextResponse.json({ provider });
}
