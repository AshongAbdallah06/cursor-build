import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/auth/session";
import { mockUsers } from "@/lib/mock-data";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string };
  const userId = body.userId;

  if (!userId || !mockUsers.some((user) => user.id === userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, userId });
  response.cookies.set(USER_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_SESSION_COOKIE)?.value ?? null;
  return NextResponse.json({ userId });
}
