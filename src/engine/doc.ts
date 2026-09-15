import type { Doc, DocLine, LineRange } from "md-dragger/domain";

export function docFromText(text: string): Doc {
  const rawLines = text.split("\n");
  const lines: DocLine[] = [];
  let offset = 0;
  for (let i = 0; i < rawLines.length; i++) {
    const value = rawLines[i];
    const from = offset;
    const to = from + value.length;
    lines.push({ text: value, from, to });
    offset = to + (i === rawLines.length - 1 ? 0 : 1);
  }
  return {
    lines: lines.length,
    length: text.length,
    line: (n: number): DocLine => {
      const line = lines[n - 1];
      if (line === undefined) {
        throw new RangeError(`line ${n} out of range`);
      }
      return line;
    },
    lineAt: (pos: number) => {
      if (lines.length === 0) {
        return { number: 1 };
      }
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const end = i === lines.length - 1 ? line.to : line.to + 1;
        if (pos < end || i === lines.length - 1) {
          return { number: i + 1 };
        }
      }
      return { number: lines.length };
    },
    sliceString: (from: number, to: number) => text.slice(from, to),
  };
}

export function lineRangeText(doc: Doc, range: LineRange): string {
  return doc.sliceString(doc.line(range.startLine).from, doc.line(range.endLine).to);
}
