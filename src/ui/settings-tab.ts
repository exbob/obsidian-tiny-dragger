import type { App, SettingDefinitionItem } from "obsidian";
import { PluginSettingTab } from "obsidian";
import {
  HANDLE_OFFSET_MAX,
  HANDLE_OFFSET_MIN,
  HANDLE_SIZE_MAX,
  HANDLE_SIZE_MIN,
  HANDLE_SIZE_STEP,
} from "../constants";
import { t } from "../i18n";
import type TinyDraggerPlugin from "../main";

export class TinyDraggerSettingTab extends PluginSettingTab {
  plugin: TinyDraggerPlugin;

  constructor(app: App, plugin: TinyDraggerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: t("setting.handleColorName"),
        desc: t("setting.handleColorDesc"),
        control: {
          type: "dropdown",
          key: "handleColorMode",
          defaultValue: "theme",
          options: {
            theme: t("setting.handleColorTheme"),
            custom: t("setting.handleColorCustom"),
          },
        },
      },
      {
        name: t("setting.handleColorHex"),
        visible: () => this.plugin.settings.handleColorMode === "custom",
        control: {
          type: "color",
          key: "handleColor",
          defaultValue: this.plugin.settings.handleColor,
        },
      },
      {
        name: t("setting.handleSizeName"),
        desc: t("setting.handleSizeDesc"),
        control: {
          type: "slider",
          key: "handleSize",
          defaultValue: this.plugin.settings.handleSize,
          min: HANDLE_SIZE_MIN,
          max: HANDLE_SIZE_MAX,
          step: HANDLE_SIZE_STEP,
        },
      },
      {
        name: t("setting.handleOffsetName"),
        desc: t("setting.handleOffsetDesc"),
        control: {
          type: "slider",
          key: "handleOffset",
          defaultValue: this.plugin.settings.handleOffset,
          min: HANDLE_OFFSET_MIN,
          max: HANDLE_OFFSET_MAX,
          step: 1,
        },
      },
    ];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    Reflect.set(this.plugin.settings, key, value);
    await this.plugin.saveSettings();
    this.refreshDomState();
  }
}
