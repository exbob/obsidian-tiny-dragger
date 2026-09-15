import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type TinyDraggerSettings,
} from "./settings";

export default class TinyDraggerPlugin extends Plugin {
  settings: TinyDraggerSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }
}
