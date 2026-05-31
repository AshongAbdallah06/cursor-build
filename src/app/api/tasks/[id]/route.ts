import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  deleteTaskForUser,
  updateTaskForUser,
} from "@/lib/tasks/task-service";
import { serializeTaskForJson } from "@/lib/tasks/serialize";
import type { TaskPriority, TaskStatus } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    description?: string | null;
    startTime?: string;
    endTime?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  };

  try {
    const task = await updateTaskForUser(userId, id, {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    });

    return NextResponse.json({ task: serializeTaskForJson(task) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status =
      message === "Task not found"
        ? 404
        : message.includes("provider")
          ? 403
          : 500;
    console.error("Failed to update task:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteTaskForUser(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status =
      message === "Task not found"
        ? 404
        : message.includes("provider")
          ? 403
          : 500;
    console.error("Failed to delete task:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
