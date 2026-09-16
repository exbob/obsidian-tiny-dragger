import type {} from "obsidian";
import { t } from "../i18n";
import { handleCssColor, handleCssOffset, type TinyDraggerSettings } from "../settings";

export interface HandleDomHandlers {
  onGripPointerDown: (event: PointerEvent) => void;
}

export function applyHandleAppearance(
  el: HTMLElement,
  settings: TinyDraggerSettings,
): void {
  el.setCssProps({
    "--tiny-dragger-handle-size": `${settings.handleSize}px`,
    "--tiny-dragger-handle-color": handleCssColor(settings),
    "--tiny-dragger-handle-offset": handleCssOffset(settings),
  });
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
  el.setCssProps({
    "--tiny-dragger-handle-nudge-y": `calc(${firstLineHeightPx / 2}px - 50%)`,
  });
}

export function createHandleElement(handlers: HandleDomHandlers): HTMLElement {
  const root = createEl("div", { cls: "tiny-dragger-handle" });

  const grip = root.createEl("button", {
    cls: "tiny-dragger-grip",
    attr: {
      type: "button",
      "aria-label": t("handle.grip"),
    },
  });
  grip.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onGripPointerDown(event);
  });
  for (let i = 0; i < 4; i++) {
    grip.createEl("span", { cls: "tiny-dragger-dot" });
  }

  return root;
}
