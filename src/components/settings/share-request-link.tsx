"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { buildPublicRequestUrl } from "@/lib/requests/public-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ShareRequestLinkCard() {
  const { currentUser, isProvider } = useUser();
  const [copied, setCopied] = useState(false);

  if (!isProvider) return null;

  const shareUrl = buildPublicRequestUrl(currentUser.id);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="size-5" />
          <CardTitle>Shareable request link</CardTitle>
        </div>
        <CardDescription>
          Send this link to anyone who needs you to perform a task. Submitted
          requests appear on your calendar and kanban board automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={shareUrl} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Requests are saved to the database and show up as pending tasks on
          your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
