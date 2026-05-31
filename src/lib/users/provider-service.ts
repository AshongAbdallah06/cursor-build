import { prisma } from "@/lib/prisma";

export async function findLinkedProviderForClient(
  clientId: string,
): Promise<string | null> {
  const recentTask = await prisma.task.findFirst({
    where: { createdById: clientId },
    orderBy: { createdAt: "desc" },
    select: { assignedToId: true },
  });

  return recentTask?.assignedToId ?? null;
}

export async function resolveProviderForClient(clientId: string): Promise<string> {
  const providerId = await findLinkedProviderForClient(clientId);

  if (!providerId) {
    throw new Error(
      "No provider linked yet. Submit a request using a provider share link first.",
    );
  }

  return providerId;
}

export async function assertProviderExists(providerId: string) {
  const provider = await prisma.user.findUnique({
    where: { id: providerId },
  });

  if (!provider || provider.role !== "PROVIDER") {
    throw new Error("Provider not found");
  }

  return provider;
}

export async function assertTaskAssignedToProvider(
  providerId: string,
  assignedToId: string,
) {
  if (assignedToId !== providerId) {
    throw new Error("Task not found");
  }
}
