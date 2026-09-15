import { describe, expect, it } from "vitest";
import {
  mergeChanges,
  readTabSize,
  selectionToLines,
} from "../../src/services/editor-host";

/** Simulated `aaa\nbbb\nccc`: line 1 ends at 3, line 2 at 7, line 3 at 11. */
function lineAt(pos: number): { number: number } {
  if (pos <= 3) {
    return { number: 1 };
  }
  if (pos <= 7) {
    return { number: 2 };
  }
  return { number: 3 };
}

describe("selectionToLines", () => {
  it("does not include the following block when exclusive to sits at the next line start", () => {
    expect(selectionToLines(0, 8, false, lineAt)).toEqual({
      fromLine: 1,
      toLine: 2,
      collapsed: false,
    });
  });

  it("keeps the caret line for empty selections", () => {
    expect(selectionToLines(8, 8, true, lineAt)).toEqual({
      fromLine: 3,
      toLine: 3,
      collapsed: true,
    });
  });
});

describe("readTabSize", () => {
  it("falls back to 4 when tabSize is missing", () => {
    expect(readTabSize({ state: {} } as never)).toBe(4);
    expect(readTabSize({ state: { tabSize: 2 } } as never)).toBe(2);
  });
});

describe("mergeChanges", () => {
  it("returns a from-descending copy so overlapping patches apply safely", () => {
    const earlier = { from: 1, to: 2, insert: "a" };
    const later = { from: 10, to: 12, insert: "b" };
    const merged = mergeChanges([earlier, later]);
    expect(merged).toEqual([later, earlier]);
    expect(merged).not.toBe([earlier, later]);
    expect(mergeChanges([earlier, later])[0]).toBe(later);
  });
});
