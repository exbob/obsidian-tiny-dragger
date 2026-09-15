import { selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { planBlockMove } from "../../src/engine/move";

describe("planBlockMove", () => {
  it("moves a paragraph below the next block without changing indent on small dx", () => {
    const text = "alpha\n\nbravo\n";
    const doc = docFromText(text);
    const origin = blockAtLine(doc, 1, 4)!;
    const edits = planBlockMove({
      doc,
      selection: selectOne(origin),
      hitLine: 3,
      belowMid: true,
      dx: 1,
      tabSize: 4,
      indentUnit: 4,
    });
    expect(edits).not.toBeNull();
    const next = edits!.reduce(
      (current, edit) => applyTextChanges(current, edit.changes),
      text,
    );
    const alpha = next.indexOf("alpha");
    const bravo = next.indexOf("bravo");
    expect(bravo).toBeGreaterThan(-1);
    expect(alpha).toBeGreaterThan(bravo);
  });

  it("returns null for a drop inside a fenced code block", () => {
    const text = "alpha\n\n```\ncode\n```\n";
    const doc = docFromText(text);
    const origin = blockAtLine(doc, 1, 4)!;
    const edits = planBlockMove({
      doc,
      selection: selectOne(origin),
      hitLine: 4,
      belowMid: false,
      dx: 0,
      tabSize: 4,
      indentUnit: 4,
    });
    expect(edits).toBeNull();
  });
});
