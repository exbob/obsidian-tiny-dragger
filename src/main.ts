import { Compartment, type Extension } from "@codemirror/state";
import { Plugin } from "obsidian";
import { DragSession } from "./services/drag-session";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type TinyDraggerSettings,
} from "./settings";
import { openBlockMenu, selectionForBlockMenu } from "./ui/block-menu";
import {
  forEachLiveEditorView,
  handleGutterExtension,
  pinHandleStartLine,
} from "./ui/handle-gutter";
import { TinyDraggerSettingTab } from "./ui/settings-tab";

export default class TinyDraggerPlugin extends Plugin {
  settings: TinyDraggerSettings = DEFAULT_SETTINGS;
  private readonly gutterCompartment = new Compartment();
  private readonly editorExtensions: Extension[] = [];
  private session: DragSession | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.session = new DragSession({
      getSettings: () => this.settings,
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
    });
    this.syncEditorExtensions();
    this.registerEditorExtension(this.editorExtensions);
    this.register(() => this.session?.destroy());
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.session?.cancel();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.session?.cancel();
      }),
    );
    this.addSettingTab(new TinyDraggerSettingTab(this.app, this));
  }

  onunload(): void {
    this.session?.destroy();
    this.session = null;
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    this.refreshGutter();
  }

  refreshGutter(): void {
    const next = this.gutterExt();
    this.editorExtensions.length = 0;
    this.editorExtensions.push(this.gutterCompartment.of(next));
    const effect = this.gutterCompartment.reconfigure(next);
    const seen = new Set<object>();
    forEachLiveEditorView((view) => {
      if (seen.has(view)) {
        return;
      }
      seen.add(view);
      view.dispatch({ effects: effect });
    });
    this.app.workspace.iterateAllLeaves((leaf) => {
      const cm = (
        leaf.view as { editor?: { cm?: { dispatch: (tr: { effects: unknown }) => void } } }
      ).editor?.cm;
      if (cm !== undefined && !seen.has(cm)) {
        seen.add(cm);
        cm.dispatch({ effects: effect });
      }
    });
    this.app.workspace.updateOptions();
  }

  private syncEditorExtensions(): void {
    this.editorExtensions.length = 0;
    this.editorExtensions.push(this.gutterCompartment.of(this.gutterExt()));
  }

  private gutterExt(): Extension {
    if (this.session === null) {
      return [];
    }
    return handleGutterExtension({
      getSettings: () => this.settings,
      session: this.session,
    });
  }
}
