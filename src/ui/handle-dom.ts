import { t } from "../i18n";
import { handleCssColor, handleCssOffset, type TinyDraggerSettings } from "../settings";

export interface HandleDomHandlers {
  onGripPointerDown: (event: PointerEvent) => void;
}

export function applyHandleAppearance(
  el: HTMLElement,
  settings: TinyDraggerSettings,
): void {
  el.style.setProperty("--tiny-dragger-handle-size", `${settings.handleSize}px`);
  el.style.setProperty("--tiny-dragger-handle-color", handleCssColor(settings));
  el.style.setProperty("--tiny-dragger-handle-offset", handleCssOffset(settings));
}

export function applyHandleLineAlign(
  el: HTMLElement,
  firstLineHeightPx: number | null,
): void {
  if (
    firstLineHeightPx === null ||
    !Number.isFinite(firstLineHeightPx) ||
    firstLineHeightPx <= 0
  ) {
    el.style.removeProperty("--tiny-dragger-handle-nudge-y");
    return;
  }
  el.style.setProperty(
    "--tiny-dragger-handle-nudge-y",
    `calc(${firstLineHeightPx / 2}px - 50%)`,
  );
}

export function createHandleElement(handlers: HandleDomHandlers): HTMLElement {
  const root = document.createElement("div");
  root.className = "tiny-dragger-handle";

  const grip = document.createElement("button");
  grip.type = "button";
  grip.className = "tiny-dragger-grip";
  grip.setAttribute("aria-label", t("handle.grip"));
  grip.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onGripPointerDown(event);
  });
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("span");
    dot.className = "tiny-dragger-dot";
    grip.append(dot);
  }

  root.append(grip);
  return root;
}
