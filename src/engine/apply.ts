import type { TextChange } from "md-dragger/domain";

export function applyTextChanges(text: string, changes: TextChange[]): string {
  const ordered = [...changes].sort((a, b) => b.from - a.from || b.to - a.to);
  let next = text;
  for (const change of ordered) {
    next = next.slice(0, change.from) + change.insert + next.slice(change.to);
  }
  return next;
}
