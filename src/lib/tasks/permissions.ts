import type { Task } from "@/types";

export function canManageTask(userId: string, task: Pick<Task, "assignedToId">) {
  return task.assignedToId === userId;
}

export function isIncomingRequest(
  userId: string,
  task: Pick<Task, "createdById" | "assignedToId">,
) {
  return task.assignedToId === userId && task.createdById !== userId;
}

export function isOutgoingRequest(
  userId: string,
  task: Pick<Task, "createdById" | "assignedToId">,
) {
  return task.createdById === userId && task.assignedToId !== userId;
}

export function isPersonalTask(
  userId: string,
  task: Pick<Task, "createdById" | "assignedToId">,
) {
  return task.createdById === userId && task.assignedToId === userId;
}
