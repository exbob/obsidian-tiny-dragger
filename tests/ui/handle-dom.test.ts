import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocaleForTests } from "../../src/i18n";
import { DEFAULT_SETTINGS, THEME_HANDLE_COLOR } from "../../src/settings";
import {
  applyHandleAppearance,
  createHandleElement,
} from "../../src/ui/handle-dom";

function noopHandlers() {
  return {
    onGripPointerDown: vi.fn(),
    onInsertAbove: vi.fn(),
    onInsertBelow: vi.fn(),
  };
}

describe("createHandleElement", () => {
  it("routes grip pointerdown and insert clicks separately", () => {
    setLocaleForTests("en");
    const handlers = noopHandlers();
    const root = createHandleElement(handlers);
    expect(root.className).toContain("tiny-dragger-handle");
    const grip = root.querySelector(".tiny-dragger-grip") as HTMLElement;
    const above = root.querySelector(".tiny-dragger-insert-above") as HTMLElement;
    const below = root.querySelector(".tiny-dragger-insert-below") as HTMLElement;
    expect(grip.getAttribute("aria-label")).toBe("Drag block");
    grip.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    above.click();
    below.click();
    expect(handlers.onGripPointerDown).toHaveBeenCalledTimes(1);
    expect(handlers.onInsertAbove).toHaveBeenCalledTimes(1);
    expect(handlers.onInsertBelow).toHaveBeenCalledTimes(1);
  });
});

describe("applyHandleAppearance", () => {
  it("writes the theme accent variable onto the handle", () => {
    const el = document.createElement("div");
    applyHandleAppearance(el, DEFAULT_SETTINGS);
    expect(el.style.getPropertyValue("--tiny-dragger-handle-color")).toBe(
      THEME_HANDLE_COLOR,
    );
  });

  it("writes the custom hex onto the handle", () => {
    const el = document.createElement("div");
    applyHandleAppearance(el, {
      ...DEFAULT_SETTINGS,
      handleColorMode: "custom",
      handleColor: "#aabbcc",
    });
    expect(el.style.getPropertyValue("--tiny-dragger-handle-color")).toBe(
      "#aabbcc",
    );
  });

  it("pulls the handle left of the text without reserving a gutter column", () => {
    const el = document.createElement("div");
    applyHandleAppearance(el, DEFAULT_SETTINGS);
    expect(el.style.getPropertyValue("--tiny-dragger-handle-offset")).toBe(
      "-28px",
    );
  });
});

describe("handle icon paint", () => {
  afterEach(() => {
    document
      .querySelectorAll("style[data-tiny-dragger-test], .tiny-dragger-handle")
      .forEach((el) => el.remove());
  });

  it("paints dots from the handle color variable, not button text color", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    const style = document.createElement("style");
    style.dataset.tinyDraggerTest = "styles";
    style.textContent = `button { color: #111111 !important; }\n${css}`;
    document.head.append(style);

    const root = createHandleElement(noopHandlers());
    applyHandleAppearance(root, {
      ...DEFAULT_SETTINGS,
      handleColorMode: "custom",
      handleColor: "#ff00aa",
    });
    document.body.append(root);

    const dot = root.querySelector(".tiny-dragger-dot") as HTMLElement;
    const background = getComputedStyle(dot).backgroundColor;
    expect(background.toLowerCase()).toBe("#ff00aa");
  });

  it("does not reserve a full handle-width column in the gutter", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    expect(css).toMatch(/\.tiny-dragger-gutter\s*\{[^}]*width:\s*0/);
    expect(css).toMatch(/\.tiny-dragger-gutter\s*\{[^}]*position:\s*absolute/);
  });
});
