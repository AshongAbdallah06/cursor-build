import {
  buildAssistantSystemPrompt,
  CALENDAR_ASSISTANT_TOOLS,
  executeCalendarTool,
} from "@/lib/ai/calendar-tools";
import {
  generateGeminiContent,
  getFunctionCallsFromGeminiContent,
  getTextFromGeminiContent,
  toGeminiContents,
  type GeminiContent,
} from "@/lib/ai/gemini-client";
import type {
  AssistantChatMessage,
  AssistantChatResponse,
  AssistantScheduleDraft,
} from "@/lib/ai/types";
import { getGoogleIntegrationStatus } from "@/lib/integrations/calendar-integration";
import { prisma } from "@/lib/prisma";

const MAX_TOOL_ROUNDS = 5;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateGeminiContentWithRetry(
  params: any,
  retries = 3,
  delayMs = 2000
): Promise<any> {
  try {
    return await generateGeminiContent(params);
  } catch (error: any) {
    const isRateLimit = 
      error?.message?.toLowerCase().includes("quota exceeded") || 
      error?.message?.toLowerCase().includes("429");

    if (isRateLimit && retries > 0) {
      console.warn(`[Gemini Rate Limit] Hit quota limit. Retrying in ${delayMs / 1000}s... (${retries} retries left)`);
      await delay(delayMs);
      // Exponentially increase the delay for the next potential retry
      return generateGeminiContentWithRetry(params, retries - 1, delayMs * 2);
    }
    // If it's a different error or we ran out of retries, throw it
    throw error;
  }
}

export async function runCalendarAssistantChat(
  userId: string,
  messages: AssistantChatMessage[],
): Promise<AssistantChatResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const googleStatus = await getGoogleIntegrationStatus(userId);
  const systemInstruction = buildAssistantSystemPrompt({
    userName: user.fullName,
    now: new Date(),
    googleConnected: googleStatus.connected && googleStatus.syncEnabled,
  });

  let contents: GeminiContent[] = toGeminiContents(messages);
  let calendarUpdated = false;
  let pendingDraft: AssistantScheduleDraft | undefined;
  let finalMessage = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Swapped native function with our new retry mechanism
    const response = await generateGeminiContentWithRetry({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      tools: [{ functionDeclarations: CALENDAR_ASSISTANT_TOOLS }],
    });

    const functionCalls = getFunctionCallsFromGeminiContent(response);

    if (functionCalls.length === 0) {
      finalMessage = getTextFromGeminiContent(response);
      break;
    }

    contents = [...contents, response];

    for (const call of functionCalls) {
      try {
        const { result, calendarUpdated: updated, pendingDraft: draft } =
          await executeCalendarTool(userId, call.name, call.args ?? {});
        if (updated) calendarUpdated = true;
        if (draft) pendingDraft = draft;

        contents = [
          ...contents,
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: result,
                },
              },
            ],
          },
        ];
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Tool execution failed";

        contents = [
          ...contents,
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: { error: errorMessage },
                },
              },
            ],
          },
        ];
      }
    }
  }

  if (!finalMessage) {
    // Swapped native function with our new retry mechanism here as well
    const followUp = await generateGeminiContentWithRetry({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    });
    finalMessage = getTextFromGeminiContent(followUp);
  }

  if (!finalMessage) {
    finalMessage = pendingDraft
      ? "I've drafted that for you — review the details below and tap Confirm and Add when you're ready."
      : calendarUpdated
        ? "Done — your calendar has been updated."
        : "I'm here to help plan your calendar. What would you like to schedule?";
  }

  return { message: finalMessage, calendarUpdated, pendingDraft };
}