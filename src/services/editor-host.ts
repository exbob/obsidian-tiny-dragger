import type { EditorView } from "@codemirror/view";
import type { Doc, DocEdit, TextChange } from "md-dragger/domain";
import type { SelectionLines } from "../engine/payload";
import { selectionLinesFromRange } from "./gesture";

export type TabSizeHost = { state: { tabSize?: number } };

export function docFromView(view: EditorView): Doc {
  return view.state.doc as unknown as Doc;
}

export function readTabSize(view: TabSizeHost): number {
  const value = view.state.tabSize;
  return typeof value === "number" && value > 0 ? value : 4;
}

export function readSelectionLines(view: EditorView): SelectionLines {
  const sel = view.state.selection.main;
  const fromLine = view.state.doc.lineAt(sel.from).number;
  const toLine = view.state.doc.lineAt(sel.to).number;
  return selectionLinesFromRange(fromLine, toLine, sel.empty);
}

export function mergeChanges(changes: TextChange[]): TextChange[] {
  return [...changes].sort((a, b) => b.from - a.from || b.to - a.to);
}

export function dispatchChanges(view: EditorView, changes: TextChange[]): void {
  if (changes.length === 0) {
    return;
  }
  view.dispatch({
    changes: mergeChanges(changes).map((change) => ({
      from: change.from,
      to: change.to,
      insert: change.insert,
    })),
  });
}

export function dispatchEdits(view: EditorView, edits: DocEdit[]): void {
  dispatchChanges(
    view,
    edits.flatMap((edit) => edit.changes),
  );
}

export function createEditorHost(view: EditorView): {
  doc: Doc;
  tabSize: number;
  indentUnit: number;
  selection: SelectionLines;
  dispatchChanges: (changes: TextChange[]) => void;
  dispatchEdits: (edits: DocEdit[]) => void;
} {
  const tabSize = readTabSize(view);
  return {
    doc: docFromView(view),
    tabSize,
    indentUnit: tabSize,
    selection: readSelectionLines(view),
    dispatchChanges: (changes: TextChange[]) => dispatchChanges(view, changes),
    dispatchEdits: (edits: DocEdit[]) => dispatchEdits(view, edits),
  };
}
