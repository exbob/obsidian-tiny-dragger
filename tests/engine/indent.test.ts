import { describe, expect, it } from "vitest";
import { indentWidthFromDx } from "../../src/engine/indent";

describe("indentWidthFromDx", () => {
  it("keeps indent when horizontal movement is below half a pixel step", () => {
    expect(indentWidthFromDx(4, 15, 4, 32)).toBe(4);
    expect(indentWidthFromDx(4, -15, 4, 32)).toBe(4);
  });

  it("moves by rounded pixel steps times indent columns and never goes negative", () => {
    expect(indentWidthFromDx(4, 32, 4, 32)).toBe(8);
    expect(indentWidthFromDx(4, -32, 4, 32)).toBe(0);
    expect(indentWidthFromDx(0, -64, 4, 32)).toBe(0);
  });

  it("does not treat pixel dx as indent columns", () => {
    expect(indentWidthFromDx(0, 32, 4, 32)).toBe(4);
    expect(indentWidthFromDx(4, 4, 2, 16)).toBe(4);
  });
});
