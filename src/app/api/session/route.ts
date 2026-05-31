import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionUser,
} from "@/lib/auth/session";
import { serializeUserForJson } from "@/lib/auth/serialize-user";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: serializeUserForJson(user) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
