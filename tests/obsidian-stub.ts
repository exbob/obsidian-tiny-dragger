type DomElementInfo = {
  cls?: string | string[];
  text?: string | DocumentFragment;
  attr?: Record<string, string | number | boolean | null>;
  title?: string;
  parent?: Node;
  value?: string;
  type?: string;
  prepend?: boolean;
  placeholder?: string;
  href?: string;
};

function applyDomInfo(el: HTMLElement, o?: DomElementInfo | string): void {
  const opts = typeof o === "string" ? { cls: o } : (o ?? {});
  if (opts.cls !== undefined) {
    el.className = Array.isArray(opts.cls) ? opts.cls.join(" ") : opts.cls;
  }
  if (opts.text !== undefined) {
    if (typeof opts.text === "string") {
      el.textContent = opts.text;
    } else {
      el.replaceChildren(opts.text);
    }
  }
  if (opts.attr !== undefined) {
    for (const [key, value] of Object.entries(opts.attr)) {
      if (value === null) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  if (opts.title !== undefined) {
    el.title = opts.title;
  }
  if (opts.type !== undefined && "type" in el) {
    (el as HTMLInputElement).type = opts.type;
  }
  if (opts.value !== undefined && "value" in el) {
    (el as HTMLInputElement).value = opts.value;
  }
  if (opts.placeholder !== undefined && "placeholder" in el) {
    (el as HTMLInputElement).placeholder = opts.placeholder;
  }
  if (opts.href !== undefined && "href" in el) {
    (el as HTMLAnchorElement).href = opts.href;
  }
}

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  o?: DomElementInfo | string,
  callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  applyDomInfo(el, o);
  const parent = typeof o === "object" && o !== null ? o.parent : undefined;
  if (parent !== undefined) {
    if (typeof o === "object" && o?.prepend) {
      parent.insertBefore(el, parent.firstChild);
    } else {
      parent.appendChild(el);
    }
  }
  callback?.(el);
  return el;
}

export function createDiv(
  o?: DomElementInfo | string,
  callback?: (el: HTMLDivElement) => void,
): HTMLDivElement {
  return createEl("div", o, callback);
}

export function createSpan(
  o?: DomElementInfo | string,
  callback?: (el: HTMLSpanElement) => void,
): HTMLSpanElement {
  return createEl("span", o, callback);
}

function installDomHelpers(): void {
  const htmlProto = HTMLElement.prototype as HTMLElement & {
    setCssStyles(styles: Partial<CSSStyleDeclaration>): void;
    setCssProps(props: Record<string, string>): void;
  };
  if (htmlProto.setCssStyles === undefined) {
    htmlProto.setCssStyles = function setCssStyles(
      styles: Partial<CSSStyleDeclaration>,
    ): void {
      Object.assign(this.style, styles);
    };
  }
  if (htmlProto.setCssProps === undefined) {
    htmlProto.setCssProps = function setCssProps(
      props: Record<string, string>,
    ): void {
      for (const [key, value] of Object.entries(props)) {
        this.style.setProperty(key, value);
      }
    };
  }

  const nodeProto = Node.prototype as Node & {
    createEl: typeof createEl;
  };
  if (nodeProto.createEl === undefined) {
    nodeProto.createEl = function nodeCreateEl(tag, o, callback) {
      const opts =
        typeof o === "string"
          ? { cls: o, parent: this }
          : { ...(o ?? {}), parent: o?.parent ?? this };
      return createEl(tag, opts, callback);
    };
  }

  const globalTarget = globalThis as typeof globalThis & {
    createEl: typeof createEl;
    createDiv: typeof createDiv;
    createSpan: typeof createSpan;
  };
  globalTarget.createEl = createEl;
  globalTarget.createDiv = createDiv;
  globalTarget.createSpan = createSpan;
}

installDomHelpers();

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

  onHide(callback: () => unknown): void {
    this.hideCallbacks.push(callback);
  }

  hide(): this {
    for (const callback of this.hideCallbacks.splice(0)) {
      callback();
    }
    return this;
  }

  private readonly hideCallbacks: Array<() => unknown> = [];
}

export class SettingTab {
  app: unknown;
  containerEl: HTMLElement;
  settingItems: unknown[] = [];

  constructor(app: unknown) {
    this.app = app;
    this.containerEl = document.createElement("div");
  }

  getSettingDefinitions(): unknown[] {
    return [];
  }

  update(): void {
    this.settingItems = this.getSettingDefinitions();
  }

  getControlValue(_key: string): unknown {
    return undefined;
  }

  setControlValue(_key: string, _value: unknown): void {}

  refreshDomState(): void {}

  display(): void {}
  hide(): void {}
}

export class PluginSettingTab extends SettingTab {
  plugin: Plugin;

  constructor(app: unknown, plugin: Plugin) {
    super(app);
    this.plugin = plugin;
  }

  getControlValue(key: string): unknown {
    const settings = (this.plugin as Plugin & { settings?: Record<string, unknown> })
      .settings;
    return settings?.[key];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const plugin = this.plugin as Plugin & {
      settings?: Record<string, unknown>;
      saveSettings?: () => Promise<void>;
      saveData?: (data: unknown) => Promise<void>;
    };
    if (plugin.settings !== undefined) {
      plugin.settings[key] = value;
    }
    if (plugin.saveSettings !== undefined) {
      await plugin.saveSettings();
      return;
    }
    if (plugin.saveData !== undefined && plugin.settings !== undefined) {
      await plugin.saveData(plugin.settings);
    }
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

export class ColorComponent {
  private value = "#000000";
  private changeCallback: ((value: string) => unknown) | null = null;
  readonly colorEl: HTMLInputElement;

  constructor(containerEl: HTMLElement) {
    this.colorEl = document.createElement("input");
    this.colorEl.type = "color";
    this.colorEl.addEventListener("input", () => {
      this.value = this.colorEl.value;
      void this.changeCallback?.(this.value);
    });
    containerEl.appendChild(this.colorEl);
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): this {
    this.value = value;
    this.colorEl.value = value;
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

  addColorPicker(cb: (component: ColorComponent) => unknown): this {
    cb(new ColorComponent(this.controlEl));
    return this;
  }
}

export function setIcon(parent: HTMLElement, iconId: string): void {
  parent.dataset.icon = iconId;
}

export function getLanguage(): string {
  return "en";
}

export type SettingDefinitionItem = Record<string, unknown>;
