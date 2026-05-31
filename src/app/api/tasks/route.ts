import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { listTasksForUser } from "@/lib/tasks/task-service";
import { serializeTaskForJson } from "@/lib/tasks/serialize";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  try {
    const tasks = await listTasksForUser(userId);
    return NextResponse.json({
      tasks: tasks.map(serializeTaskForJson),
    });
  } catch (err) {
    console.error("Failed to list tasks:", err);
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 },
    );
  }
}
