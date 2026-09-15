export class Notice {
  static messages: string[] = [];

  constructor(message: string | DocumentFragment) {
    Notice.messages.push(
      typeof message === "string" ? message : (message.textContent ?? ""),
    );
  }

  setMessage(message: string | DocumentFragment): this {
    Notice.messages.push(
      typeof message === "string" ? message : (message.textContent ?? ""),
    );
    return this;
  }

  hide(): void {}
}

export class Plugin {
  app: unknown;
  manifest: unknown;
  persistedData: unknown = null;
  readonly settingTabs: unknown[] = [];
  readonly editorExtensions: unknown[] = [];
  readonly registeredCleanups: Array<() => unknown> = [];

  constructor(app: unknown, manifest: unknown) {
    this.app = app;
    this.manifest = manifest;
  }

  async loadData(): Promise<unknown> {
    return this.persistedData;
  }

  async saveData(data: unknown): Promise<void> {
    this.persistedData = data;
  }

  addSettingTab(settingTab: unknown): void {
    this.settingTabs.push(settingTab);
  }

  registerEditorExtension(extension: unknown): void {
    this.editorExtensions.push(extension);
  }

  register(cb: () => unknown): void {
    this.registeredCleanups.push(cb);
  }
}

export class MenuItem {
  title = "";
  icon = "";
  warning = false;
  clickHandler: ((evt: MouseEvent) => unknown) | null = null;
  submenu: Menu | null = null;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    return this;
  }

  setWarning(warning = true): this {
    this.warning = warning;
    return this;
  }

  onClick(callback: (evt: MouseEvent) => unknown): this {
    this.clickHandler = callback;
    return this;
  }

  setSubmenu(): Menu {
    this.submenu = new Menu();
    return this.submenu;
  }
}

type MenuEntry =
  | { kind: "item"; item: MenuItem }
  | { kind: "separator" }
  | { kind: "submenu"; title: string; icon: string; items: MenuItem[] };

export class Menu {
  readonly entries: MenuEntry[] = [];

  addItem(cb: (item: MenuItem) => unknown): this {
    const item = new MenuItem();
    cb(item);
    if (item.submenu !== null) {
      const items = item.submenu.entries
        .filter((entry): entry is { kind: "item"; item: MenuItem } => entry.kind === "item")
        .map((entry) => entry.item);
      this.entries.push({
        kind: "submenu",
        title: item.title,
        icon: item.icon,
        items,
      });
      return this;
    }
    this.entries.push({ kind: "item", item });
    return this;
  }

  addSeparator(): this {
    this.entries.push({ kind: "separator" });
    return this;
  }

  addItemMenu(
    title: string,
    icon: string,
    cb: (sub: Menu) => unknown,
  ): this {
    const sub = new Menu();
    cb(sub);
    const items = sub.entries
      .filter((entry): entry is { kind: "item"; item: MenuItem } => entry.kind === "item")
      .map((entry) => entry.item);
    this.entries.push({ kind: "submenu", title, icon, items });
    return this;
  }

  showAtMouseEvent(_event: MouseEvent): void {}
  showAtPosition(_position: { x: number; y: number }): void {}
}

export class SettingTab {
  app: unknown;
  containerEl: HTMLElement;

  constructor(app: unknown) {
    this.app = app;
    this.containerEl = document.createElement("div");
  }

  display(): void {}
  hide(): void {}
}

export class PluginSettingTab extends SettingTab {
  plugin: Plugin;

  constructor(app: unknown, plugin: Plugin) {
    super(app);
    this.plugin = plugin;
  }
}

export class SliderComponent {
  sliderEl: HTMLInputElement;
  private value = 0;
  private changeCallback: ((value: number) => unknown) | null = null;

  constructor(containerEl: HTMLElement) {
    this.sliderEl = document.createElement("input");
    this.sliderEl.type = "range";
    this.sliderEl.addEventListener("change", () => {
      this.value = Number(this.sliderEl.value);
      void this.changeCallback?.(this.value);
    });
    containerEl.appendChild(this.sliderEl);
  }

  setLimits(min: number, max: number, step: number): this {
    this.sliderEl.min = String(min);
    this.sliderEl.max = String(max);
    this.sliderEl.step = String(step);
    return this;
  }

  setDynamicTooltip(): this {
    return this;
  }

  setValue(value: number): this {
    this.value = value;
    this.sliderEl.value = String(value);
    return this;
  }

  onChange(callback: (value: number) => unknown): this {
    this.changeCallback = callback;
    return this;
  }
}

export class DropdownComponent {
  selectEl: HTMLSelectElement;
  private changeCallback: ((value: string) => unknown) | null = null;

  constructor(containerEl: HTMLElement) {
    this.selectEl = document.createElement("select");
    this.selectEl.addEventListener("change", () => {
      void this.changeCallback?.(this.selectEl.value);
    });
    containerEl.appendChild(this.selectEl);
  }

  addOption(value: string, display: string): this {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = display;
    this.selectEl.append(option);
    return this;
  }

  setValue(value: string): this {
    this.selectEl.value = value;
    return this;
  }

  onChange(callback: (value: string) => unknown): this {
    this.changeCallback = callback;
    return this;
  }
}

export class TextComponent {
  inputEl: HTMLInputElement;
  private changeCallback: ((value: string) => unknown) | null = null;

  constructor(containerEl: HTMLElement) {
    this.inputEl = document.createElement("input");
    this.inputEl.type = "text";
    this.inputEl.addEventListener("change", () => {
      void this.changeCallback?.(this.inputEl.value);
    });
    containerEl.appendChild(this.inputEl);
  }

  setPlaceholder(placeholder: string): this {
    this.inputEl.placeholder = placeholder;
    return this;
  }

  setValue(value: string): this {
    this.inputEl.value = value;
    return this;
  }

  onChange(callback: (value: string) => unknown): this {
    this.changeCallback = callback;
    return this;
  }
}

export class Setting {
  settingEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement("div");
    this.nameEl = document.createElement("div");
    this.descEl = document.createElement("div");
    this.controlEl = document.createElement("div");
    this.settingEl.append(this.nameEl, this.descEl, this.controlEl);
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string): this {
    this.descEl.textContent = desc;
    return this;
  }

  addSlider(cb: (component: SliderComponent) => unknown): this {
    cb(new SliderComponent(this.controlEl));
    return this;
  }

  addDropdown(cb: (component: DropdownComponent) => unknown): this {
    cb(new DropdownComponent(this.controlEl));
    return this;
  }

  addText(cb: (component: TextComponent) => unknown): this {
    cb(new TextComponent(this.controlEl));
    return this;
  }
}

export function setIcon(parent: HTMLElement, iconId: string): void {
  parent.dataset.icon = iconId;
}

export function getLanguage(): string {
  return "en";
}
