import { selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine } from "../../src/engine/blocks";
import { planBlockDelete } from "../../src/engine/delete";
import { docFromText } from "../../src/engine/doc";

describe("planBlockDelete", () => {
  it("removes the selected block", () => {
    const text = "keep\n\ngone\n";
    const doc = docFromText(text);
    const block = blockAtLine(doc, 3, 4);
    if (block === null) {
      throw new Error("expected a block");
    }
    const edit = planBlockDelete(doc, selectOne(block));
    expect(edit).not.toBeNull();
    const next = applyTextChanges(text, edit!.changes);
    expect(next).not.toContain("gone");
    expect(next).toContain("keep");
  });
});
