import {
  isReject,
  locateDropPosition,
  moveTx,
  planMove,
  type BlockSelection,
  type Doc,
  type DocEdit,
} from "md-dragger/domain";
import { indentWidthFromDx, sourceIndentWidth } from "./indent";

export function planBlockMove(params: {
  doc: Doc;
  selection: BlockSelection;
  hitLine: number;
  belowMid: boolean;
  dx: number;
  tabSize: number;
  indentUnit: number;
}): DocEdit[] | null {
  const originWidth = sourceIndentWidth(params.doc, params.selection, params.tabSize);
  const targetWidth = indentWidthFromDx(originWidth, params.dx, params.indentUnit);
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
