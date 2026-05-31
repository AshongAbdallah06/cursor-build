import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import {
  MOCK_USER_IDS,
  mockNotifications,
  mockTasks,
  mockUsers,
} from "../src/lib/mock-data";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url });
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  for (const user of mockUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  for (const task of mockTasks) {
    await prisma.task.create({
      data: {
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
      },
    });
  }

  for (const notification of mockNotifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });
  }

  console.log(`Seeded ${mockUsers.length} users`);
  console.log(`Seeded ${mockTasks.length} tasks`);
  console.log(`Seeded ${mockNotifications.length} notifications`);
  console.log(`Provider ID: ${MOCK_USER_IDS.provider}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
