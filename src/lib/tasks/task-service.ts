import { prisma } from "@/lib/prisma";
import { MOCK_USER_IDS } from "@/lib/mock-data";
import { sendTaskRequestEmail } from "@/lib/email/task-request-email";
import { serializeTask } from "@/lib/tasks/serialize";
import {
  tasksOverlap,
  validateTaskTimes,
} from "@/lib/tasks/validation";
import type { TaskPriority } from "@/types";
import { TASK_STATUS_LABELS } from "@/lib/constants";

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
  providerId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
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

export async function getProviderPublicProfile(providerId: string) {
  const user = await prisma.user.findUnique({ where: { id: providerId } });
  if (!user || user.role !== "PROVIDER") {
    return null;
  }
  return {
    id: user.id,
    fullName: user.fullName,
  };
}

export async function getDefaultProviderId(): Promise<string> {
  return process.env.DEFAULT_PROVIDER_ID ?? MOCK_USER_IDS.provider;
}

async function assertNoScheduleConflict(
  providerId: string,
  startTime: Date,
  endTime: Date,
  excludeTaskId?: string,
) {
  const existingTasks = await prisma.task.findMany({
    where: {
      assignedToId: providerId,
      ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const hasConflict = existingTasks.some((task) =>
    tasksOverlap(startTime, endTime, task.startTime, task.endTime),
  );

  if (hasConflict) {
    throw new Error(
      "That time slot is unavailable. Please choose a different time.",
    );
  }
}

async function findOrCreateClient(email: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.role !== "CLIENT") {
      throw new Error("This email cannot be used to submit task requests.");
    }
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
      role: "CLIENT",
    },
  });
}

export async function createPublicTaskRequest(
  input: CreatePublicTaskRequestInput,
) {
  const timeError = validateTaskTimes(input.startTime, input.endTime);
  if (timeError) {
    throw new Error(timeError);
  }

  const provider = await prisma.user.findUnique({
    where: { id: input.providerId },
  });
  if (!provider || provider.role !== "PROVIDER") {
    throw new Error("Provider not found");
  }

  await assertNoScheduleConflict(
    input.providerId,
    input.startTime,
    input.endTime,
  );

  const client = await findOrCreateClient(input.clientEmail, input.clientName);

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startTime: input.startTime,
      endTime: input.endTime,
      createdById: client.id,
      assignedToId: input.providerId,
      status: "PENDING",
      priority: input.priority,
    },
    include: taskInclude,
  });

  await prisma.notification.create({
    data: {
      userId: input.providerId,
      type: "TASK_ADDED",
      message: `${client.fullName} requested a new task: "${task.title}"`,
    },
  });

  void sendTaskRequestEmail({
    providerEmail: provider.email,
    providerName: provider.fullName,
    clientName: client.fullName,
    clientEmail: client.email,
    title: task.title,
    description: task.description,
    startTime: task.startTime,
    endTime: task.endTime,
    priority: task.priority,
  }).then((result) => {
    if (!result.sent) {
      console.warn("[email] Task request notification was not sent:", result);
    }
  }).catch((err) => {
    console.error("Failed to send task request email:", err);
  });

  return serializeTask(task);
}

export async function createAssistantSchedule(
  userId: string,
  input: CreateAssistantScheduleInput,
) {
  const user = await getSessionUser(userId);
  const timeError = validateTaskTimes(input.startTime, input.endTime);
  if (timeError) {
    throw new Error(timeError);
  }

  const providerId =
    user.role === "PROVIDER" ? user.id : await getDefaultProviderId();

  await assertNoScheduleConflict(
    providerId,
    input.startTime,
    input.endTime,
  );

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startTime: input.startTime,
      endTime: input.endTime,
      createdById: user.id,
      assignedToId: providerId,
      status: user.role === "PROVIDER" ? "ACCEPTED" : "PENDING",
      priority: input.priority ?? "MEDIUM",
    },
    include: taskInclude,
  });

  if (user.role === "CLIENT") {
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: "TASK_ADDED",
        message: `${user.fullName} requested a new task via assistant: "${task.title}"`,
      },
    });
  }

  return serializeTask(task);
}

export async function listTasksForUser(userId: string) {
  const user = await getSessionUser(userId);

  const tasks = await prisma.task.findMany({
    where: user.role === "PROVIDER" ? {} : { createdById: userId },
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
  const user = await getSessionUser(userId);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new Error("Task not found");
  }

  if (user.role !== "PROVIDER") {
    throw new Error("Only the provider can update tasks");
  }

  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;
  const timeError = validateTaskTimes(startTime, endTime);
  if (timeError) {
    throw new Error(timeError);
  }

  await assertNoScheduleConflict(
    existing.assignedToId,
    startTime,
    endTime,
    taskId,
  );

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
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
  const user = await getSessionUser(userId);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new Error("Task not found");
  }

  if (user.role !== "PROVIDER") {
    throw new Error("Only the provider can delete tasks");
  }

  await prisma.task.delete({ where: { id: taskId } });
}
