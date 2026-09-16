import { BlockType, selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine, collectBlocks } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { planBlockMove } from "../../src/engine/move";
import { resolveDragPayload } from "../../src/engine/payload";

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

  it("keeps paragraph indent even when dx is a full pixel step", () => {
    const text = "alpha\n\nbravo\n";
    const doc = docFromText(text);
    const origin = blockAtLine(doc, 1, 4)!;
    const base = {
      doc,
      selection: selectOne(origin),
      hitLine: 3,
      belowMid: true,
      tabSize: 4,
      indentUnit: 4,
      indentStepPx: 32,
    };
    const withDx = planBlockMove({ ...base, dx: 32 });
    const withoutDx = planBlockMove({ ...base, dx: 0 });
    expect(withDx).toEqual(withoutDx);
  });

  it("scales list indent by pixel step instead of treating dx as columns", () => {
    const text = "- a\n    - b\n        - c\n- d\n";
    const doc = docFromText(text);
    const origin = blockAtLine(doc, 4, 4)!;
    const base = {
      doc,
      selection: selectOne(origin),
      hitLine: 3,
      belowMid: true,
      dx: 32,
      tabSize: 4,
      indentUnit: 4,
    };
    const byPixels = planBlockMove({ ...base, indentStepPx: 32 });
    const byColumns = planBlockMove({ ...base, indentStepPx: 4 });
    expect(byPixels).not.toBeNull();
    expect(byColumns).not.toBeNull();
    expect(byPixels).not.toEqual(byColumns);
    const next = byPixels!.reduce(
      (current, edit) => applyTextChanges(current, edit.changes),
      text,
    );
    expect(next).toMatch(/^ {4}- d/m);
    expect(next).not.toMatch(/^ {8,}- d/m);
  });

  it("moves only the gripped parent list row and leaves nested children behind", () => {
    const text = `- 选项1
- 选项2
- 选项3
    - 选项1-1
    - 选项1-2
    - 选项1-3
`;
    const doc = docFromText(text);
    const origin = collectBlocks(doc, 4).find((block) => block.lines.startLine === 3)!;
    const selection = resolveDragPayload({
      doc,
      tabSize: 4,
      origin,
      selection: { fromLine: 1, toLine: 1, collapsed: true },
    });
    const edits = planBlockMove({
      doc,
      selection,
      hitLine: 1,
      belowMid: false,
      dx: 0,
      tabSize: 4,
      indentUnit: 4,
    });
    expect(edits).not.toBeNull();
    const next = edits!.reduce(
      (current, edit) => applyTextChanges(current, edit.changes),
      text,
    );
    expect(next).toBe(`- 选项3
- 选项1
- 选项2
    - 选项1-1
    - 选项1-2
    - 选项1-3
`);
  });

  it("unnests an ordered child upward without duplicating the row", () => {
    const text = `1. 选项0
2. 选项1
    1. 选项2
`;
    const doc = docFromText(text);
    const selection = resolveDragPayload({
      doc,
      tabSize: 4,
      origin: {
        type: BlockType.ListItem,
        lines: { startLine: 3, endLine: 3 },
      },
      selection: { fromLine: 3, toLine: 3, collapsed: true },
    });
    const edits = planBlockMove({
      doc,
      selection,
      hitLine: 2,
      belowMid: true,
      dx: -32,
      tabSize: 4,
      indentUnit: 4,
      indentStepPx: 32,
    });
    expect(edits).not.toBeNull();
    const next = edits!.reduce(
      (current, edit) => applyTextChanges(current, edit.changes),
      text,
    );
    expect(next).toBe(`1. 选项0
2. 选项1
3. 选项2
`);
    expect(next.match(/选项2/g)).toHaveLength(1);
  });
});
