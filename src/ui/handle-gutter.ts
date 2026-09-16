import { StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  gutter,
  GutterMarker,
  ViewPlugin,
  type EditorView,
} from "@codemirror/view";
import { blockAtLine } from "../engine/blocks";
import { planInsertBlankLine } from "../engine/insert-line";
import { dragSourceField, type DragSession } from "../services/drag-session";
import {
  dispatchChanges,
  docFromView,
  readTabSize,
} from "../services/editor-host";
import { type TinyDraggerSettings } from "../settings";
import { applyHandleAppearance, createHandleElement } from "./handle-dom";

const liveViews = new Set<EditorView>();

export function forEachLiveEditorView(callback: (view: EditorView) => void): void {
  for (const view of liveViews) {
    callback(view);
  }
}

const setHoveredStartLine = StateEffect.define<number | null>();

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
      onInsertAbove: () => insertBlank(view, this.startLine, "above"),
      onInsertBelow: () => insertBlank(view, this.startLine, "below"),
    });
    root.classList.add("is-visible");
    applyHandleAppearance(root, this.getSettings());
    return root;
  }
}

class HandleSpacerMarker extends GutterMarker {
  toDOM(): HTMLElement {
    const spacer = document.createElement("div");
    spacer.className = "tiny-dragger-handle";
    spacer.style.visibility = "hidden";
    spacer.style.pointerEvents = "none";
    return spacer;
  }
}

function insertBlank(
  view: EditorView,
  startLine: number,
  where: "above" | "below",
): void {
  const doc = docFromView(view);
  const block = blockAtLine(doc, startLine, readTabSize(view));
  if (block === null) {
    return;
  }
  dispatchChanges(view, [planInsertBlankLine(doc, block, where)]);
}

function applyHandleCssVars(view: EditorView, settings: TinyDraggerSettings): void {
  applyHandleAppearance(view.dom, settings);
  view.dom
    .querySelectorAll<HTMLElement>(".tiny-dragger-handle")
    .forEach((el) => applyHandleAppearance(el, settings));
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
  getSettings(): TinyDraggerSettings;
  session: DragSession;
}

export function handleGutterExtension(config: HandleGutterConfig): Extension {
  const settings = config.getSettings();
  const hoverPlugin = ViewPlugin.fromClass(
    class HandleHoverPlugin {
      private readonly onMouseMove: (event: MouseEvent) => void;
      private readonly onMouseLeave: () => void;

      constructor(readonly view: EditorView) {
        liveViews.add(view);
        applyHandleCssVars(view, config.getSettings());
        this.onMouseMove = (event: MouseEvent) => {
          const next = hoveredStartLineAt(view, event);
          if (next === null) {
            return;
          }
          if (view.state.field(hoveredStartLineField) !== next) {
            view.dispatch({ effects: setHoveredStartLine.of(next) });
          }
        };
        this.onMouseLeave = () => {
          if (config.session.isDragSessionActive()) {
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
    hoverPlugin,
    gutter({
      class: "tiny-dragger-gutter",
      side: settings.handleSide === "right" ? "after" : "before",
      initialSpacer: () => new HandleSpacerMarker(),
      lineMarker(view, line) {
        const hovered = view.state.field(hoveredStartLineField);
        if (hovered === null) {
          return null;
        }
        const lineNumber = view.state.doc.lineAt(line.from).number;
        if (lineNumber !== hovered) {
          return null;
        }
        return new HandleGutterMarker(hovered, config.session, config.getSettings);
      },
      lineMarkerChange: (update) =>
        update.startState.field(hoveredStartLineField) !==
        update.state.field(hoveredStartLineField),
    }),
  ];
}
