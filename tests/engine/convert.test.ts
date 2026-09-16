import { selectBlocks, type TextChange } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine, collectBlocks } from "../../src/engine/blocks";
import { planBlockConvert, planSelectionConvert } from "../../src/engine/convert";
import { docFromText } from "../../src/engine/doc";

const TAB_SIZE = 4;

function convert(text: string, line: number, request: Parameters<typeof planBlockConvert>[2]): string {
  const doc = docFromText(text);
  const block = blockAtLine(doc, line, TAB_SIZE);
  if (block === null) {
    throw new Error("expected a block");
  }
  const planned = planBlockConvert(doc, block, request);
  if (planned === "noop") {
    return text;
  }
  return applyTextChanges(text, planned);
}

describe("planBlockConvert", () => {
  it("converts a heading to a paragraph", () => {
    expect(convert("# Title\n", 1, { kind: "paragraph" })).toContain("Title");
    expect(convert("# Title\n", 1, { kind: "paragraph" })).not.toMatch(/^# /m);
  });

  it("is a no-op when converting a paragraph to a paragraph", () => {
    expect(planBlockConvert(docFromText("hello\n"), blockAtLine(docFromText("hello\n"), 1, TAB_SIZE)!, { kind: "paragraph" })).toBe("noop");
  });

  it("rewrites callout types while keeping title and fold marker", () => {
    const next = convert("> [!note]- Title\n> body\n", 1, {
      kind: "callout",
      callout: "warning",
    });
    expect(next).toMatch(/> \[!warning\]- Title/);
    expect(next).toContain("> body");
  });

  it("turns a paragraph into an info callout", () => {
    const next = convert("hello\n", 1, { kind: "callout", callout: "info" });
    expect(next).toMatch(/> \[!info\]/);
    expect(next).toContain("hello");
  });

  it("does not swallow the next paragraph when converting to an info callout", () => {
    const next = convert("hello\n\nnext\n", 1, { kind: "callout", callout: "info" });
    expect(next).toMatch(/> \[!info\]/);
    expect(next).toContain("hello");
    expect(next).toMatch(/\nnext\n?$/);
    expect(next).not.toMatch(/^>\s*next/m);
  });
});

describe("planSelectionConvert", () => {
  it("converts every selected block independently", () => {
    const text = "alpha\n\nbravo\n";
    const doc = docFromText(text);
    const blocks = collectBlocks(doc, TAB_SIZE);
    const planned = planSelectionConvert(
      doc,
      selectBlocks(blocks),
      { kind: "heading", level: 1 },
    );
    expect(planned).not.toBe("noop");
    const next = applyTextChanges(text, planned as TextChange[]);
    expect(next).toMatch(/^# alpha/m);
    expect(next).toMatch(/^# bravo/m);
  });

  it("skips blocks that are already the target type", () => {
    const text = "# alpha\n\nbravo\n";
    const doc = docFromText(text);
    const blocks = collectBlocks(doc, TAB_SIZE);
    const planned = planSelectionConvert(
      doc,
      selectBlocks(blocks),
      { kind: "heading", level: 1 },
    );
    expect(planned).not.toBe("noop");
    const next = applyTextChanges(text, planned as TextChange[]);
    expect(next).toMatch(/^# alpha/m);
    expect(next).toMatch(/^# bravo/m);
    expect(next.match(/^# /gm)?.length).toBe(2);
  });

  it("returns noop when every block is already the target", () => {
    const text = "alpha\n\nbravo\n";
    const doc = docFromText(text);
    const blocks = collectBlocks(doc, TAB_SIZE);
    expect(
      planSelectionConvert(doc, selectBlocks(blocks), { kind: "paragraph" }),
    ).toBe("noop");
  });
});
