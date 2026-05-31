import type { TaskPriority, TaskStatus } from "@/types";

export const APP_NAME = "CalTask";

export const NAV_ITEMS = [
  { title: "Calendar", href: "/calendar", icon: "Calendar" as const },
  { title: "Tasks", href: "/tasks", icon: "LayoutGrid" as const },
  { title: "Notifications", href: "/notifications", icon: "Bell" as const },
  { title: "Settings", href: "/settings", icon: "Settings" as const },
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

/** Calendar event colors keyed by status (Phase 2+) */
export const TASK_STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; border: string; text: string }
> = {
  PENDING: {
    bg: "bg-yellow-100 dark:bg-yellow-950/40",
    border: "border-yellow-500",
    text: "text-yellow-900 dark:text-yellow-200",
  },
  ACCEPTED: {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    border: "border-sky-500",
    text: "text-sky-900 dark:text-sky-200",
  },
  IN_PROGRESS: {
    bg: "bg-blue-100 dark:bg-blue-950/40",
    border: "border-blue-500",
    text: "text-blue-900 dark:text-blue-200",
  },
  COMPLETED: {
    bg: "bg-green-100 dark:bg-green-950/40",
    border: "border-green-500",
    text: "text-green-900 dark:text-green-200",
  },
  DECLINED: {
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-500",
    text: "text-red-900 dark:text-red-200",
  },
};

export const TASK_PRIORITY_COLORS: Record<
  TaskPriority,
  { bg: string; border: string }
> = {
  LOW: { bg: "bg-slate-100", border: "border-slate-400" },
  MEDIUM: { bg: "bg-orange-100", border: "border-orange-400" },
  HIGH: { bg: "bg-red-100", border: "border-red-500" },
};

export const PROVIDER_STATUS_FLOW: TaskStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];

/** FullCalendar event colors (hex) keyed by status */
export const TASK_STATUS_EVENT_COLORS: Record<
  TaskStatus,
  { bg: string; border: string; text: string }
> = {
  PENDING: { bg: "#fef9c3", border: "#eab308", text: "#713f12" },
  ACCEPTED: { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" },
  IN_PROGRESS: { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" },
  COMPLETED: { bg: "#dcfce7", border: "#22c55e", text: "#14532d" },
  DECLINED: { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" },
};

export const BUSY_SLOT_EVENT_COLORS = {
  bg: "#f3f4f6",
  border: "#9ca3af",
  text: "#4b5563",
};

export const HIGH_PRIORITY_BORDER = "#ef4444";

/** Google Calendar synced events */
export const GOOGLE_CALENDAR_EVENT_COLORS = {
  bg: "#ede9fe",
  border: "#7c3aed",
  text: "#4c1d95",
};

/** Provider Google events shown as busy to clients */
export const GOOGLE_BUSY_EVENT_COLORS = {
  bg: "#f5f5f4",
  border: "#78716c",
  text: "#57534e",
};
