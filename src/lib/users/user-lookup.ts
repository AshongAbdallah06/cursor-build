import { prisma } from "@/lib/prisma";

export async function getUserPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
  };
}

export async function assertUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function assertTaskAssignedToUser(
  userId: string,
  assignedToId: string,
) {
  if (assignedToId !== userId) {
    throw new Error("Task not found");
  }
}
