import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FloatingAssistant } from "@/components/layout/floating-assistant";
import { TopBar } from "@/components/layout/top-bar";
import { AssistantProvider } from "@/components/providers/assistant-provider";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { TasksProvider } from "@/components/providers/tasks-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionUserId } from "@/lib/auth/session";
import { buildLoginUrl } from "@/lib/auth/route-guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect(buildLoginUrl("/calendar"));
  }

  return (
    <UserProvider>
      <TasksProvider>
        <NotificationsProvider>
          <AssistantProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <TopBar />
                <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                  {children}
                </main>
                <FloatingAssistant />
              </SidebarInset>
            </SidebarProvider>
          </AssistantProvider>
        </NotificationsProvider>
      </TasksProvider>
    </UserProvider>
  );
}
