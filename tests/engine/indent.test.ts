import { describe, expect, it } from "vitest";
import { indentWidthFromDx } from "../../src/engine/indent";

describe("indentWidthFromDx", () => {
  it("keeps indent when horizontal movement is below half a step", () => {
    expect(indentWidthFromDx(4, 1, 4)).toBe(4);
    expect(indentWidthFromDx(4, -1, 4)).toBe(4);
  });

  it("moves by rounded indent steps and never goes negative", () => {
    expect(indentWidthFromDx(4, 4, 4)).toBe(8);
    expect(indentWidthFromDx(4, -4, 4)).toBe(0);
    expect(indentWidthFromDx(0, -8, 4)).toBe(0);
  });
});
