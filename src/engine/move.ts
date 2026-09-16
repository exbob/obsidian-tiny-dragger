import {
  BlockType,
  isReject,
  locateDropPosition,
  moveTx,
  planMove,
  type BlockSelection,
  type Doc,
  type DocEdit,
  type MovePlan,
  type TextChange,
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

export function previewTargetIndentWidth(params: {
  doc: Doc;
  selection: BlockSelection;
  dx: number;
  tabSize: number;
  indentUnit: number;
  indentStepPx?: number;
}): number {
  const originWidth = sourceIndentWidth(params.doc, params.selection, params.tabSize);
  if (!allowsHorizontalIndent(params.selection)) {
    return originWidth;
  }
  return indentWidthFromDx(
    originWidth,
    params.dx,
    params.indentUnit,
    params.indentStepPx,
  );
}

/**
 * md-dragger's ordered-list renumber compose turns an in-place replace
 * `{from, to: deleteTo, insert}` into a pure insert `{from, to: from, insert}`,
 * which duplicates the row. Restore the deleted span for that case.
 */
export function repairInPlaceIndentEdits(
  plan: MovePlan,
  edits: DocEdit[],
): DocEdit[] {
  if (!plan.allowIndent) {
    return edits;
  }
  const segments = plan.captured.payload.segments;
  if (segments.length !== 1) {
    return edits;
  }
  const segment = segments[0];
  if (segment === undefined || segment.deleteTo <= segment.deleteFrom) {
    return edits;
  }
  return edits.map((edit) => ({
    ...edit,
    changes: edit.changes.map((change: TextChange) => {
      if (
        change.from === segment.deleteFrom &&
        change.to === change.from &&
        change.insert.length > 0
      ) {
        return { ...change, to: segment.deleteTo };
      }
      return change;
    }),
  }));
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
  const targetWidth = previewTargetIndentWidth(params);
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
  return repairInPlaceIndentEdits(planned.value, edits);
}
