import { describe, expect, it } from "vitest";
import { collectBlocks } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { resolveDragPayload } from "../../src/engine/payload";

const TAB_SIZE = 4;
const DOC = `alpha

bravo

charlie
`;

describe("resolveDragPayload", () => {
  it("drags only the origin block when the selection is collapsed", () => {
    const doc = docFromText(DOC);
    const blocks = collectBlocks(doc, TAB_SIZE);
    const origin = blocks[1];
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin,
      selection: { fromLine: 3, toLine: 3, collapsed: true },
    });
    expect(payload.blocks).toEqual([origin]);
  });

  it("drags intersecting blocks when the grip is inside the native selection", () => {
    const doc = docFromText(DOC);
    const blocks = collectBlocks(doc, TAB_SIZE);
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: blocks[1],
      selection: { fromLine: 1, toLine: 5, collapsed: false },
    });
    expect(payload.blocks.map((block) => block.lines.startLine)).toEqual(
      blocks.map((block) => block.lines.startLine),
    );
  });

  it("drags only the origin when the grip is outside the selected group", () => {
    const doc = docFromText(DOC);
    const blocks = collectBlocks(doc, TAB_SIZE);
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: blocks[2],
      selection: { fromLine: 1, toLine: 1, collapsed: false },
    });
    expect(payload.blocks).toEqual([blocks[2]]);
  });

  it("drags only the parent list row when the selection is collapsed on that line", () => {
    const doc = docFromText(`- 选项1
- 选项2
- 选项3
    - 选项1-1
    - 选项1-2
    - 选项1-3
`);
    const origin = collectBlocks(doc, TAB_SIZE).find(
      (block) => block.lines.startLine === 3,
    );
    expect(origin?.lines).toEqual({ startLine: 3, endLine: 6 });
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: origin!,
      selection: { fromLine: 3, toLine: 3, collapsed: true },
    });
    expect(payload.blocks).toHaveLength(1);
    expect(payload.blocks[0]?.lines).toEqual({ startLine: 3, endLine: 3 });
  });

  it("drags only the gripped parent list row even when the caret is elsewhere", () => {
    const doc = docFromText(`- 选项1
- 选项2
- 选项3
    - 选项1-1
    - 选项1-2
    - 选项1-3
`);
    const origin = collectBlocks(doc, TAB_SIZE).find(
      (block) => block.lines.startLine === 3,
    );
    expect(origin?.lines).toEqual({ startLine: 3, endLine: 6 });
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: origin!,
      selection: { fromLine: 1, toLine: 1, collapsed: true },
    });
    expect(payload.blocks).toHaveLength(1);
    expect(payload.blocks[0]?.lines).toEqual({ startLine: 3, endLine: 3 });
  });

  it("drags only the selected parent list row when children are not selected", () => {
    const doc = docFromText(`- 选项1
- 选项2
- 选项3
    - 选项1-1
    - 选项1-2
    - 选项1-3
`);
    const origin = collectBlocks(doc, TAB_SIZE).find(
      (block) => block.lines.startLine === 3,
    );
    expect(origin).toBeTruthy();
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: origin!,
      selection: { fromLine: 3, toLine: 3, collapsed: false },
    });
    expect(payload.blocks).toHaveLength(1);
    expect(payload.blocks[0]?.lines).toEqual({ startLine: 3, endLine: 3 });
  });

  it("drags all selected nested list rows together", () => {
    const doc = docFromText(`- 选项1
- 选项2
- 选项3
    - 选项1-1
    - 选项1-2
    - 选项1-3
`);
    const origin = collectBlocks(doc, TAB_SIZE).find(
      (block) => block.lines.startLine === 3,
    );
    expect(origin).toBeTruthy();
    const payload = resolveDragPayload({
      doc,
      tabSize: TAB_SIZE,
      origin: origin!,
      selection: { fromLine: 4, toLine: 6, collapsed: false },
    });
    expect(payload.blocks.map((block) => block.lines.startLine)).toEqual([4, 5, 6]);
    expect(payload.blocks.every((block) => block.lines.endLine === block.lines.startLine)).toBe(
      true,
    );
  });
});
