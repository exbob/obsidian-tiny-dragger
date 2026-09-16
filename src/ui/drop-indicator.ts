import type { EditorView } from "@codemirror/view";
import type {} from "obsidian";

export class DropIndicator {
  private element: HTMLElement | null = null;
  private host: HTMLElement | null = null;

  attach(view: EditorView): void {
    const host = view.scrollDOM;
    if (this.host === host && this.element !== null) {
      return;
    }
    this.detach();
    const element = host.createDiv({ cls: "tiny-dragger-drop-line" });
    element.hidden = true;
    this.host = host;
    this.element = element;
  }

  show(y: number, leftPx = 0): void {
    if (this.element === null) {
      return;
    }
    this.element.hidden = false;
    this.element.setCssStyles({
      top: `${y}px`,
      left: `${Math.max(0, leftPx)}px`,
      right: "0px",
    });
  }

  hide(): void {
    if (this.element !== null) {
      this.element.hidden = true;
    }
  }

  detach(): void {
    this.element?.remove();
    this.element = null;
    this.host = null;
  }
}
