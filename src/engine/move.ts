import {
  BlockType,
  isReject,
  locateDropPosition,
  moveTx,
  planMove,
  type BlockSelection,
  type Doc,
  type DocEdit,
} from "md-dragger/domain";
import { indentWidthFromDx, sourceIndentWidth } from "./indent";

const INDENTABLE_TYPES = new Set<BlockType>([
  BlockType.ListItem,
  BlockType.Blockquote,
  BlockType.Callout,
]);

function allowsHorizontalIndent(selection: BlockSelection): boolean {
  return (
    selection.blocks.length > 0 &&
    selection.blocks.every((block) => INDENTABLE_TYPES.has(block.type))
  );
}

export function planBlockMove(params: {
  doc: Doc;
  selection: BlockSelection;
  hitLine: number;
  belowMid: boolean;
  dx: number;
  tabSize: number;
  indentUnit: number;
  indentStepPx?: number;
}): DocEdit[] | null {
  const originWidth = sourceIndentWidth(params.doc, params.selection, params.tabSize);
  const targetWidth = allowsHorizontalIndent(params.selection)
    ? indentWidthFromDx(
        originWidth,
        params.dx,
        params.indentUnit,
        params.indentStepPx,
      )
    : originWidth;
  const position = locateDropPosition({
    doc: params.doc,
    selection: params.selection,
    hitLine: params.hitLine,
    belowMid: params.belowMid,
    sourceIndentWidth: originWidth,
    targetIndentWidth: targetWidth,
    tabSize: params.tabSize,
    indentUnit: params.indentUnit,
  });
  const planned = planMove({
    sourceDoc: params.doc,
    selection: params.selection,
    position,
    tabSize: params.tabSize,
    indentUnit: params.indentUnit,
  });
  if (planned.type === "reject") {
    return null;
  }
  const edits = moveTx({ sourceDoc: params.doc, plan: planned.value });
  if (isReject(edits)) {
    return null;
  }
  return edits;
}
