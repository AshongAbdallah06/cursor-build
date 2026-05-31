import { Suspense } from "react";
import {
  TaskRequestPageContent,
  TaskRequestPageHeader,
} from "@/components/request/task-request-page";
import { Loader2 } from "lucide-react";

export default function PublicRequestPage() {
  return (
    <div className="min-h-full bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <TaskRequestPageHeader />
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          }
        >
          <TaskRequestPageContent />
        </Suspense>
      </div>
    </div>
  );
}
