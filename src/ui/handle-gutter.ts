import { StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  gutter,
  GutterMarker,
  ViewPlugin,
  type EditorView,
} from "@codemirror/view";
import type {} from "obsidian";
import { blockAtLine } from "../engine/blocks";
import { dragSourceField, type DragSession } from "../services/drag-session";
import { docFromView, readTabSize } from "../services/editor-host";
import { type TinyDraggerSettings } from "../settings";
import {
  applyHandleAppearance,
  applyHandleLineAlign,
  createHandleElement,
} from "./handle-dom";

const liveViews = new Set<EditorView>();

export function forEachLiveEditorView(callback: (view: EditorView) => void): void {
  for (const view of liveViews) {
    callback(view);
  }
}

const setHoveredStartLine = StateEffect.define<number | null>();
const setPinnedStartLine = StateEffect.define<number | null>();

const hoveredStartLineField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHoveredStartLine)) {
        return effect.value;
      }
    }
    return value;
  },
});

const pinnedStartLineField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setPinnedStartLine)) {
        return effect.value;
      }
    }
    return value;
  },
});

export function pinHandleStartLine(
  view: EditorView,
  startLine: number | null,
): void {
  const effects = [setPinnedStartLine.of(startLine)];
  if (startLine !== null) {
    effects.push(setHoveredStartLine.of(startLine));
  }
  view.dispatch({ effects });
}

function activeHandleStartLine(view: EditorView): number | null {
  return (
    view.state.field(pinnedStartLineField) ??
    view.state.field(hoveredStartLineField)
  );
}

class HandleGutterMarker extends GutterMarker {
  constructor(
    private readonly startLine: number,
    private readonly session: DragSession,
    private readonly getSettings: () => TinyDraggerSettings,
  ) {
    super();
  }

  eq(other: GutterMarker): boolean {
    return other instanceof HandleGutterMarker && other.startLine === this.startLine;
  }

  toDOM(view: EditorView): HTMLElement {
    const root = createHandleElement({
      onGripPointerDown: (event) => {
        const block = blockAtLine(
          docFromView(view),
          this.startLine,
          readTabSize(view),
        );
        if (block === null) {
          return;
        }
        this.session.onGripPointerDown(view, block, event);
      },
    });
    root.classList.add("is-visible");
    root.dataset.startLine = String(this.startLine);
    applyHandleAppearance(root, this.getSettings());
    scheduleHandleLineAlign(view, root, this.startLine);
    return root;
  }
}

class HandleSpacerMarker extends GutterMarker {
  toDOM(): HTMLElement {
    return createDiv({ cls: "tiny-dragger-gutter-spacer" });
  }
}

function firstLineHeightPx(view: EditorView, startLine: number): number | null {
  if (startLine < 1 || startLine > view.state.doc.lines) {
    return null;
  }
  try {
    const coords = view.coordsAtPos(view.state.doc.line(startLine).from);
    if (coords === null) {
      return null;
    }
    const height = coords.bottom - coords.top;
    return height > 0 ? height : null;
  } catch {
    return null;
  }
}

function scheduleHandleLineAlign(
  view: EditorView,
  el: HTMLElement,
  startLine: number,
): void {
  view.requestMeasure({
    key: el,
    read: () => firstLineHeightPx(view, startLine),
    write: (height) => {
      if (el.isConnected) {
        applyHandleLineAlign(el, height);
      }
    },
  });
}

function applyHandleCssVars(view: EditorView, settings: TinyDraggerSettings): void {
  applyHandleAppearance(view.dom, settings);
  view.dom.querySelectorAll<HTMLElement>(".tiny-dragger-handle").forEach((el) => {
    applyHandleAppearance(el, settings);
    const startLine = Number(el.dataset.startLine);
    if (Number.isInteger(startLine)) {
      scheduleHandleLineAlign(view, el, startLine);
    }
  });
}

function hoveredStartLineAt(view: EditorView, event: MouseEvent): number | null {
  const coords = { x: event.clientX, y: event.clientY };
  const pos = view.posAtCoords(coords) ?? view.posAtCoords(coords, false);
  if (pos === null) {
    return null;
  }
  const lineNumber = view.state.doc.lineAt(pos).number;
  const block = blockAtLine(docFromView(view), lineNumber, readTabSize(view));
  return block?.lines.startLine ?? null;
}

export interface HandleGutterConfig {
  getSettings: () => TinyDraggerSettings;
  session: DragSession;
}

export function handleGutterExtension(config: HandleGutterConfig): Extension {
  const hoverPlugin = ViewPlugin.fromClass(
    class HandleHoverPlugin {
      private readonly onMouseMove: (event: MouseEvent) => void;
      private readonly onMouseLeave: () => void;

      constructor(readonly view: EditorView) {
        liveViews.add(view);
        applyHandleCssVars(view, config.getSettings());
        this.onMouseMove = (event: MouseEvent) => {
          if (view.state.field(pinnedStartLineField) !== null) {
            return;
          }
          const next = hoveredStartLineAt(view, event);
          if (next === null) {
            return;
          }
          if (view.state.field(hoveredStartLineField) !== next) {
            view.dispatch({ effects: setHoveredStartLine.of(next) });
          }
        };
        this.onMouseLeave = () => {
          if (
            config.session.isDragSessionActive() ||
            view.state.field(pinnedStartLineField) !== null
          ) {
            return;
          }
          if (view.state.field(hoveredStartLineField) !== null) {
            view.dispatch({ effects: setHoveredStartLine.of(null) });
          }
        };
        view.dom.addEventListener("mousemove", this.onMouseMove);
        view.dom.addEventListener("mouseleave", this.onMouseLeave);
      }

      update(): void {
        applyHandleCssVars(this.view, config.getSettings());
      }

      destroy(): void {
        this.view.dom.removeEventListener("mousemove", this.onMouseMove);
        this.view.dom.removeEventListener("mouseleave", this.onMouseLeave);
        liveViews.delete(this.view);
      }
    },
  );

  return [
    dragSourceField,
    hoveredStartLineField,
    pinnedStartLineField,
    hoverPlugin,
    gutter({
      class: "tiny-dragger-gutter",
      side: "before",
      initialSpacer: () => new HandleSpacerMarker(),
      lineMarker(view, line) {
        const active = activeHandleStartLine(view);
        if (active === null) {
          return null;
        }
        const lineNumber = view.state.doc.lineAt(line.from).number;
        if (lineNumber !== active) {
          return null;
        }
        return new HandleGutterMarker(active, config.session, config.getSettings);
      },
      lineMarkerChange: (update) =>
        update.startState.field(hoveredStartLineField) !==
          update.state.field(hoveredStartLineField) ||
        update.startState.field(pinnedStartLineField) !==
          update.state.field(pinnedStartLineField),
    }),
  ];
}
