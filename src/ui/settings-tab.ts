import type { App, SettingDefinitionItem } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
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

  display(): void {
    const { containerEl } = this;
    containerEl.replaceChildren();

    const colorSetting = new Setting(containerEl)
      .setName(t("setting.handleColorName"))
      .setDesc(t("setting.handleColorDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("theme", t("setting.handleColorTheme"))
          .addOption("custom", t("setting.handleColorCustom"))
          .setValue(this.plugin.settings.handleColorMode)
          .onChange(async (value) => {
            this.plugin.settings.handleColorMode =
              value === "custom" ? "custom" : "theme";
            await this.plugin.saveSettings();
            this.display();
          });
      });

    if (this.plugin.settings.handleColorMode === "custom") {
      colorSetting.addColorPicker((picker) => {
        picker.setValue(this.plugin.settings.handleColor).onChange(async (value) => {
          this.plugin.settings.handleColor = value;
          await this.plugin.saveSettings();
        });
      });
    }

    new Setting(containerEl)
      .setName(t("setting.handleSizeName"))
      .setDesc(t("setting.handleSizeDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(HANDLE_SIZE_MIN, HANDLE_SIZE_MAX, HANDLE_SIZE_STEP)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.handleSize)
          .onChange(async (value) => {
            this.plugin.settings.handleSize = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("setting.handleOffsetName"))
      .setDesc(t("setting.handleOffsetDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(HANDLE_OFFSET_MIN, HANDLE_OFFSET_MAX, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.handleOffset)
          .onChange(async (value) => {
            this.plugin.settings.handleOffset = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
