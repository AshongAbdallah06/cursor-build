import { NextResponse } from "next/server";
import {
  createPublicTaskRequest,
  getUserPublicProfile,
} from "@/lib/tasks/task-service";
import { serializeTaskForJson } from "@/lib/tasks/serialize";
import { parseOptionalSchedule } from "@/lib/tasks/validation";
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
      sameDay?: boolean;
      priority?: TaskPriority;
    };

    if (
      !body.providerId ||
      !body.clientName?.trim() ||
      !body.clientEmail?.trim() ||
      !body.title?.trim() ||
      !body.priority
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    const schedule = parseOptionalSchedule({
      startDate: body.startDate ?? body.date,
      startTime: body.startTime,
      endDate: body.endDate ?? body.date,
      endTime: body.endTime,
      sameDay: body.sameDay,
    });

    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const task = await createPublicTaskRequest({
      hostUserId: body.providerId,
      requesterName: body.clientName,
      requesterEmail: body.clientEmail,
      title: body.title,
      description: body.description,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
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
