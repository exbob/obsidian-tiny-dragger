import type { App } from "obsidian";
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
      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = this.plugin.settings.handleColor;
      picker.setAttribute("aria-label", t("setting.handleColorHex"));
      picker.addEventListener("input", () => {
        this.plugin.settings.handleColor = picker.value;
        void this.plugin.saveSettings();
      });
      colorSetting.controlEl.append(picker);
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
