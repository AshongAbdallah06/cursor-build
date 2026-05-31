import { getAppUrl } from "@/lib/app-url";

export function buildPublicRequestUrl(providerId: string): string {
  const base = getAppUrl();
  return `${base}/request?provider=${providerId}`;
}
