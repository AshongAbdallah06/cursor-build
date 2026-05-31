import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { buildLoginUrl } from "@/lib/auth/route-guards";

export default async function HomePage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect(buildLoginUrl("/calendar"));
  }

  redirect("/calendar");
}
