import {
  selectBlocks,
  selectOne,
  type Block,
  type BlockSelection,
  type Doc,
  type LineRange,
} from "md-dragger/domain";
import { collectBlocks } from "./blocks";

export interface SelectionLines {
  fromLine: number;
  toLine: number;
  collapsed: boolean;
}

export function rangesOverlap(a: LineRange, b: LineRange): boolean {
  return a.startLine <= b.endLine && b.startLine <= a.endLine;
}

export function resolveDragPayload(params: {
  doc: Doc;
  tabSize: number;
  origin: Block;
  selection: SelectionLines;
}): BlockSelection {
  if (params.selection.collapsed) {
    return selectOne(params.origin);
  }
  const selected: LineRange = {
    startLine: Math.min(params.selection.fromLine, params.selection.toLine),
    endLine: Math.max(params.selection.fromLine, params.selection.toLine),
  };
  const intersecting = collectBlocks(params.doc, params.tabSize).filter((block) =>
    rangesOverlap(block.lines, selected),
  );
  const originInside = intersecting.some(
    (block) =>
      block.lines.startLine === params.origin.lines.startLine &&
      block.lines.endLine === params.origin.lines.endLine,
  );
  if (intersecting.length < 2 || !originInside) {
    return selectOne(params.origin);
  }
  return selectBlocks(intersecting);
}
