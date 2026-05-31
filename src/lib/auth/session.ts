import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_MAX_AGE_SECONDS,
  USER_SESSION_COOKIE,
} from "@/lib/auth/constants";
import { getUserById } from "@/lib/auth/user-auth";

export { USER_SESSION_COOKIE } from "@/lib/auth/constants";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getUserById(userId);
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(USER_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export { getAppUrl } from "@/lib/app-url";
