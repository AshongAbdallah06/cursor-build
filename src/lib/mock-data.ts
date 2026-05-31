import type { Notification, Task, User } from "@/types";

const now = new Date();
const startOfDay = (daysFromNow: number, hour: number, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// Fixed UUIDs for stable references across seed + mock data
export const MOCK_USER_IDS = {
  provider: "11111111-1111-1111-1111-111111111111",
  clientSarah: "22222222-2222-2222-2222-222222222222",
  clientMike: "33333333-3333-3333-3333-333333333333",
} as const;

export const mockUsers: User[] = [
  {
    id: MOCK_USER_IDS.provider,
    email: "alex.provider@example.com",
    role: "PROVIDER",
    fullName: "Alex Provider",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: MOCK_USER_IDS.clientSarah,
    email: "sarah.client@example.com",
    role: "CLIENT",
    fullName: "Sarah Client",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: MOCK_USER_IDS.clientMike,
    email: "mike.client@example.com",
    role: "CLIENT",
    fullName: "Mike Client",
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-02-01"),
  },
];

export const mockProvider = mockUsers[0];
export const mockClients = mockUsers.filter((u) => u.role === "CLIENT");

const userById = Object.fromEntries(mockUsers.map((u) => [u.id, u]));

export const mockTasks: Task[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Website redesign review",
    description: "Review the latest homepage mockups and provide feedback.",
    startTime: startOfDay(1, 10, 0),
    endTime: startOfDay(1, 11, 30),
    createdById: MOCK_USER_IDS.clientSarah,
    assignedToId: MOCK_USER_IDS.provider,
    status: "PENDING",
    priority: "HIGH",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userById[MOCK_USER_IDS.clientSarah],
    assignedTo: userById[MOCK_USER_IDS.provider],
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    title: "API integration call",
    description: "Walk through the REST API endpoints for the mobile app.",
    startTime: startOfDay(2, 14, 0),
    endTime: startOfDay(2, 15, 0),
    createdById: MOCK_USER_IDS.clientMike,
    assignedToId: MOCK_USER_IDS.provider,
    status: "ACCEPTED",
    priority: "MEDIUM",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userById[MOCK_USER_IDS.clientMike],
    assignedTo: userById[MOCK_USER_IDS.provider],
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    title: "Brand guidelines update",
    description: "Finalize color palette and typography for the brand book.",
    startTime: startOfDay(0, 9, 0),
    endTime: startOfDay(0, 10, 30),
    createdById: MOCK_USER_IDS.clientSarah,
    assignedToId: MOCK_USER_IDS.provider,
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userById[MOCK_USER_IDS.clientSarah],
    assignedTo: userById[MOCK_USER_IDS.provider],
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    title: "Quarterly strategy session",
    description: "Completed Q1 planning and roadmap alignment.",
    startTime: startOfDay(-2, 13, 0),
    endTime: startOfDay(-2, 14, 30),
    createdById: MOCK_USER_IDS.clientMike,
    assignedToId: MOCK_USER_IDS.provider,
    status: "COMPLETED",
    priority: "LOW",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userById[MOCK_USER_IDS.clientMike],
    assignedTo: userById[MOCK_USER_IDS.provider],
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    title: "Personal: Team standup prep",
    description: "Provider-only personal block.",
    startTime: startOfDay(1, 9, 0),
    endTime: startOfDay(1, 9, 30),
    createdById: MOCK_USER_IDS.provider,
    assignedToId: MOCK_USER_IDS.provider,
    status: "ACCEPTED",
    priority: "LOW",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userById[MOCK_USER_IDS.provider],
    assignedTo: userById[MOCK_USER_IDS.provider],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "f1111111-1111-1111-1111-111111111111",
    userId: MOCK_USER_IDS.provider,
    message:
      'Client Sarah Client has added a new task: "Website redesign review"',
    type: "TASK_ADDED",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    userId: MOCK_USER_IDS.provider,
    message: 'Deadline approaching: "Brand guidelines update" in 2 hours',
    type: "DEADLINE_APPROACHING",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: "f3333333-3333-3333-3333-333333333333",
    userId: MOCK_USER_IDS.clientSarah,
    message: '"Brand guidelines update" has been updated to In Progress',
    type: "STATUS_CHANGED",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: "f4444444-4444-4444-4444-444444444444",
    userId: MOCK_USER_IDS.clientMike,
    message: '"API integration call" has been updated to Accepted',
    type: "STATUS_CHANGED",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
];

/** Tasks visible to a given user based on role */
export function getTasksForUser(userId: string, role: User["role"]): Task[] {
  if (role === "PROVIDER") {
    return mockTasks;
  }
  return mockTasks.filter((t) => t.createdById === userId);
}

/** Busy slots for client view — other clients' tasks without details */
export function getBusySlotsForClient(clientId: string): {
  id: string;
  startTime: Date;
  endTime: Date;
}[] {
  return mockTasks
    .filter((t) => t.createdById !== clientId)
    .map((t) => ({
      id: `busy-${t.id}`,
      startTime: t.startTime,
      endTime: t.endTime,
    }));
}

/** Unread notification count for a user */
export function getUnreadNotificationCount(userId: string): number {
  return mockNotifications.filter((n) => n.userId === userId && !n.isRead)
    .length;
}
