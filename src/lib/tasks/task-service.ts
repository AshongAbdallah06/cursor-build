import { prisma } from "@/lib/prisma";
import { sendTaskRequestEmail } from "@/lib/email/task-request-email";
import { serializeTask } from "@/lib/tasks/serialize";
import {
  assertTaskAssignedToUser,
  assertUserExists,
} from "@/lib/users/user-lookup";
import {
  tasksOverlap,
  validateTaskTimes,
  isTaskScheduled,
} from "@/lib/tasks/validation";
import type { TaskPriority } from "@/types";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import {
  removeLinkedTaskGoogleEvent,
  syncIncomingRequestToGoogleCalendar,
  syncLinkedTaskGoogleEvent,
} from "@/lib/tasks/task-google-sync";

const taskInclude = {
  createdBy: true,
  assignedTo: true,
} as const;

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date;
  status?: import("@/types").TaskStatus;
  priority?: TaskPriority;
}

export interface CreatePublicTaskRequestInput {
  hostUserId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description?: string;
  startTime?: Date | null;
  endTime?: Date | null;
  priority: TaskPriority;
}

export interface CreateAssistantScheduleInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  priority?: TaskPriority;
}

async function getSessionUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export { getUserPublicProfile } from "@/lib/users/user-lookup";

async function assertNoScheduleConflict(
  assigneeId: string,
  startTime: Date,
  endTime: Date,
  excludeTaskId?: string,
) {
  const existingTasks = await prisma.task.findMany({
    where: {
      assignedToId: assigneeId,
      startTime: { not: null },
      endTime: { not: null },
      ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const hasConflict = existingTasks.some((task) =>
    tasksOverlap(
      startTime,
      endTime,
      task.startTime!,
      task.endTime!,
    ),
  );

  if (hasConflict) {
    throw new Error(
      "That time slot is unavailable. Please choose a different time.",
    );
  }
}

async function findOrCreateRequester(email: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.fullName !== fullName.trim()) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { fullName: fullName.trim() },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: fullName.trim(),
    },
  });
}

export async function createPublicTaskRequest(
  input: CreatePublicTaskRequestInput,
) {
  const timeError = validateTaskTimes(
    input.startTime ?? null,
    input.endTime ?? null,
  );
  if (timeError) {
    throw new Error(timeError);
  }

  const host = await assertUserExists(input.hostUserId);

  if (input.startTime && input.endTime) {
    await assertNoScheduleConflict(
      input.hostUserId,
      input.startTime,
      input.endTime,
    );
  }

  const requester = await findOrCreateRequester(
    input.requesterEmail,
    input.requesterName,
  );

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      createdById: requester.id,
      assignedToId: input.hostUserId,
      status: "PENDING",
      priority: input.priority,
    },
    include: taskInclude,
  });

  let syncedTask = task;

  if (isTaskScheduled(task)) {
    const googleEventId = await syncIncomingRequestToGoogleCalendar({
      hostUserId: input.hostUserId,
      title: task.title,
      description: task.description,
      startTime: task.startTime!,
      endTime: task.endTime!,
      requesterName: requester.fullName,
      requesterEmail: requester.email,
      status: task.status,
    });

    if (googleEventId) {
      syncedTask = await prisma.task.update({
        where: { id: task.id },
        data: { googleEventId },
        include: taskInclude,
      });
    }
  }

  await prisma.notification.create({
    data: {
      userId: input.hostUserId,
      type: "TASK_ADDED",
      message: `${requester.fullName} requested a new task: "${syncedTask.title}"`,
    },
  });

  void sendTaskRequestEmail({
    providerEmail: host.email,
    providerName: host.fullName,
    clientName: requester.fullName,
    clientEmail: requester.email,
    title: syncedTask.title,
    description: syncedTask.description,
    startTime: syncedTask.startTime,
    endTime: syncedTask.endTime,
    priority: syncedTask.priority,
  }).then((result) => {
    if (!result.sent) {
      console.warn("[email] Task request notification was not sent:", result);
    }
  }).catch((err) => {
    console.error("Failed to send task request email:", err);
  });

  return serializeTask(syncedTask);
}

export async function createAssistantSchedule(
  userId: string,
  input: CreateAssistantScheduleInput,
) {
  await getSessionUser(userId);
  const timeError = validateTaskTimes(input.startTime, input.endTime);
  if (timeError) {
    throw new Error(timeError);
  }

  await assertNoScheduleConflict(userId, input.startTime, input.endTime);

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startTime: input.startTime,
      endTime: input.endTime,
      createdById: userId,
      assignedToId: userId,
      status: "ACCEPTED",
      priority: input.priority ?? "MEDIUM",
    },
    include: taskInclude,
  });

  return serializeTask(task);
}

export async function listTasksForUser(userId: string) {
  await getSessionUser(userId);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ createdById: userId }, { assignedToId: userId }],
    },
    include: taskInclude,
    orderBy: { startTime: "asc" },
  });

  return tasks.map(serializeTask);
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  data: UpdateTaskData,
) {
  await getSessionUser(userId);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new Error("Task not found");
  }

  await assertTaskAssignedToUser(userId, existing.assignedToId);

  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;
  const timeError = validateTaskTimes(startTime, endTime);
  if (timeError) {
    throw new Error(timeError);
  }

  if (startTime && endTime) {
    await assertNoScheduleConflict(
      existing.assignedToId,
      startTime,
      endTime,
      taskId,
    );
  }

  const isIncomingRequest = existing.createdById !== existing.assignedToId;
  const nextStatus = data.status ?? existing.status;
  let nextGoogleEventId = existing.googleEventId;

  if (
    isIncomingRequest &&
    existing.googleEventId &&
    isTaskScheduled({ startTime, endTime })
  ) {
    const requester = await prisma.user.findUnique({
      where: { id: existing.createdById },
    });

    if (requester) {
      if (nextStatus === "DECLINED") {
        await removeLinkedTaskGoogleEvent(
          existing.assignedToId,
          existing.googleEventId,
        );
        nextGoogleEventId = null;
      } else if (startTime && endTime) {
        await syncLinkedTaskGoogleEvent({
          hostUserId: existing.assignedToId,
          googleEventId: existing.googleEventId,
          title: data.title?.trim() ?? existing.title,
          description:
            data.description !== undefined
              ? data.description
              : existing.description,
          startTime,
          endTime,
          requesterName: requester.fullName,
          requesterEmail: requester.email,
          status: nextStatus,
        });
      }
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      googleEventId: nextGoogleEventId,
    },
    include: taskInclude,
  });

  if (data.status && data.status !== existing.status && existing.createdById) {
    await prisma.notification.create({
      data: {
        userId: existing.createdById,
        type: "STATUS_CHANGED",
        message: `"${task.title}" has been updated to ${TASK_STATUS_LABELS[data.status]}`,
      },
    });
  }

  return serializeTask(task);
}

export async function deleteTaskForUser(userId: string, taskId: string) {
  await getSessionUser(userId);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new Error("Task not found");
  }

  await assertTaskAssignedToUser(userId, existing.assignedToId);

  if (existing.googleEventId) {
    await removeLinkedTaskGoogleEvent(existing.assignedToId, existing.googleEventId);
  }

  await prisma.task.delete({ where: { id: taskId } });
}
