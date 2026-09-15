import type { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { dropLineY } from "../../src/services/drag-session";

describe("dropLineY", () => {
  it("includes scrollTop because the indicator is absolute inside the scroller", () => {
    const view = {
      documentTop: 50,
      lineBlockAt: () => ({ top: 100, bottom: 124 }),
      scrollDOM: {
        scrollTop: 80,
        getBoundingClientRect: () => ({ top: 40 }),
      },
    } as unknown as EditorView;
    expect(dropLineY(view, 0, false)).toBe(50 + 100 - 40 + 80);
    expect(dropLineY(view, 0, true)).toBe(50 + 124 - 40 + 80);
  });
});
