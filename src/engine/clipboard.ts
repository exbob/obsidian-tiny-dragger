import type { Block, BlockSelection, Doc } from "md-dragger/domain";
import { lineRangeText } from "./doc";

export function blockText(doc: Doc, block: Block): string {
  const text = lineRangeText(doc, block.lines);
  return text.endsWith("\n") ? text : `${text}\n`;
}

export function selectionText(doc: Doc, selection: BlockSelection): string {
  const blocks = selection.blocks;
  if (blocks.length === 0) {
    return "";
  }
  const first = blocks[0]!;
  const last = blocks[blocks.length - 1]!;
  const text = lineRangeText(doc, {
    startLine: first.lines.startLine,
    endLine: last.lines.endLine,
  });
  return text.endsWith("\n") ? text : `${text}\n`;
}
