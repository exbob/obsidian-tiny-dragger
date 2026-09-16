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
  };
}

describe("createHandleElement", () => {
  it("routes grip pointerdown and has no insert lines", () => {
    setLocaleForTests("en");
    const handlers = noopHandlers();
    const root = createHandleElement(handlers);
    expect(root.className).toContain("tiny-dragger-handle");
    const grip = root.querySelector(".tiny-dragger-grip") as HTMLElement;
    expect(root.querySelector(".tiny-dragger-insert")).toBeNull();
    expect(grip.getAttribute("aria-label")).toBe("Drag block");
    grip.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(handlers.onGripPointerDown).toHaveBeenCalledTimes(1);
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
      "-30px",
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

  it("vertically centers the handle on the first text line", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    expect(css).toMatch(
      /translateY\(\s*calc\(\s*0\.5lh\s*-\s*50%\s*\)\s*\)/,
    );
  });

  it("does not keep insert-line styles on the handle", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    expect(css).not.toMatch(/tiny-dragger-insert/);
  });

  it("draws larger, tighter grip dots", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    expect(css).not.toMatch(/\.tiny-dragger-dot\s*\{[^}]*width:\s*22%/);
    expect(css).toMatch(
      /\.tiny-dragger-dot\s*\{[^}]*width:\s*calc\(\s*var\(--tiny-dragger-handle-size/,
    );
    expect(css).toMatch(/\.tiny-dragger-grip\s*\{[^}]*gap:/);
  });

  it("uses a muted gray background on grip hover instead of a border", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../styles.css"),
      "utf8",
    );
    expect(css).not.toMatch(
      /\.tiny-dragger-grip:hover[^{]*\{[^}]*border-color:/,
    );
    expect(css).toMatch(
      /\.tiny-dragger-grip:hover[^{]*\{[^}]*background:\s*color-mix/,
    );
  });
});
