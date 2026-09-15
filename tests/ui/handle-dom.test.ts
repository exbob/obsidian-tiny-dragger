import { describe, expect, it, vi } from "vitest";
import { setLocaleForTests } from "../../src/i18n";
import { createHandleElement } from "../../src/ui/handle-dom";

describe("createHandleElement", () => {
  it("routes grip pointerdown and insert clicks separately", () => {
    setLocaleForTests("en");
    const onGripPointerDown = vi.fn();
    const onInsertAbove = vi.fn();
    const onInsertBelow = vi.fn();
    const root = createHandleElement({
      onGripPointerDown,
      onInsertAbove,
      onInsertBelow,
    });
    expect(root.className).toContain("tiny-dragger-handle");
    const grip = root.querySelector(".tiny-dragger-grip") as HTMLElement;
    const above = root.querySelector(".tiny-dragger-insert-above") as HTMLElement;
    const below = root.querySelector(".tiny-dragger-insert-below") as HTMLElement;
    expect(grip.getAttribute("aria-label")).toBe("Drag block");
    grip.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    above.click();
    below.click();
    expect(onGripPointerDown).toHaveBeenCalledTimes(1);
    expect(onInsertAbove).toHaveBeenCalledTimes(1);
    expect(onInsertBelow).toHaveBeenCalledTimes(1);
  });
});
