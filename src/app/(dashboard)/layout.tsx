import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { TasksProvider } from "@/components/providers/tasks-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <TasksProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <TopBar />
              <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </NotificationsProvider>
      </TasksProvider>
    </UserProvider>
  );
}
