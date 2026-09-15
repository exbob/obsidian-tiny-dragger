import type { EditorView } from "@codemirror/view";

export class DropIndicator {
  private element: HTMLElement | null = null;
  private host: HTMLElement | null = null;

  attach(view: EditorView): void {
    const host = view.scrollDOM;
    if (this.host === host && this.element !== null) {
      return;
    }
    this.detach();
    const element = document.createElement("div");
    element.className = "tiny-dragger-drop-line";
    element.hidden = true;
    host.append(element);
    this.host = host;
    this.element = element;
  }

  show(y: number): void {
    if (this.element === null) {
      return;
    }
    this.element.hidden = false;
    this.element.style.top = `${y}px`;
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
