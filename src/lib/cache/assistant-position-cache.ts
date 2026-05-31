const STORAGE_KEY = "caltask-assistant-position";
const MARGIN_PX = 8;

export interface AssistantPosition {
  x: number;
  y: number;
}

export function loadAssistantPosition(): AssistantPosition | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AssistantPosition;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveAssistantPosition(position: AssistantPosition) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function getDefaultAssistantPosition(
  width: number,
  height: number,
): AssistantPosition {
  return clampAssistantPosition(
    window.innerWidth - width - 24,
    16,
    width,
    height,
  );
}

export function clampAssistantPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): AssistantPosition {
  const maxX = Math.max(MARGIN_PX, window.innerWidth - width - MARGIN_PX);
  const maxY = Math.max(MARGIN_PX, window.innerHeight - height - MARGIN_PX);

  return {
    x: Math.min(Math.max(MARGIN_PX, x), maxX),
    y: Math.min(Math.max(MARGIN_PX, y), maxY),
  };
}
