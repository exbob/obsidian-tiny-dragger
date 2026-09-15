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
});
