import type { Task, TaskPriority, TaskStatus, User } from "@/types";

type PrismaTaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  createdById: string;
  assignedToId: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  };
  assignedTo?: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function serializeUser(
  user: PrismaTaskWithRelations["createdBy"],
): User | undefined {
  if (!user) return undefined;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeTask(task: PrismaTaskWithRelations): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    startTime: task.startTime,
    endTime: task.endTime,
    createdById: task.createdById,
    assignedToId: task.assignedToId,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: serializeUser(task.createdBy),
    assignedTo: serializeUser(task.assignedTo),
  };
}

/** Parse task JSON from API responses (dates arrive as strings) */
export function parseTaskFromJson(task: Task): Task {
  return {
    ...task,
    startTime: new Date(task.startTime),
    endTime: new Date(task.endTime),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    createdBy: task.createdBy
      ? {
          ...task.createdBy,
          createdAt: new Date(task.createdBy.createdAt),
          updatedAt: new Date(task.createdBy.updatedAt),
        }
      : undefined,
    assignedTo: task.assignedTo
      ? {
          ...task.assignedTo,
          createdAt: new Date(task.assignedTo.createdAt),
          updatedAt: new Date(task.assignedTo.updatedAt),
        }
      : undefined,
  };
}

export function serializeTaskForJson(task: Task) {
  return {
    ...task,
    startTime: task.startTime.toISOString(),
    endTime: task.endTime.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    createdBy: task.createdBy
      ? {
          ...task.createdBy,
          createdAt: task.createdBy.createdAt.toISOString(),
          updatedAt: task.createdBy.updatedAt.toISOString(),
        }
      : undefined,
    assignedTo: task.assignedTo
      ? {
          ...task.assignedTo,
          createdAt: task.assignedTo.createdAt.toISOString(),
          updatedAt: task.assignedTo.updatedAt.toISOString(),
        }
      : undefined,
  };
}
