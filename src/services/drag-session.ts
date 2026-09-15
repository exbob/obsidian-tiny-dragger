import { StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  type DecorationSet,
} from "@codemirror/view";
import type { Block, BlockSelection } from "md-dragger/domain";
import {
  AUTO_SCROLL_EDGE_PX,
  AUTO_SCROLL_MAX_SPEED_PX,
} from "../constants";
import { planBlockMove } from "../engine/move";
import { resolveDragPayload } from "../engine/payload";
import type { SelectionLines } from "../engine/payload";
import type { TinyDraggerSettings } from "../settings";
import { DropIndicator } from "../ui/drop-indicator";
import {
  dispatchEdits,
  docFromView,
  readSelectionLines,
  readTabSize,
} from "./editor-host";
import { shouldStartDrag, type GesturePhase } from "./gesture";

export const setDragSourceLines = StateEffect.define<{
  startLine: number;
  endLine: number;
} | null>();

function decorationsForSource(
  doc: { lines: number; line: (n: number) => { from: number } },
  range: { startLine: number; endLine: number } | null,
): DecorationSet {
  if (range === null) {
    return Decoration.none;
  }
  const ranges = [];
  for (let lineNumber = range.startLine; lineNumber <= range.endLine; lineNumber++) {
    if (lineNumber < 1 || lineNumber > doc.lines) {
      continue;
    }
    ranges.push(
      Decoration.line({ class: "tiny-dragger-source" }).range(
        doc.line(lineNumber).from,
      ),
    );
  }
  return Decoration.set(ranges, true);
}

export const dragSourceField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDragSourceLines)) {
        return decorationsForSource(tr.state.doc, effect.value);
      }
    }
    return deco.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export interface DragSessionOptions {
  getSettings: () => TinyDraggerSettings;
  onGripClick: (view: EditorView, block: Block, event: PointerEvent) => void;
}

interface ActiveDrag {
  view: EditorView;
  origin: Block;
  startDoc: unknown;
  startX: number;
  startY: number;
  selection: SelectionLines;
  phase: GesturePhase;
  payload: BlockSelection | null;
}

function payloadSpan(payload: BlockSelection): {
  startLine: number;
  endLine: number;
} {
  let startLine = Number.POSITIVE_INFINITY;
  let endLine = 0;
  for (const block of payload.blocks) {
    startLine = Math.min(startLine, block.lines.startLine);
    endLine = Math.max(endLine, block.lines.endLine);
  }
  if (!Number.isFinite(startLine)) {
    return { startLine: 1, endLine: 1 };
  }
  return { startLine, endLine };
}

function pointerInsideCurrentPane(
  view: EditorView,
  clientX: number,
  clientY: number,
): boolean {
  const rect = view.scrollDOM.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function readBelowMid(view: EditorView, pos: number, clientY: number): boolean {
  const block = view.lineBlockAt(pos);
  return clientY > view.documentTop + (block.top + block.bottom) / 2;
}

function dropLineY(view: EditorView, pos: number, belowMid: boolean): number {
  const block = view.lineBlockAt(pos);
  const screenY = view.documentTop + (belowMid ? block.bottom : block.top);
  return screenY - view.scrollDOM.getBoundingClientRect().top;
}

export class DragSession {
  private readonly getSettings: () => TinyDraggerSettings;
  private readonly onGripClick: DragSessionOptions["onGripClick"];
  private readonly indicator = new DropIndicator();
  private active: ActiveDrag | null = null;
  private destroyed = false;

  constructor(options: DragSessionOptions) {
    this.getSettings = options.getSettings;
    this.onGripClick = options.onGripClick;
  }

  onGripPointerDown(
    view: EditorView,
    block: Block,
    event: PointerEvent,
  ): void {
    if (this.destroyed) {
      return;
    }
    event.preventDefault();
    this.cancel();
    this.active = {
      view,
      origin: block,
      startDoc: view.state.doc,
      startX: event.clientX,
      startY: event.clientY,
      selection: readSelectionLines(view),
      phase: "pending",
      payload: null,
    };
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
  }

  cancel(): void {
    const current = this.active;
    this.active = null;
    this.detachWindow();
    this.indicator.hide();
    this.indicator.detach();
    if (current !== null) {
      this.setSource(current.view, null);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.cancel();
  }

  private detachWindow(): void {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private shouldAbort(current: ActiveDrag): boolean {
    return (
      this.destroyed ||
      current.view.state.doc !== current.startDoc ||
      !current.view.dom.isConnected
    );
  }

  private onPointerMove = (event: PointerEvent): void => {
    const current = this.active;
    if (current === null) {
      return;
    }
    if (this.shouldAbort(current)) {
      this.cancel();
      return;
    }
    if (current.phase === "pending") {
      if (
        !shouldStartDrag(event.clientX - current.startX, event.clientY - current.startY)
      ) {
        return;
      }
      current.phase = "dragging";
      current.payload = this.resolvePayload(current);
      this.indicator.attach(current.view);
      this.setSource(current.view, payloadSpan(current.payload));
    }
    this.autoScroll(current.view, event);
    this.updateDropLine(current, event);
  };

  private onPointerUp = (event: PointerEvent): void => {
    const current = this.active;
    if (current === null) {
      return;
    }
    if (this.shouldAbort(current)) {
      this.cancel();
      return;
    }
    if (current.phase === "pending") {
      const { view, origin } = current;
      this.cancel();
      this.onGripClick(view, origin, event);
      return;
    }
    this.commitDrop(current, event);
    this.cancel();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.active !== null) {
      event.preventDefault();
      this.cancel();
    }
  };

  private resolvePayload(current: ActiveDrag): BlockSelection {
    const tabSize = readTabSize(current.view);
    return resolveDragPayload({
      doc: docFromView(current.view),
      tabSize,
      origin: current.origin,
      selection: current.selection,
    });
  }

  private updateDropLine(current: ActiveDrag, event: PointerEvent): void {
    if (
      !pointerInsideCurrentPane(current.view, event.clientX, event.clientY)
    ) {
      this.indicator.hide();
      return;
    }
    const pos = current.view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      this.indicator.hide();
      return;
    }
    const belowMid = readBelowMid(current.view, pos, event.clientY);
    this.indicator.show(dropLineY(current.view, pos, belowMid));
  }

  private commitDrop(current: ActiveDrag, event: PointerEvent): void {
    if (
      !pointerInsideCurrentPane(current.view, event.clientX, event.clientY)
    ) {
      this.indicator.hide();
      return;
    }
    const pos = current.view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      this.indicator.hide();
      return;
    }
    const tabSize = readTabSize(current.view);
    const payload = current.payload ?? this.resolvePayload(current);
    const edits = planBlockMove({
      doc: docFromView(current.view),
      selection: payload,
      hitLine: current.view.state.doc.lineAt(pos).number,
      belowMid: readBelowMid(current.view, pos, event.clientY),
      dx: event.clientX - current.startX,
      tabSize,
      indentUnit: tabSize,
    });
    if (edits === null) {
      return;
    }
    dispatchEdits(current.view, edits);
  }

  private autoScroll(view: EditorView, event: PointerEvent): void {
    const scroll = view.scrollDOM;
    const rect = scroll.getBoundingClientRect();
    if (event.clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
      const delta = Math.min(
        AUTO_SCROLL_MAX_SPEED_PX,
        rect.top + AUTO_SCROLL_EDGE_PX - event.clientY,
      );
      scroll.scrollTop -= delta;
      return;
    }
    if (event.clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
      const delta = Math.min(
        AUTO_SCROLL_MAX_SPEED_PX,
        event.clientY - (rect.bottom - AUTO_SCROLL_EDGE_PX),
      );
      scroll.scrollTop += delta;
    }
  }

  private setSource(
    view: EditorView,
    range: { startLine: number; endLine: number } | null,
  ): void {
    view.dispatch({ effects: setDragSourceLines.of(range) });
  }
}
