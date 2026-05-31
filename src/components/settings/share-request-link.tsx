"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/components/providers/user-provider";
import { buildPublicRequestUrl } from "@/lib/requests/public-request";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ShareRequestLinkCard() {
  const { currentUser } = useUser();
  const [copied, setCopied] = useState(false);

  const shareUrl = buildPublicRequestUrl(currentUser.id);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4" />
          Shareable request link
        </CardTitle>
        <CardDescription>
          Anyone with this link can request time on your calendar. Their request
          is assigned to you automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Input readOnly value={shareUrl} className="font-mono text-xs" />
        <Button type="button" variant="outline" onClick={() => void handleCopy()}>
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </CardContent>
    </Card>
  );
}
