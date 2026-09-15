import { BlockType } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { blockAtLine, collectBlocks } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";

const TAB_SIZE = 4;

describe("collectBlocks", () => {
  it("uses md-dragger detectBlock and skips YAML frontmatter", () => {
    const doc = docFromText(`---
title: demo
---

# Title

paragraph

- item
`);
    const blocks = collectBlocks(doc, TAB_SIZE);
    expect(blocks.some((block) => block.lines.startLine <= 3)).toBe(false);
    expect(blockAtLine(doc, 5, TAB_SIZE)?.type).toBe(BlockType.Heading);
    expect(blocks.some((block) => block.type === BlockType.Heading)).toBe(true);
    expect(blocks.some((block) => block.type === BlockType.ListItem)).toBe(true);
  });
});
