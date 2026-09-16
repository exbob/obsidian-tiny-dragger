import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { blockAtLine } from "../../src/engine/blocks";
import { docFromView } from "../../src/services/editor-host";
import { DragSession } from "../../src/services/drag-session";
import { DEFAULT_SETTINGS } from "../../src/settings";
import { handleGutterExtension } from "../../src/ui/handle-gutter";

function visibleHandle(view: EditorView): HTMLElement | null {
  return view.dom.querySelector(".tiny-dragger-handle.is-visible");
}

describe("handle gutter hover", () => {
  const views: EditorView[] = [];

  afterEach(() => {
    for (const view of views.splice(0)) {
      view.destroy();
    }
  });

  function mount(): { view: EditorView; session: DragSession } {
    const session = new DragSession({
      getSettings: () => DEFAULT_SETTINGS,
      onGripClick: () => {},
    });
    const view = new EditorView({
      state: EditorState.create({
        doc: "hello\n\nworld\n",
        extensions: handleGutterExtension({
          getSettings: () => DEFAULT_SETTINGS,
          session,
        }),
      }),
      parent: document.body,
    });
    views.push(view);
    vi.spyOn(view, "posAtCoords").mockReturnValue(0);
    return { view, session };
  }

  function hoverContent(view: EditorView): void {
    view.contentDOM.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 8, clientY: 8 }),
    );
  }

  it("does not clear hover when mousemove over the gutter misses content coords", () => {
    const { view } = mount();
    hoverContent(view);
    expect(visibleHandle(view)).not.toBeNull();
    vi.spyOn(view, "posAtCoords").mockReturnValue(null);
    view.dom.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 2, clientY: 8 }),
    );
    expect(visibleHandle(view)).not.toBeNull();
  });

  it("does not clear hover when the pointer leaves contentDOM toward the gutter", () => {
    const { view } = mount();
    hoverContent(view);
    expect(visibleHandle(view)).not.toBeNull();
    view.contentDOM.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    expect(visibleHandle(view)).not.toBeNull();
  });

  it("clears hover only after the pointer leaves view.dom", () => {
    const { view } = mount();
    hoverContent(view);
    expect(visibleHandle(view)).not.toBeNull();
    view.dom.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    expect(visibleHandle(view)).toBeNull();
  });

  it("applies the handle color variable onto the visible handle", () => {
    const { view } = mount();
    hoverContent(view);
    const handle = visibleHandle(view);
    expect(handle).not.toBeNull();
    expect(handle!.style.getPropertyValue("--tiny-dragger-handle-color")).toBe(
      "var(--interactive-accent)",
    );
  });

  it("does not clear hover while a drag session is active", () => {
    const { view, session } = mount();
    hoverContent(view);
    expect(visibleHandle(view)).not.toBeNull();
    const block = blockAtLine(docFromView(view), 1, 4);
    expect(block).not.toBeNull();
    session.onGripPointerDown(
      view,
      block!,
      new PointerEvent("pointerdown", { clientX: 8, clientY: 8 }),
    );
    expect(session.isDragSessionActive()).toBe(true);
    view.dom.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    expect(visibleHandle(view)).not.toBeNull();
    session.cancel();
  });
});
