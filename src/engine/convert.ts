import {
  BlockType,
  planConvert,
  type Block,
  type ConvertTo,
  type Doc,
  type TextChange,
} from "md-dragger/domain";
import { applyTextChanges } from "./apply";
import { lineRangeText } from "./doc";

export type CalloutKind = "info" | "warning" | "danger" | "example";

export type ConvertRequest =
  | { kind: "paragraph" }
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { kind: "list"; markerType: "unordered" | "ordered" | "task" }
  | { kind: "blockquote" }
  | { kind: "callout"; callout: CalloutKind }
  | { kind: "code" }
  | { kind: "math" };

const CALLOUT_LINE =
  /^((?:>\s*)+)(?:\[!([A-Za-z0-9_-]+)\]([+-]?)(?:\s+(.*))?|(.*))$/;

function toConvertTarget(request: ConvertRequest): ConvertTo | null {
  switch (request.kind) {
    case "paragraph":
      return { type: BlockType.Paragraph };
    case "heading":
      return { type: BlockType.Heading, level: request.level };
    case "list":
      return { type: BlockType.ListItem, markerType: request.markerType };
    case "blockquote":
    case "callout":
      return { type: BlockType.Blockquote };
    case "code":
      return { type: BlockType.CodeBlock };
    case "math":
      return { type: BlockType.MathBlock };
  }
}

function rewriteCalloutLine(line: string, callout: CalloutKind): string {
  const match = line.match(CALLOUT_LINE);
  if (match === null) {
    return `> [!${callout}]`;
  }
  const prefix = match[1];
  const fold = match[3] ?? "";
  const title = (match[4] ?? match[5] ?? "").trimEnd();
  const rest = title === "" ? "" : ` ${title}`;
  return `${prefix}[!${callout}]${fold}${rest}`;
}

function applyCalloutType(
  text: string,
  callout: CalloutKind,
): string {
  const lines = text.split("\n");
  const index = lines.findIndex((line) => line.trim() !== "");
  if (index === -1) {
    return `> [!${callout}]`;
  }
  lines[index] = rewriteCalloutLine(lines[index], callout);
  return lines.join("\n");
}

function isSameCallout(text: string, callout: CalloutKind): boolean {
  const first = text.split("\n").find((line) => line.trim() !== "") ?? "";
  const match = first.match(CALLOUT_LINE);
  return match?.[2]?.toLowerCase() === callout;
}

export function planBlockConvert(
  doc: Doc,
  block: Block,
  request: ConvertRequest,
): TextChange[] | "noop" {
  const original = lineRangeText(doc, block.lines);
  if (request.kind === "callout" && isSameCallout(original, request.callout)) {
    return "noop";
  }

  if (request.kind === "callout") {
    const alreadyQuote =
      block.type === BlockType.Blockquote || block.type === BlockType.Callout;
    if (alreadyQuote) {
      const nextSlice = applyCalloutType(original, request.callout);
      if (nextSlice === original) {
        return "noop";
      }
      return [
        {
          from: doc.line(block.lines.startLine).from,
          to: doc.line(block.lines.endLine).to,
          insert: nextSlice,
        },
      ];
    }
    const planned = planConvert({
      doc,
      block,
      to: { type: BlockType.Blockquote },
    });
    const converted = applyTextChanges(doc.sliceString(0, doc.length), planned);
    const from = doc.line(block.lines.startLine).from;
    const originalTo = doc.line(block.lines.endLine).to;
    const convertedTo = originalTo + (converted.length - doc.length);
    const rewritten = applyCalloutType(converted.slice(from, convertedTo), request.callout);
    return [{ from, to: originalTo, insert: rewritten }];
  }

  const target = toConvertTarget(request);
  if (target === null) {
    return "noop";
  }
  const planned = planConvert({ doc, block, to: target });
  if (planned.length === 0) {
    return "noop";
  }
  const next = applyTextChanges(doc.sliceString(0, doc.length), planned);
  if (next === doc.sliceString(0, doc.length)) {
    return "noop";
  }
  return planned;
}
