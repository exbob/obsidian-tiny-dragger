import type { EditorView } from "@codemirror/view";
import { selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { blockAtLine } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { previewTargetIndentWidth } from "../../src/engine/move";
import { dropLineLeft } from "../../src/services/drag-session";

describe("previewTargetIndentWidth", () => {
  it("keeps list indent for small horizontal movement", () => {
    const doc = docFromText("- a\n    - b\n");
    const selection = selectOne(blockAtLine(doc, 2, 4)!);
    expect(
      previewTargetIndentWidth({
        doc,
        selection,
        dx: 10,
        tabSize: 4,
        indentUnit: 4,
        indentStepPx: 32,
      }),
    ).toBe(4);
  });

  it("increases list indent by a pixel step", () => {
    const doc = docFromText("- a\n    - b\n");
    const selection = selectOne(blockAtLine(doc, 2, 4)!);
    expect(
      previewTargetIndentWidth({
        doc,
        selection,
        dx: 32,
        tabSize: 4,
        indentUnit: 4,
        indentStepPx: 32,
      }),
    ).toBe(8);
  });

  it("does not indent paragraphs from dx", () => {
    const doc = docFromText("alpha\n\nbravo\n");
    const selection = selectOne(blockAtLine(doc, 1, 4)!);
    expect(
      previewTargetIndentWidth({
        doc,
        selection,
        dx: 32,
        tabSize: 4,
        indentUnit: 4,
        indentStepPx: 32,
      }),
    ).toBe(0);
  });
});

describe("dropLineLeft", () => {
  it("starts at the content edge plus indent columns in character widths", () => {
    const view = {
      defaultCharacterWidth: 8,
      contentDOM: {
        getBoundingClientRect: () => ({ left: 120 }),
      },
      scrollDOM: {
        scrollLeft: 0,
        getBoundingClientRect: () => ({ left: 40 }),
      },
    } as unknown as EditorView;
    expect(dropLineLeft(view, 4)).toBe(80 + 32);
    expect(dropLineLeft(view, 0)).toBe(80);
  });
});
