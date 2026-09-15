import { detectBlock, type Block, type Doc } from "md-dragger/domain";

export function blockAtLine(
  doc: Doc,
  lineNumber: number,
  tabSize: number,
): Block | null {
  if (lineNumber < 1 || lineNumber > doc.lines) {
    return null;
  }
  return detectBlock(doc, lineNumber, { tabSize });
}

export function collectBlocks(doc: Doc, tabSize: number): Block[] {
  const blocks: Block[] = [];
  let line = 1;
  while (line <= doc.lines) {
    const block = detectBlock(doc, line, { tabSize });
    if (block === null) {
      line += 1;
      continue;
    }
    blocks.push(block);
    line = block.lines.endLine + 1;
  }
  return blocks;
}
