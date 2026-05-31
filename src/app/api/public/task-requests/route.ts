import { NextResponse } from "next/server";
import {
  createPublicTaskRequest,
  getProviderPublicProfile,
} from "@/lib/tasks/task-service";
import { serializeTaskForJson } from "@/lib/tasks/serialize";
import { combineDateAndTime, validateTaskTimes } from "@/lib/tasks/validation";
import type { TaskPriority } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json({ error: "providerId is required" }, { status: 400 });
  }

  const provider = await getProviderPublicProfile(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({ provider });
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
      providerId: body.providerId,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
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
