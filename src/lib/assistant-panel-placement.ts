export type AssistantPanelVertical = "below" | "above";
export type AssistantPanelHorizontal = "start" | "end";

export interface AssistantPanelPlacement {
  vertical: AssistantPanelVertical;
  horizontal: AssistantPanelHorizontal;
  maxPanelHeight: number;
}

const MARGIN_PX = 8;
const GAP_PX = 12;
const FAB_SIZE_PX = 48;
const PANEL_WIDTH_PX = 380;
const PANEL_HEIGHT_PX = 560;

export function getAssistantPanelWidth(viewportWidth = window.innerWidth) {
  return Math.min(PANEL_WIDTH_PX, viewportWidth - 32);
}

export function getAssistantPanelHeight(viewportHeight = window.innerHeight) {
  return Math.min(PANEL_HEIGHT_PX, viewportHeight - 96);
}

function getVerticalSpace(fabRect: Pick<DOMRect, "top" | "bottom">) {
  return {
    below: window.innerHeight - fabRect.bottom - MARGIN_PX - GAP_PX,
    above: fabRect.top - MARGIN_PX - GAP_PX,
  };
}

function chooseVertical(
  spaceBelow: number,
  spaceAbove: number,
  preferredHeight: number,
): AssistantPanelVertical {
  const fitsBelow = spaceBelow >= preferredHeight;
  const fitsAbove = spaceAbove >= preferredHeight;

  if (fitsBelow && !fitsAbove) return "below";
  if (fitsAbove && !fitsBelow) return "above";
  if (fitsBelow && fitsAbove) {
    return spaceBelow >= spaceAbove ? "below" : "above";
  }

  return spaceAbove > spaceBelow ? "above" : "below";
}

export function computeAssistantPanelPlacement(
  fabRect: Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">,
  panelWidth: number,
  panelHeight = getAssistantPanelHeight(),
): AssistantPanelPlacement {
  const { below: spaceBelow, above: spaceAbove } = getVerticalSpace(fabRect);
  const vertical = chooseVertical(spaceBelow, spaceAbove, panelHeight);

  const spaceRight = window.innerWidth - fabRect.right - MARGIN_PX;
  const spaceLeft = fabRect.left - MARGIN_PX;

  const fitsEnd = fabRect.right - panelWidth >= MARGIN_PX;
  const fitsStart = fabRect.left + panelWidth <= window.innerWidth - MARGIN_PX;

  let horizontal: AssistantPanelHorizontal = "end";
  if (fitsEnd && !fitsStart) {
    horizontal = "end";
  } else if (fitsStart && !fitsEnd) {
    horizontal = "start";
  } else if (!fitsEnd && !fitsStart) {
    horizontal = spaceRight >= spaceLeft ? "end" : "start";
  } else {
    horizontal = spaceRight >= spaceLeft ? "end" : "start";
  }

  const availableSpace = vertical === "below" ? spaceBelow : spaceAbove;
  const maxPanelHeight = Math.max(
    160,
    Math.min(panelHeight, availableSpace),
  );

  return { vertical, horizontal, maxPanelHeight };
}

export function clampFabPositionForPanel(
  x: number,
  y: number,
  placement: AssistantPanelPlacement,
  open: boolean,
  panelWidth = getAssistantPanelWidth(),
): { x: number; y: number } {
  if (!open) {
    return {
      x: Math.min(
        Math.max(MARGIN_PX, x),
        Math.max(MARGIN_PX, window.innerWidth - FAB_SIZE_PX - MARGIN_PX),
      ),
      y: Math.min(
        Math.max(MARGIN_PX, y),
        Math.max(MARGIN_PX, window.innerHeight - FAB_SIZE_PX - MARGIN_PX),
      ),
    };
  }

  const panelHeight = placement.maxPanelHeight;

  let left: number;
  let right: number;

  if (placement.horizontal === "end") {
    right = x + FAB_SIZE_PX;
    left = x + FAB_SIZE_PX - panelWidth;
  } else {
    left = x;
    right = x + panelWidth;
  }

  let top: number;
  let bottom: number;

  if (placement.vertical === "below") {
    top = y;
    bottom = y + FAB_SIZE_PX + GAP_PX + panelHeight;
  } else {
    top = y - GAP_PX - panelHeight;
    bottom = y + FAB_SIZE_PX;
  }

  let newX = x;
  let newY = y;

  if (left < MARGIN_PX) {
    newX += MARGIN_PX - left;
  }
  if (right > window.innerWidth - MARGIN_PX) {
    newX -= right - (window.innerWidth - MARGIN_PX);
  }
  if (top < MARGIN_PX) {
    newY += MARGIN_PX - top;
  }
  if (bottom > window.innerHeight - MARGIN_PX) {
    newY -= bottom - (window.innerHeight - MARGIN_PX);
  }

  const minY =
    placement.vertical === "above"
      ? MARGIN_PX + GAP_PX + panelHeight
      : MARGIN_PX;
  const maxY =
    placement.vertical === "below"
      ? window.innerHeight - MARGIN_PX - FAB_SIZE_PX - GAP_PX - panelHeight
      : window.innerHeight - MARGIN_PX - FAB_SIZE_PX;

  return {
    x: Math.min(
      Math.max(MARGIN_PX, newX),
      Math.max(MARGIN_PX, window.innerWidth - FAB_SIZE_PX - MARGIN_PX),
    ),
    y: Math.min(Math.max(minY, newY), Math.max(minY, maxY)),
  };
}

export function resolveAssistantLayout(
  x: number,
  y: number,
  open: boolean,
): {
  placement: AssistantPanelPlacement;
  position: { x: number; y: number };
} {
  const panelWidth = getAssistantPanelWidth();
  const panelHeight = getAssistantPanelHeight();

  const fabRect = {
    left: x,
    top: y,
    right: x + FAB_SIZE_PX,
    bottom: y + FAB_SIZE_PX,
    width: FAB_SIZE_PX,
    height: FAB_SIZE_PX,
  };

  const placement = computeAssistantPanelPlacement(
    fabRect,
    panelWidth,
    panelHeight,
  );

  return {
    placement,
    position: clampFabPositionForPanel(x, y, placement, open, panelWidth),
  };
}
