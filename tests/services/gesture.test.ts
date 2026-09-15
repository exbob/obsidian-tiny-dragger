import { describe, expect, it } from "vitest";
import {
  selectionLinesFromRange,
  shouldStartDrag,
} from "../../src/services/gesture";

describe("shouldStartDrag", () => {
  it("starts dragging only after a 4px hypot move", () => {
    expect(shouldStartDrag(3, 0)).toBe(false);
    expect(shouldStartDrag(4, 0)).toBe(false);
    expect(shouldStartDrag(5, 0)).toBe(true);
    expect(shouldStartDrag(3, 3)).toBe(true);
  });
});

describe("selectionLinesFromRange", () => {
  it("marks collapsed ranges so payload stays single-block", () => {
    expect(selectionLinesFromRange(4, 4, true)).toEqual({
      fromLine: 4,
      toLine: 4,
      collapsed: true,
    });
    expect(selectionLinesFromRange(1, 8, false).collapsed).toBe(false);
  });
});
