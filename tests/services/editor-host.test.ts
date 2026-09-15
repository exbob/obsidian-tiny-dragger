import { describe, expect, it } from "vitest";
import { mergeChanges, readTabSize } from "../../src/services/editor-host";

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
