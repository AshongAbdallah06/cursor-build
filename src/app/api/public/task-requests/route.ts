import { NextResponse } from "next/server";
import {
  createPublicTaskRequest,
  getUserPublicProfile,
} from "@/lib/tasks/task-service";
import { serializeTaskForJson } from "@/lib/tasks/serialize";
import { combineDateAndTime, validateTaskTimes } from "@/lib/tasks/validation";
import type { TaskPriority } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostUserId = searchParams.get("providerId");

  if (!hostUserId) {
    return NextResponse.json({ error: "providerId is required" }, { status: 400 });
  }

  const host = await getUserPublicProfile(hostUserId);
  if (!host) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ provider: host });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      clientName?: string;
      clientEmail?: string;
      title?: string;
      description?: string;
      startDate?: string;
      startTime?: string;
      endDate?: string;
      endTime?: string;
      date?: string;
      priority?: TaskPriority;
    };

    const startDate = body.startDate ?? body.date;
    const endDate = body.endDate ?? body.date;

    if (
      !body.providerId ||
      !body.clientName?.trim() ||
      !body.clientEmail?.trim() ||
      !body.title?.trim() ||
      !startDate ||
      !endDate ||
      !body.startTime ||
      !body.endTime ||
      !body.priority
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    const startTime = combineDateAndTime(startDate, body.startTime);
    const endTime = combineDateAndTime(endDate, body.endTime);
    const timeError = validateTaskTimes(startTime, endTime);

    if (timeError) {
      return NextResponse.json({ error: timeError }, { status: 400 });
    }

    const task = await createPublicTaskRequest({
      hostUserId: body.providerId,
      requesterName: body.clientName,
      requesterEmail: body.clientEmail,
      title: body.title,
      description: body.description,
      startTime,
      endTime,
      priority: body.priority,
    });

    return NextResponse.json(
      { task: serializeTaskForJson(task) },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit request";
    console.error("Public task request failed:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
