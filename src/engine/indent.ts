import { parseLine, type BlockSelection, type Doc } from "md-dragger/domain";

const DEFAULT_INDENT_STEP_PX = 32;

export function indentWidthFromDx(
  originWidth: number,
  dxPx: number,
  indentUnitColumns: number,
  indentStepPx = DEFAULT_INDENT_STEP_PX,
): number {
  if (indentUnitColumns <= 0 || indentStepPx <= 0) {
    return originWidth;
  }
  if (Math.abs(dxPx) < indentStepPx / 2) {
    return originWidth;
  }
  const steps = Math.round(dxPx / indentStepPx);
  return Math.max(0, originWidth + steps * indentUnitColumns);
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
