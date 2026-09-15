import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { planInsertBlankLine } from "../../src/engine/insert-line";

describe("planInsertBlankLine", () => {
  it("inserts an empty line above or below the block", () => {
    const text = "hello\n";
    const doc = docFromText(text);
    const block = blockAtLine(doc, 1, 4)!;
    const above = applyTextChanges(text, [planInsertBlankLine(doc, block, "above")]);
    const below = applyTextChanges(text, [planInsertBlankLine(doc, block, "below")]);
    expect(above.startsWith("\n")).toBe(true);
    expect(below).toMatch(/hello\n\n/);
  });
});
