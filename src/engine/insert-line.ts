import type { Block, Doc, TextChange } from "md-dragger/domain";

export function planInsertBlankLine(
  doc: Doc,
  block: Block,
  where: "above" | "below",
): TextChange {
  if (where === "above") {
    const from = doc.line(block.lines.startLine).from;
    return { from, to: from, insert: "\n" };
  }
  const end = doc.line(block.lines.endLine);
  const from = end.to;
  const needsBreak = from < doc.length && doc.sliceString(from, from + 1) !== "\n";
  return { from, to: from, insert: needsBreak ? "\n\n" : "\n" };
}
