import { t } from "../i18n";
import { handleCssColor, type TinyDraggerSettings } from "../settings";

export interface HandleDomHandlers {
  onGripPointerDown: (event: PointerEvent) => void;
  onInsertAbove: (event: MouseEvent) => void;
  onInsertBelow: (event: MouseEvent) => void;
}

export function applyHandleAppearance(
  el: HTMLElement,
  settings: TinyDraggerSettings,
): void {
  el.style.setProperty("--tiny-dragger-handle-size", `${settings.handleSize}px`);
  el.style.setProperty("--tiny-dragger-handle-color", handleCssColor(settings));
  el.style.setProperty(
    "--tiny-dragger-handle-offset",
    `${settings.handleOffset}px`,
  );
}

export function createHandleElement(handlers: HandleDomHandlers): HTMLElement {
  const root = document.createElement("div");
  root.className = "tiny-dragger-handle";

  const above = document.createElement("button");
  above.type = "button";
  above.className = "tiny-dragger-insert tiny-dragger-insert-above";
  above.setAttribute("aria-label", t("handle.insertAbove"));
  above.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onInsertAbove(event);
  });

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

  const below = document.createElement("button");
  below.type = "button";
  below.className = "tiny-dragger-insert tiny-dragger-insert-below";
  below.setAttribute("aria-label", t("handle.insertBelow"));
  below.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onInsertBelow(event);
  });

  root.append(above, grip, below);
  return root;
}
