import { DRAG_THRESHOLD_PX } from "../constants";
import type { SelectionLines } from "../engine/payload";

export type GesturePhase = "idle" | "pending" | "dragging";

export function hypotOffset(dx: number, dy: number): number {
  return Math.hypot(dx, dy);
}

export function shouldStartDrag(
  dx: number,
  dy: number,
  threshold: number = DRAG_THRESHOLD_PX,
): boolean {
  return hypotOffset(dx, dy) > threshold;
}

export function selectionLinesFromRange(
  fromLine: number,
  toLine: number,
  collapsed: boolean,
): SelectionLines {
  return { fromLine, toLine, collapsed };
}
