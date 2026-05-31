import { cookies } from "next/headers";

export const USER_SESSION_COOKIE = "caltask_user_id";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_SESSION_COOKIE)?.value ?? null;
}

export { getAppUrl } from "@/lib/app-url";
