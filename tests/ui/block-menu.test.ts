import type { EditorView } from "@codemirror/view";
import { Menu, Notice } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTextChanges } from "../../src/engine/apply";
import { blockAtLine } from "../../src/engine/blocks";
import { docFromText } from "../../src/engine/doc";
import { setLocaleForTests } from "../../src/i18n";
import { openBlockMenu, populateBlockMenu } from "../../src/ui/block-menu";

type Dispatched = {
  changes?: Array<{ from: number; to: number; insert: string }>;
};

type StubMenuItem = {
  title: string;
  icon: string;
  warning: boolean;
  clickHandler: ((evt: MouseEvent) => unknown) | null;
};

type StubMenuEntry =
  | { kind: "item"; item: StubMenuItem }
  | { kind: "separator" }
  | { kind: "submenu"; title: string; icon: string; items: StubMenuItem[] };

type NoticeStub = typeof Notice & { messages: string[] };
type StubMenu = Menu & { entries: StubMenuEntry[] };

function noticeStub(): NoticeStub {
  return Notice as NoticeStub;
}

function asStubMenu(menu: Menu): StubMenu {
  return menu as StubMenu;
}

function titlesOf(menu: StubMenu): string[] {
  return menu.entries.flatMap((entry) => {
    if (entry.kind === "item") {
      return [entry.item.title];
    }
    if (entry.kind === "submenu") {
      return [entry.title, ...entry.items.map((item) => item.title)];
    }
    return [];
  });
}

function createView(text: string): {
  view: EditorView;
  dispatches: Dispatched[];
} {
  const dispatches: Dispatched[] = [];
  const view = {
    state: { doc: docFromText(text), tabSize: 4 },
    dispatch(tr: Dispatched) {
      dispatches.push(tr);
    },
  };
  return { view: view as unknown as EditorView, dispatches };
}

function appliedText(text: string, dispatches: Dispatched[]): string {
  let next = text;
  for (const dispatch of dispatches) {
    if (dispatch.changes === undefined) {
      continue;
    }
    next = applyTextChanges(next, dispatch.changes);
  }
  return next;
}

function captureMenu(view: EditorView, text: string, line: number): StubMenu {
  const block = blockAtLine(docFromText(text), line, 4);
  if (block === null) {
    throw new Error("expected a block");
  }
  const shown: Menu[] = [];
  const spy = vi
    .spyOn(Menu.prototype, "showAtMouseEvent")
    .mockImplementation(function (this: Menu) {
      shown.push(this);
      return this;
    });
  openBlockMenu({ view, block, event: new MouseEvent("click") });
  spy.mockRestore();
  const menu = shown[0];
  if (menu === undefined) {
    throw new Error("expected the block menu to show");
  }
  return asStubMenu(menu);
}

function findItem(menu: StubMenu, title: string): StubMenuItem {
  for (const entry of menu.entries) {
    if (entry.kind === "item" && entry.item.title === title) {
      return entry.item;
    }
    if (entry.kind === "submenu") {
      const child = entry.items.find((item) => item.title === title);
      if (child !== undefined) {
        return child;
      }
    }
  }
  throw new Error(`missing menu item: ${title}`);
}

async function clickItem(menu: StubMenu, title: string): Promise<void> {
  await findItem(menu, title).clickHandler?.(new MouseEvent("click"));
}

describe("populateBlockMenu", () => {
  it("adds convert, clipboard, and warning delete items with icons", () => {
    setLocaleForTests("en");
    const menu = new Menu();
    const convert = vi.fn();
    populateBlockMenu(menu, convert);
    const titles = asStubMenu(menu).entries.flatMap((entry) => {
      if (entry.kind === "item") {
        return [entry.item.title];
      }
      if (entry.kind === "submenu") {
        return [entry.title, ...entry.items.map((item) => item.title)];
      }
      return [];
    });
    expect(titles).toContain("Paragraph");
    expect(titles).toContain("Copy block");
    expect(titles).toContain("Delete block");
    const del = asStubMenu(menu).entries.find(
      (entry) => entry.kind === "item" && entry.item.title === "Delete block",
    );
    expect(del?.kind === "item" && del.item.warning).toBe(true);
    expect(del?.kind === "item" && del.item.icon).toBe("trash-2");
  });

  it("separates convert actions from clipboard actions", () => {
    setLocaleForTests("en");
    const menu = asStubMenu(new Menu());
    populateBlockMenu(menu, vi.fn());
    const mathIndex = menu.entries.findIndex(
      (entry) => entry.kind === "item" && entry.item.title === "Math block",
    );
    const copyIndex = menu.entries.findIndex(
      (entry) => entry.kind === "item" && entry.item.title === "Copy block",
    );
    expect(mathIndex).toBeGreaterThan(-1);
    expect(copyIndex).toBeGreaterThan(mathIndex);
    expect(menu.entries[mathIndex + 1]?.kind).toBe("separator");
    expect(copyIndex).toBe(mathIndex + 2);
  });

  it("nests heading list and quote conversions in submenus", () => {
    setLocaleForTests("en");
    const menu = asStubMenu(new Menu());
    populateBlockMenu(menu, vi.fn());
    const heading = menu.entries.find(
      (entry) => entry.kind === "submenu" && entry.title === "Heading",
    );
    expect(heading?.kind === "submenu" && heading.icon).toBe("heading");
    expect(titlesOf(menu)).toContain("Heading 1");
    expect(titlesOf(menu)).toContain("Bulleted list");
    expect(titlesOf(menu)).toContain("Info callout");
  });
});

describe("openBlockMenu", () => {
  beforeEach(() => {
    setLocaleForTests("en");
    noticeStub().messages = [];
    vi.restoreAllMocks();
  });

  it("does not dispatch or notice when converting a block to the same type", async () => {
    const text = "hello\n";
    const { view, dispatches } = createView(text);
    const menu = captureMenu(view, text, 1);
    await clickItem(menu, "Paragraph");
    expect(dispatches).toEqual([]);
    expect(noticeStub().messages).toEqual([]);
  });

  it("converts only the block that opened the menu", async () => {
    const text = "alpha\n\nbeta\n";
    const { view, dispatches } = createView(text);
    const menu = captureMenu(view, text, 1);
    await clickItem(menu, "Heading 1");
    const next = appliedText(text, dispatches);
    expect(next).toMatch(/^# alpha/m);
    expect(next).toContain("beta");
    expect(next).not.toMatch(/^# beta/m);
  });

  it("does not delete when copying fails", async () => {
    const text = "keep\n\ngone\n";
    const { view, dispatches } = createView(text);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    const menu = captureMenu(view, text, 3);
    await clickItem(menu, "Cut block");
    expect(dispatches).toEqual([]);
    expect(noticeStub().messages).toContain("Could not copy this block");
  });

  it("copies the opened block then deletes it on cut", async () => {
    const text = "keep\n\ngone\n";
    const { view, dispatches } = createView(text);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });
    const menu = captureMenu(view, text, 3);
    await clickItem(menu, "Cut block");
    expect(writeText).toHaveBeenCalledWith("gone\n");
    const next = appliedText(text, dispatches);
    expect(next).toContain("keep");
    expect(next).not.toContain("gone");
  });

  it("shows a notice when delete dispatch throws", async () => {
    const text = "hello\n";
    const { view } = createView(text);
    view.dispatch = () => {
      throw new RangeError("from");
    };
    const menu = captureMenu(view, text, 1);
    await clickItem(menu, "Delete block");
    expect(noticeStub().messages).toContain("Could not delete this block");
  });

  it("shows a notice when cut dispatch throws after copying", async () => {
    const text = "keep\n\ngone\n";
    const { view } = createView(text);
    view.dispatch = () => {
      throw new RangeError("from");
    };
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    const menu = captureMenu(view, text, 3);
    await clickItem(menu, "Cut block");
    expect(noticeStub().messages).toContain("Could not cut this block");
  });

  it("invokes onClose when the menu hides", () => {
    const text = "hello\n";
    const { view } = createView(text);
    const block = blockAtLine(docFromText(text), 1, 4)!;
    const onClose = vi.fn();
    const shown: Menu[] = [];
    const spy = vi
      .spyOn(Menu.prototype, "showAtMouseEvent")
      .mockImplementation(function (this: Menu) {
        shown.push(this);
        return this;
      });
    openBlockMenu({
      view,
      block,
      event: new MouseEvent("click"),
      onClose,
    });
    spy.mockRestore();
    expect(shown[0]).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    shown[0]!.hide();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
