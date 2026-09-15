import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { docFromText, lineRangeText } from "../../src/engine/doc";

describe("docFromText", () => {
  it("exposes 1-based lines and character offsets", () => {
    const doc = docFromText("aaa\nbbb\n");
    expect(doc.lines).toBe(3);
    expect(doc.line(1)).toEqual({ text: "aaa", from: 0, to: 3 });
    expect(doc.line(2)).toEqual({ text: "bbb", from: 4, to: 7 });
    expect(doc.lineAt(5).number).toBe(2);
    expect(doc.sliceString(0, 7)).toBe("aaa\nbbb");
    expect(lineRangeText(doc, { startLine: 1, endLine: 2 })).toBe("aaa\nbbb");
  });
});

describe("applyTextChanges", () => {
  it("applies patches from the end so earlier offsets stay valid", () => {
    expect(
      applyTextChanges("hello world", [
        { from: 0, to: 5, insert: "hey" },
        { from: 6, to: 11, insert: "there" },
      ]),
    ).toBe("hey there");
  });
});
