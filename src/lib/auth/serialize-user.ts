import type { User } from "@/types";

export function serializeUserForJson(user: {
  id: string;
  email: string;
  role: User["role"];
  fullName: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    imageUrl: user.imageUrl ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
