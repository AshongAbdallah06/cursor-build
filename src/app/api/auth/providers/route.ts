import { NextResponse } from "next/server";
import { getConfiguredAuthProviders } from "@/lib/auth/providers/registry";

export async function GET() {
  const providers = getConfiguredAuthProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
  }));

  return NextResponse.json({ providers });
}
