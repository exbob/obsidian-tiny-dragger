import type { Block, Doc } from "md-dragger/domain";
import { lineRangeText } from "./doc";

export function blockText(doc: Doc, block: Block): string {
  const text = lineRangeText(doc, block.lines);
  return text.endsWith("\n") ? text : `${text}\n`;
}
