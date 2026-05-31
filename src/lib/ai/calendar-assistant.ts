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
} from "@/lib/ai/types";
import { getGoogleIntegrationStatus } from "@/lib/integrations/calendar-integration";
import { prisma } from "@/lib/prisma";

const MAX_TOOL_ROUNDS = 5;

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
    userRole: user.role,
    now: new Date(),
    googleConnected: googleStatus.connected && googleStatus.syncEnabled,
  });

  let contents: GeminiContent[] = toGeminiContents(messages);
  let calendarUpdated = false;
  let finalMessage = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await generateGeminiContent({
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
        const { result, calendarUpdated: updated } = await executeCalendarTool(
          userId,
          call.name,
          call.args ?? {},
        );
        if (updated) calendarUpdated = true;

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
    const followUp = await generateGeminiContent({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    });
    finalMessage = getTextFromGeminiContent(followUp);
  }

  if (!finalMessage) {
    finalMessage = calendarUpdated
      ? "Done — your calendar has been updated."
      : "I'm here to help plan your calendar. What would you like to schedule?";
  }

  return { message: finalMessage, calendarUpdated };
}
