import { TASK_STATUS_LABELS } from "@/lib/constants";
import {
  createGoogleEventForUser,
  deleteGoogleEventForUser,
  updateGoogleEventForUser,
} from "@/lib/integrations/calendar-integration";
import type { TaskStatus } from "@/types";

export function buildTaskGoogleEventContent(input: {
  title: string;
  description: string | null;
  requesterName: string;
  requesterEmail: string;
  status: TaskStatus;
}) {
  const isPending = input.status === "PENDING";
  const summary = isPending
    ? `Pending request: ${input.title}`
    : input.title;

  const descriptionParts = [
    input.description,
    `Requested by ${input.requesterName} (${input.requesterEmail})`,
    `CalTask status: ${TASK_STATUS_LABELS[input.status]}`,
  ].filter(Boolean);

  return {
    summary,
    description: descriptionParts.join("\n\n"),
  };
}

export async function syncIncomingRequestToGoogleCalendar(input: {
  hostUserId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  requesterName: string;
  requesterEmail: string;
  status: TaskStatus;
}): Promise<string | null> {
  const { summary, description } = buildTaskGoogleEventContent(input);

  try {
    const event = await createGoogleEventForUser(input.hostUserId, {
      title: summary,
      description,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    return event.id;
  } catch (error) {
    console.warn("[google] Failed to sync incoming request to Google Calendar:", error);
    return null;
  }
}

export async function syncLinkedTaskGoogleEvent(input: {
  hostUserId: string;
  googleEventId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  requesterName: string;
  requesterEmail: string;
  status: TaskStatus;
}) {
  const { summary, description } = buildTaskGoogleEventContent(input);

  try {
    await updateGoogleEventForUser(input.hostUserId, input.googleEventId, {
      title: summary,
      description,
      startTime: input.startTime,
      endTime: input.endTime,
    });
  } catch (error) {
    console.warn("[google] Failed to update linked Google Calendar event:", error);
  }
}

export async function removeLinkedTaskGoogleEvent(
  hostUserId: string,
  googleEventId: string,
) {
  try {
    await deleteGoogleEventForUser(hostUserId, googleEventId);
  } catch (error) {
    console.warn("[google] Failed to delete linked Google Calendar event:", error);
  }
}
