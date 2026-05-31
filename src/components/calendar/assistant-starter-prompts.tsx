"use client";

import {
  ASSISTANT_STARTER_PROMPT_GROUPS,
  type AssistantStarterPrompt,
} from "@/lib/ai/assistant-starter-prompts";
import { Button } from "@/components/ui/button";

interface AssistantStarterPromptsProps {
  disabled?: boolean;
  onSelect: (prompt: AssistantStarterPrompt) => void;
}

export function AssistantStarterPrompts({
  disabled = false,
  onSelect,
}: AssistantStarterPromptsProps) {
  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-medium text-muted-foreground">
        Try a starter
      </p>

      {ASSISTANT_STARTER_PROMPT_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.prompts.map((prompt) => (
              <Button
                key={prompt.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onSelect(prompt)}
                className="h-auto min-h-7 max-w-full px-2.5 py-1.5 text-left text-xs leading-snug font-normal whitespace-normal"
              >
                {prompt.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
