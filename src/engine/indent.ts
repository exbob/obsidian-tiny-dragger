import { parseLine, type BlockSelection, type Doc } from "md-dragger/domain";

export function indentWidthFromDx(
  originWidth: number,
  dx: number,
  indentUnit: number,
): number {
  if (indentUnit <= 0) {
    return originWidth;
  }
  if (Math.abs(dx) < indentUnit / 2) {
    return originWidth;
  }
  const steps = Math.round(dx / indentUnit);
  return Math.max(0, originWidth + steps * indentUnit);
}

export function sourceIndentWidth(
  doc: Doc,
  selection: BlockSelection,
  tabSize: number,
): number {
  const first = selection.blocks[0];
  if (first === undefined) {
    return 0;
  }
  return parseLine(doc.line(first.lines.startLine).text, tabSize).indent.width;
}
