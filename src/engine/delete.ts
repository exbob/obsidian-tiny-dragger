import {
  isReject,
  planDelete,
  type BlockSelection,
  type Doc,
  type DocEdit,
} from "md-dragger/domain";

export function planBlockDelete(
  doc: Doc,
  selection: BlockSelection,
): DocEdit | null {
  const result = planDelete({ doc, selection });
  if (isReject(result)) {
    return null;
  }
  return result;
}
