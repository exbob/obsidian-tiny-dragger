import type { EditorView } from "@codemirror/view";
import { selectOne, type Block } from "md-dragger/domain";
import { Menu, Notice, type MenuItem } from "obsidian";
import { blockText } from "../engine/clipboard";
import { planBlockConvert, type ConvertRequest } from "../engine/convert";
import { planBlockDelete } from "../engine/delete";
import { t } from "../i18n";
import { dispatchChanges, docFromView } from "../services/editor-host";

export type BlockMenuAction =
  | ConvertRequest
  | { kind: "copy" }
  | { kind: "cut" }
  | { kind: "delete" };

type MenuItemWithSubmenu = MenuItem & { setSubmenu: () => Menu };

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export function populateBlockMenu(
  menu: Menu,
  onAction: (action: BlockMenuAction) => unknown,
): void {
  menu.addItem((item) => {
    item.setTitle(t("menu.paragraph"));
    item.setIcon("type");
    item.onClick(() => onAction({ kind: "paragraph" }));
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.heading"));
    item.setIcon("heading");
    const sub = submenuOf(item);
    for (const level of HEADING_LEVELS) {
      sub.addItem((child) => {
        child.setTitle(t("menu.headingN", { level }));
        child.setIcon(`heading-${level}`);
        child.onClick(() => onAction({ kind: "heading", level }));
      });
    }
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.list"));
    item.setIcon("list");
    const sub = submenuOf(item);
    sub.addItem((child) => {
      child.setTitle(t("menu.unorderedList"));
      child.setIcon("list");
      child.onClick(() => onAction({ kind: "list", markerType: "unordered" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.orderedList"));
      child.setIcon("list-ordered");
      child.onClick(() => onAction({ kind: "list", markerType: "ordered" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.taskList"));
      child.setIcon("square-check-big");
      child.onClick(() => onAction({ kind: "list", markerType: "task" }));
    });
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.quote"));
    item.setIcon("quote");
    const sub = submenuOf(item);
    sub.addItem((child) => {
      child.setTitle(t("menu.blockquote"));
      child.setIcon("quote");
      child.onClick(() => onAction({ kind: "blockquote" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.calloutInfo"));
      child.setIcon("info");
      child.onClick(() => onAction({ kind: "callout", callout: "info" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.calloutWarning"));
      child.setIcon("alert-triangle");
      child.onClick(() => onAction({ kind: "callout", callout: "warning" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.calloutDanger"));
      child.setIcon("alert-octagon");
      child.onClick(() => onAction({ kind: "callout", callout: "danger" }));
    });
    sub.addItem((child) => {
      child.setTitle(t("menu.calloutExample"));
      child.setIcon("lightbulb");
      child.onClick(() => onAction({ kind: "callout", callout: "example" }));
    });
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.code"));
    item.setIcon("code");
    item.onClick(() => onAction({ kind: "code" }));
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.math"));
    item.setIcon("sigma");
    item.onClick(() => onAction({ kind: "math" }));
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item.setTitle(t("menu.copy"));
    item.setIcon("copy");
    item.onClick(() => onAction({ kind: "copy" }));
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.cut"));
    item.setIcon("scissors");
    item.onClick(() => onAction({ kind: "cut" }));
  });

  menu.addItem((item) => {
    item.setTitle(t("menu.delete"));
    item.setIcon("trash-2");
    item.setWarning(true);
    item.onClick(() => onAction({ kind: "delete" }));
  });
}

export function openBlockMenu(params: {
  view: EditorView;
  block: Block;
  event: MouseEvent;
  settings?: unknown;
  onClose?: () => void;
}): void {
  const menu = new Menu();
  populateBlockMenu(menu, (action) =>
    runBlockMenuAction(params.view, params.block, action),
  );
  if (params.onClose !== undefined) {
    menu.onHide(params.onClose);
  }
  menu.showAtMouseEvent(params.event);
}

function submenuOf(item: MenuItem): Menu {
  return (item as MenuItemWithSubmenu).setSubmenu();
}

async function runBlockMenuAction(
  view: EditorView,
  block: Block,
  action: BlockMenuAction,
): Promise<void> {
  if (action.kind === "copy") {
    await copyOpenedBlock(view, block);
    return;
  }
  if (action.kind === "cut") {
    const copied = await copyOpenedBlock(view, block);
    if (!copied) {
      return;
    }
    deleteOpenedBlock(view, block, "cut");
    return;
  }
  if (action.kind === "delete") {
    deleteOpenedBlock(view, block, "delete");
    return;
  }
  convertOpenedBlock(view, block, action);
}

async function copyOpenedBlock(view: EditorView, block: Block): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(blockText(docFromView(view), block));
    return true;
  } catch {
    new Notice(t("notice.copyFailed"));
    return false;
  }
}

function deleteOpenedBlock(
  view: EditorView,
  block: Block,
  mode: "cut" | "delete",
): void {
  const edit = planBlockDelete(docFromView(view), selectOne(block));
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

function convertOpenedBlock(
  view: EditorView,
  block: Block,
  request: ConvertRequest,
): void {
  try {
    const planned = planBlockConvert(docFromView(view), block, request);
    if (planned === "noop") {
      return;
    }
    dispatchChanges(view, planned);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    new Notice(t("notice.convertFailed", { detail }));
  }
}
