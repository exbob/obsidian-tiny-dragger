# Block Menu Multi-Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the grip block menu convert / copy / cut / delete operate on the same multi-block payload as drag when the native selection covers multiple blocks and the clicked grip is inside it.

**Architecture:** Resolve `BlockSelection` with existing `resolveDragPayload` at grip-click time; extend clipboard and convert planners to accept that selection; dispatch one merged change set so undo is atomic. Menu UI items stay unchanged.

**Tech Stack:** TypeScript, Vitest, CodeMirror 6 (`EditorView`), Obsidian `Menu`/`Notice`, `md-dragger/domain` (`BlockSelection`, `selectBlocks`, `selectOne`).

## Global Constraints

- Reuse `resolveDragPayload` as-is; do not fork selection rules for the menu.
- Convert each selected block independently; skip per-block `noop`; never merge blocks into one fence/callout.
- Multi-block convert / cut / delete must be one `view.dispatch` (one undo).
- Keep single-block behavior identical when the payload is one block.
- Spec: `docs/superpowers/specs/2026-09-16-block-menu-multi-block-design.md`.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/engine/clipboard.ts` | Add `selectionText(doc, selection)` as a contiguous line span from the first selected block’s `startLine` through the last block’s `endLine` (preserves inter-block blank lines; same trailing-newline rule as `blockText`). Not per-block `blockText` map/join. |
| `src/engine/convert.ts` | Add `planSelectionConvert(doc, selection, request)` that merges non-noop single-block plans. |
| `src/ui/block-menu.ts` | Take `BlockSelection`; run copy/cut/delete/convert against it. |
| `src/main.ts` | On grip click, resolve payload then open the menu. |
| `tests/engine/clipboard.test.ts` | New tests for `selectionText` (create file). |
| `tests/engine/convert.test.ts` | Multi-block convert / partial noop tests. |
| `tests/ui/block-menu.test.ts` | Multi-block menu action tests; update helpers for `selection`. |
| `README.md` / `README_zh.md` | Document shared selection rule; remove single-block-only limitation. |
| `src/i18n/en.ts` / `zh.ts` | Soften notices so wording fits one or many blocks. |

---

### Task 1: Multi-block clipboard text

**Files:**
- Modify: `src/engine/clipboard.ts`
- Create: `tests/engine/clipboard.test.ts`

**Interfaces:**
- Consumes: existing `blockText(doc: Doc, block: Block): string`; `BlockSelection` from `md-dragger/domain`
- Produces: `selectionText(doc: Doc, selection: BlockSelection): string` — contiguous `lineRangeText` span from first to last selected block (not per-block join).

- [ ] **Step 1: Write the failing test**

Create `tests/engine/clipboard.test.ts`:

```typescript
import { selectBlocks, selectOne } from "md-dragger/domain";
import { describe, expect, it } from "vitest";
import { blockAtLine, collectBlocks } from "../../src/engine/blocks";
import { blockText, selectionText } from "../../src/engine/clipboard";
import { docFromText } from "../../src/engine/doc";

const TAB = 4;

describe("selectionText", () => {
  it("matches blockText for a one-block selection", () => {
    const text = "alpha\n";
    const doc = docFromText(text);
    const block = blockAtLine(doc, 1, TAB)!;
    expect(selectionText(doc, selectOne(block))).toBe(blockText(doc, block));
  });

  it("returns contiguous line span from first to last block", () => {
    const text = "alpha\n\nbravo\n\ncharlie\n";
    const doc = docFromText(text);
    const blocks = collectBlocks(doc, TAB);
    const payload = selectBlocks([blocks[0]!, blocks[1]!]);
    expect(selectionText(doc, payload)).toBe("alpha\n\nbravo\n");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/clipboard.test.ts`

Expected: FAIL — `selectionText` is not exported.

- [ ] **Step 3: Write minimal implementation**

In `src/engine/clipboard.ts`, slice document lines from the first selected block through the last. Do **not** `selection.blocks.map(blockText).join("")` — blank lines between paragraph blocks are outside each block’s `lines` range, so map/join drops them and fails the multi-block test.

```typescript
import type { Block, BlockSelection, Doc } from "md-dragger/domain";
import { lineRangeText } from "./doc";

export function blockText(doc: Doc, block: Block): string {
  const text = lineRangeText(doc, block.lines);
  return text.endsWith("\n") ? text : `${text}\n`;
}

export function selectionText(doc: Doc, selection: BlockSelection): string {
  const blocks = selection.blocks;
  if (blocks.length === 0) {
    return "";
  }
  const first = blocks[0]!;
  const last = blocks[blocks.length - 1]!;
  const text = lineRangeText(doc, {
    startLine: first.lines.startLine,
    endLine: last.lines.endLine,
  });
  return text.endsWith("\n") ? text : `${text}\n`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/clipboard.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/clipboard.ts tests/engine/clipboard.test.ts
git commit -m "feat(clipboard): add selectionText for multi-block copy"
```

---

### Task 2: Multi-block convert planner

**Files:**
- Modify: `src/engine/convert.ts`
- Modify: `tests/engine/convert.test.ts`

**Interfaces:**
- Consumes: existing `planBlockConvert(doc, block, request)`; `BlockSelection`
- Produces: `planSelectionConvert(doc: Doc, selection: BlockSelection, request: ConvertRequest): TextChange[] | "noop"`

- [ ] **Step 1: Write the failing tests**

Append to `tests/engine/convert.test.ts`:

```typescript
import { selectBlocks } from "md-dragger/domain";
import { collectBlocks } from "../../src/engine/blocks";
import { planSelectionConvert } from "../../src/engine/convert";

// keep existing imports; add the above if missing

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
    const next = applyTextChanges(text, planned as import("md-dragger/domain").TextChange[]);
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
    const next = applyTextChanges(text, planned as import("md-dragger/domain").TextChange[]);
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
```

Prefer a top-level `import type { TextChange }` and cast/`expect` without inline import if the file already imports cleanly — keep the file’s style.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/convert.test.ts`

Expected: FAIL — `planSelectionConvert` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/engine/convert.ts` (imports: add `BlockSelection`):

```typescript
export function planSelectionConvert(
  doc: Doc,
  selection: BlockSelection,
  request: ConvertRequest,
): TextChange[] | "noop" {
  const changes: TextChange[] = [];
  for (const block of selection.blocks) {
    const planned = planBlockConvert(doc, block, request);
    if (planned !== "noop") {
      changes.push(...planned);
    }
  }
  return changes.length === 0 ? "noop" : changes;
}
```

Do not change `planBlockConvert` behavior. Callers that still need one block keep using it; menu will use `planSelectionConvert`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/convert.test.ts`

Expected: PASS (including existing single-block tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/convert.ts tests/engine/convert.test.ts
git commit -m "feat(convert): plan multi-block selection conversions"
```

---

### Task 3: Wire block menu to `BlockSelection`

**Files:**
- Modify: `src/ui/block-menu.ts`
- Modify: `tests/ui/block-menu.test.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/zh.ts`

**Interfaces:**
- Consumes: `selectionText`, `planSelectionConvert`, `planBlockDelete`, `BlockSelection`
- Produces: `openBlockMenu({ view, selection, event, onClose? })` — replace `block: Block` with `selection: BlockSelection`

- [ ] **Step 1: Update failing UI tests first**

In `tests/ui/block-menu.test.ts`:

1. Change `captureMenu` to take a `BlockSelection` (or build `selectOne(block)` from the line) and pass `selection` into `openBlockMenu`.
2. Add tests:

```typescript
import { selectBlocks, selectOne } from "md-dragger/domain";
import { collectBlocks } from "../../src/engine/blocks";

// helper: open menu with an explicit selection
function captureMenuWithSelection(
  view: EditorView,
  text: string,
  selection: ReturnType<typeof selectBlocks>,
): StubMenu {
  const shown: Menu[] = [];
  const spy = vi
    .spyOn(Menu.prototype, "showAtMouseEvent")
    .mockImplementation(function (this: Menu) {
      shown.push(this);
      return this;
    });
  openBlockMenu({ view, selection, event: new MouseEvent("click") });
  spy.mockRestore();
  const menu = shown[0];
  if (menu === undefined) {
    throw new Error("expected the block menu to show");
  }
  return asStubMenu(menu);
}

it("converts every block in the opened selection", async () => {
  const text = "alpha\n\nbravo\n";
  const { view, dispatches } = createView(text);
  const blocks = collectBlocks(docFromText(text), 4);
  const menu = captureMenuWithSelection(view, text, selectBlocks(blocks));
  await clickItem(menu, "Heading 1");
  const next = appliedText(text, dispatches);
  expect(next).toMatch(/^# alpha/m);
  expect(next).toMatch(/^# bravo/m);
  expect(dispatches).toHaveLength(1);
});

it("copies then deletes the whole selection on cut", async () => {
  const text = "keep\n\nalpha\n\nbravo\n";
  const { view, dispatches } = createView(text);
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  const doc = docFromText(text);
  const blocks = collectBlocks(doc, 4).slice(1);
  const menu = captureMenuWithSelection(view, text, selectBlocks(blocks));
  await clickItem(menu, "Cut block");
  expect(writeText).toHaveBeenCalledWith("alpha\n\nbravo\n");
  const next = appliedText(text, dispatches);
  expect(next).toContain("keep");
  expect(next).not.toContain("alpha");
  expect(next).not.toContain("bravo");
  expect(dispatches).toHaveLength(1);
});
```

Update every existing `openBlockMenu({ view, block, ... })` call to `openBlockMenu({ view, selection: selectOne(block), ... })`, and keep the test “converts only the block that opened the menu” as a single-block selection case.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/block-menu.test.ts`

Expected: FAIL on `selection` / missing multi-block behavior.

- [ ] **Step 3: Implement menu wiring**

Replace action target in `src/ui/block-menu.ts`:

```typescript
import type { BlockSelection } from "md-dragger/domain";
import { selectionText } from "../engine/clipboard";
import { planBlockConvert, planSelectionConvert, type ConvertRequest } from "../engine/convert";
import { planBlockDelete } from "../engine/delete";
// remove selectOne / blockText / Block imports if unused

export function openBlockMenu(params: {
  view: EditorView;
  selection: BlockSelection;
  event: MouseEvent;
  settings?: unknown;
  onClose?: () => void;
}): void {
  const menu = new Menu();
  populateBlockMenu(menu, (action) =>
    runBlockMenuAction(params.view, params.selection, action),
  );
  if (params.onClose !== undefined) {
    menu.onHide(params.onClose);
  }
  menu.showAtMouseEvent(params.event);
}

async function runBlockMenuAction(
  view: EditorView,
  selection: BlockSelection,
  action: BlockMenuAction,
): Promise<void> {
  if (action.kind === "copy") {
    await copyOpenedSelection(view, selection);
    return;
  }
  if (action.kind === "cut") {
    const copied = await copyOpenedSelection(view, selection);
    if (!copied) {
      return;
    }
    deleteOpenedSelection(view, selection, "cut");
    return;
  }
  if (action.kind === "delete") {
    deleteOpenedSelection(view, selection, "delete");
    return;
  }
  convertOpenedSelection(view, selection, action);
}

async function copyOpenedSelection(
  view: EditorView,
  selection: BlockSelection,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(selectionText(docFromView(view), selection));
    return true;
  } catch {
    new Notice(t("notice.copyFailed"));
    return false;
  }
}

function deleteOpenedSelection(
  view: EditorView,
  selection: BlockSelection,
  mode: "cut" | "delete",
): void {
  const edit = planBlockDelete(docFromView(view), selection);
  if (edit === null) {
    new Notice(t(mode === "cut" ? "notice.cutFailed" : "notice.deleteFailed"));
    return;
  }
  try {
    dispatchChanges(view, edit.changes);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    new Notice(
      t(mode === "cut" ? "notice.cutFailed" : "notice.deleteFailed", { detail }),
    );
  }
}

function convertOpenedSelection(
  view: EditorView,
  selection: BlockSelection,
  request: ConvertRequest,
): void {
  try {
    const planned = planSelectionConvert(docFromView(view), selection, request);
    if (planned === "noop") {
      return;
    }
    dispatchChanges(view, planned);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    new Notice(t("notice.convertFailed", { detail }));
  }
}
```

Soften i18n (en / zh) so notices are not “this one block” only, for example:

- en: `Could not convert: {detail}`, `Could not copy`, `Could not cut`, `Could not delete`
- zh: `无法转换：{detail}`, `无法复制`, `无法剪切`, `无法删除`

Keep menu item titles (`Copy block` / `复制块`) unchanged.

- [ ] **Step 4: Run UI tests**

Run: `npx vitest run tests/ui/block-menu.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/block-menu.ts tests/ui/block-menu.test.ts src/i18n/en.ts src/i18n/zh.ts
git commit -m "feat(menu): run block menu actions on BlockSelection"
```

---

### Task 4: Resolve payload on grip click + docs

**Files:**
- Modify: `src/main.ts`
- Modify: `README.md`
- Modify: `README_zh.md`

**Interfaces:**
- Consumes: `resolveDragPayload`, `readSelectionLines`, `docFromView`, `readTabSize`, updated `openBlockMenu`
- Produces: grip-click path that freezes the drag-equivalent payload for the open menu

- [ ] **Step 1: Write an integration-style unit test for the resolve+open contract**

Prefer covering the resolve call site without booting the full Plugin if awkward. Minimal approach: add a small exported helper used by `main.ts`, tested in `tests/ui/block-menu.test.ts` or `tests/services/...`.

Add `src/ui/block-menu.ts` (or keep in `main` via a tiny helper in `src/engine/payload.ts` — prefer **not** growing payload). Put this helper next to the menu open path:

In `src/ui/block-menu.ts`:

```typescript
import type { Block } from "md-dragger/domain";
import { resolveDragPayload } from "../engine/payload";
import { docFromView, readSelectionLines, readTabSize } from "../services/editor-host";

export function selectionForBlockMenu(
  view: EditorView,
  origin: Block,
): BlockSelection {
  return resolveDragPayload({
    doc: docFromView(view),
    tabSize: readTabSize(view),
    origin,
    selection: readSelectionLines(view),
  });
}
```

Add test with a stub view that has `state.selection.main` and `state.doc` / `tabSize`:

```typescript
it("selectionForBlockMenu matches resolveDragPayload for an in-selection grip", () => {
  const text = "alpha\n\nbravo\n\ncharlie\n";
  const doc = docFromText(text);
  const blocks = collectBlocks(doc, 4);
  const view = {
    state: {
      doc,
      tabSize: 4,
      selection: {
        main: {
          from: doc.line(1).from,
          to: doc.line(5).to,
          empty: false,
        },
      },
    },
  } as unknown as EditorView;
  const payload = selectionForBlockMenu(view, blocks[1]!);
  expect(payload.blocks.map((b) => b.lines.startLine)).toEqual(
    blocks.map((b) => b.lines.startLine),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/block-menu.test.ts -t selectionForBlockMenu`

Expected: FAIL — helper missing.

- [ ] **Step 3: Implement helper + main wiring + README**

Implement `selectionForBlockMenu` as above.

In `src/main.ts`:

```typescript
import { openBlockMenu, selectionForBlockMenu } from "./ui/block-menu";

// inside onload DragSession:
onGripClick: (view, block, event) => {
  pinHandleStartLine(view, block.lines.startLine);
  openBlockMenu({
    view,
    selection: selectionForBlockMenu(view, block),
    event,
    settings: this.settings,
    onClose: () => pinHandleStartLine(view, null),
  });
},
```

Update README block-menu sections:

`README.md` — Block menu paragraph: state that when a multi-block native selection includes the gripped block, convert / copy / cut / delete apply to that whole payload (same rules as drag); otherwise only the gripped block. Remove the sentence that the menu does not convert a multi-block selection. Under Known limits, remove “Menu conversion applies to one block, not a multi-block selection.”

`README_zh.md` — same content updates in Chinese; remove the matching known-limit bullet and the “菜单不会把多块选区作为一组转换” sentence.

- [ ] **Step 4: Run full test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts src/ui/block-menu.ts tests/ui/block-menu.test.ts README.md README_zh.md
git commit -m "feat(menu): resolve drag payload for multi-block menu actions"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Same inclusion rules as drag via `resolveDragPayload` | Task 4 (`selectionForBlockMenu`) |
| Convert / copy / cut / delete on whole payload | Tasks 1–3 |
| Per-block convert, skip noop | Task 2 |
| One dispatch / one undo | Task 3 (`dispatchChanges` once) |
| Single-block unchanged when payload is one block | Tasks 1–3 tests + existing cases |
| No UI redesign / no merge-into-one-block | Out of scope; not tasked |
| README + known-limit cleanup | Task 4 |
| i18n wording for one-or-many | Task 3 |

No TBD placeholders. Names are consistent: `selectionText`, `planSelectionConvert`, `selectionForBlockMenu`, `openBlockMenu({ selection })`.
