import type { AssistantChatMessage } from "@/lib/ai/types";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiGenerateRequest {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  tools?: Array<{
    functionDeclarations: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  }>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: GeminiContent;
  }>;
  error?: { message?: string };
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  };
}

function formatGeminiError(status: number, message: string | undefined): string {
  const normalized = message?.toLowerCase() ?? "";

  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("invalid authentication credentials") ||
    normalized.includes("api key not valid")
  ) {
    return "Invalid Gemini API key. Create one at https://aistudio.google.com/apikey and set GEMINI_API_KEY in .env (no AQ. prefix).";
  }

  if (status === 404 || normalized.includes("not found")) {
    return `Gemini model not found. Set GEMINI_MODEL to a valid model such as gemini-2.0-flash.`;
  }

  return message ?? "Gemini request failed";
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiConfig().apiKey);
}

export function toGeminiContents(messages: AssistantChatMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

export async function generateGeminiContent(
  request: GeminiGenerateRequest,
): Promise<GeminiContent> {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    throw new Error(
      "Gemini is not configured. Add GEMINI_API_KEY to your .env file.",
    );
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  const data = (await response.json()) as GeminiGenerateResponse;

  if (!response.ok) {
    throw new Error(formatGeminiError(response.status, data.error?.message));
  }

  const content = data.candidates?.[0]?.content;
  if (!content?.parts?.length) {
    throw new Error("Gemini returned an empty response");
  }

  return content;
}

export function getTextFromGeminiContent(content: GeminiContent): string {
  return (
    content.parts
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() || ""
  );
}

export function getFunctionCallsFromGeminiContent(content: GeminiContent) {
  return content.parts
    .filter((part) => part.functionCall?.name)
    .map((part) => part.functionCall!);
}
