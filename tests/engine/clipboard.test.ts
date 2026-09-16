import { selectBlocks, selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { blockAtLine, collectBlocks } from "../../src/engine/blocks";
import { blockText, selectionText } from "../../src/engine/clipboard";
import { docFromText } from "../../src/engine/doc";

const TAB = 4;

describe("selectionText", () => {
  it("matches blockText for a one-block selection", () => {
    const text = "alpha\n";
    const doc = docFromText(text);
    const block = blockAtLine(doc, 1, TAB)!;
    expect(selectionText(doc, selectOne(block))).toBe(blockText(doc, block));
  });

  it("concatenates blocks in document order", () => {
    const text = "alpha\n\nbravo\n\ncharlie\n";
    const doc = docFromText(text);
    const blocks = collectBlocks(doc, TAB);
    const payload = selectBlocks([blocks[0]!, blocks[1]!]);
    expect(selectionText(doc, payload)).toBe("alpha\n\nbravo\n");
  });
});
