import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url });
  }

  const pool = new pg.Pool({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function isStaleClient(client: PrismaClient | undefined): boolean {
  if (!client) return false;
  // Recreate if schema was regenerated while the dev server kept running
  return typeof client.calendarIntegration === "undefined";
}

function getPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaDatabaseUrl === url &&
    !isStaleClient(globalForPrisma.prisma)
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaDatabaseUrl = url;
  }

  return client;
}

export const prisma = getPrismaClient();
