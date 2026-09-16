import {
  BlockType,
  parseLine,
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
  if (!params.selection.collapsed) {
    const selected: LineRange = {
      startLine: Math.min(params.selection.fromLine, params.selection.toLine),
      endLine: Math.max(params.selection.fromLine, params.selection.toLine),
    };
    const listRows = selectedListRows(params.doc, selected, params.tabSize);
    if (listRows !== null && rangesOverlap(params.origin.lines, selected)) {
      return selectBlocks(listRows);
    }
    const intersecting = collectBlocks(params.doc, params.tabSize).filter((block) =>
      rangesOverlap(block.lines, selected),
    );
    const originInside = intersecting.some(
      (block) =>
        block.lines.startLine === params.origin.lines.startLine &&
        block.lines.endLine === params.origin.lines.endLine,
    );
    if (intersecting.length >= 2 && originInside) {
      return selectBlocks(intersecting);
    }
  }

  // List handles represent one visible row. md-dragger's detectBlock expands a
  // parent item to its subtree, but dragging the handle alone must not take children.
  if (params.origin.type === BlockType.ListItem) {
    return selectOne({
      type: BlockType.ListItem,
      lines: {
        startLine: params.origin.lines.startLine,
        endLine: params.origin.lines.startLine,
      },
    });
  }

  return selectOne(params.origin);
}

function selectedListRows(
  doc: Doc,
  selected: LineRange,
  tabSize: number,
): Block[] | null {
  const rows: Block[] = [];
  let nonEmpty = 0;
  for (let lineNumber = selected.startLine; lineNumber <= selected.endLine; lineNumber++) {
    const text = doc.line(lineNumber).text;
    if (text.trim() === "") {
      continue;
    }
    nonEmpty += 1;
    const row = listRowBlock(doc, lineNumber, tabSize);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }
  return nonEmpty > 0 && rows.length === nonEmpty ? rows : null;
}

function listRowBlock(doc: Doc, lineNumber: number, tabSize: number): Block | null {
  const text = doc.line(lineNumber).text;
  if (text.trim() === "") {
    return null;
  }
  const parsed = parseLine(text, tabSize);
  if (parsed.marker?.kind !== "list") {
    return null;
  }
  return {
    type: BlockType.ListItem,
    lines: { startLine: lineNumber, endLine: lineNumber },
  };
}
