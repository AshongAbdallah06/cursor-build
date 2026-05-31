"use client";

import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";

function ShellSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      className={cn(
        "bg-muted-foreground/20 ring-1 ring-border/70 dark:bg-muted-foreground/25",
        className,
      )}
      {...props}
    />
  );
}

function NavItemSkeleton() {
  return (
    <SidebarMenuItem>
      <div className="flex h-8 items-center gap-2 rounded-md px-2">
        <ShellSkeleton className="size-4 shrink-0 rounded-sm" />
        <ShellSkeleton className="h-4 flex-1 max-w-[7rem]" />
      </div>
    </SidebarMenuItem>
  );
}

function MainContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <ShellSkeleton className="h-8 w-48 max-w-full" />
        <ShellSkeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ShellSkeleton className="h-9 w-24" />
        <ShellSkeleton className="h-9 w-28" />
        <ShellSkeleton className="h-9 w-20" />
      </div>

      <ShellSkeleton className="h-[min(650px,60vh)] w-full rounded-xl" />
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
                  <ShellSkeleton className="h-4 w-20" />
                  <ShellSkeleton className="h-3 w-24" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 4 }).map((_, index) => (
                  <NavItemSkeleton key={index} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="space-y-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
            <ShellSkeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <ShellSkeleton className="h-5 w-16 rounded-full" />
              <ShellSkeleton className="h-3 w-28" />
            </div>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <ShellSkeleton className="size-7 rounded-md" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="space-y-1.5">
              <ShellSkeleton className="h-4 w-36" />
              <ShellSkeleton className="hidden h-3 w-52 sm:block" />
            </div>

            <div className="flex items-center gap-2">
              <ShellSkeleton className="size-9 rounded-md" />
              <ShellSkeleton className="size-9 rounded-md" />
              <ShellSkeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <MainContentSkeleton />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
