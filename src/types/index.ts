export type TaskStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type NotificationType =
  | "TASK_ADDED"
  | "STATUS_CHANGED"
  | "DEADLINE_APPROACHING";

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
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
  createdBy?: User;
  assignedTo?: User;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

/** Busy slot shown to clients without revealing other clients' task details */
export interface BusySlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

export interface TaskFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  startTime: string | Date;
  endTime: string | Date;
  allDay: boolean;
  source: "google";
  hideDetails?: boolean;
}

export interface GoogleIntegrationStatus {
  connected: boolean;
  provider: "GOOGLE";
  calendarEmail: string | null;
  syncEnabled: boolean;
  connectedAt: string | null;
  configured?: boolean;
  error?: string;
  message?: string;
}
