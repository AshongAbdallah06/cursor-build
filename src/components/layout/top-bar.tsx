"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { mockClients, mockProvider, useUser } from "@/components/providers/user-provider";
import { useNotifications } from "@/components/providers/notifications-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopBar() {
  const { currentUser, switchUser, isProvider } = useUser();
  const { unreadCount } = useNotifications();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">
            {isProvider ? "Provider Dashboard" : "Client Portal"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isProvider
              ? "Manage all client requests and your schedule"
              : "Request time and track your tasks"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/notifications"
            aria-label="Notifications"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative",
            )}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="gap-2 px-2" />
              }
            >
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">
                    {getInitials(currentUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm sm:inline">
                  {currentUser.fullName}
                </span>
                <ChevronDown className="size-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span>{currentUser.fullName}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {currentUser.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch view (dev)
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => switchUser(mockProvider.id)}>
                  <UserCircle className="size-4" />
                  {mockProvider.fullName} (Provider)
                </DropdownMenuItem>
                {mockClients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => switchUser(client.id)}
                  >
                    <UserCircle className="size-4" />
                    {client.fullName} (Client)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
