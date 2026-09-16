import { describe, expect, it } from "vitest";
import TinyDraggerPlugin from "../../src/main";
import { setLocaleForTests } from "../../src/i18n";
import { DEFAULT_SETTINGS } from "../../src/settings";
import { TinyDraggerSettingTab } from "../../src/ui/settings-tab";

describe("TinyDraggerSettingTab", () => {
  it("exposes handle settings without a side control", () => {
    setLocaleForTests("en");
    const plugin = new TinyDraggerPlugin(
      {} as never,
      { id: "tiny-dragger" } as never,
    );
    plugin.settings = { ...DEFAULT_SETTINGS };
    const tab = new TinyDraggerSettingTab({} as never, plugin);
    const definitions = tab.getSettingDefinitions();
    const names = definitions.map((item) => (item as { name?: string }).name ?? "");
    expect(names).toContain("Handle size");
    expect(names).toContain("Handle color");
    expect(names.indexOf("Handle color")).toBeLessThan(names.indexOf("Handle size"));
    expect(names.join("\n")).not.toContain("Handle side");
    expect(names).toContain("Handle horizontal offset");
  });

  it("shows the color control only in custom mode", () => {
    setLocaleForTests("en");
    const plugin = new TinyDraggerPlugin(
      {} as never,
      { id: "tiny-dragger" } as never,
    );
    plugin.settings = {
      ...DEFAULT_SETTINGS,
      handleColorMode: "custom",
      handleColor: "#aabbcc",
    };
    const tab = new TinyDraggerSettingTab({} as never, plugin);
    const colorDef = tab
      .getSettingDefinitions()
      .find((item) => (item as { name?: string }).name === "Custom color") as
      | { visible?: () => boolean; control?: { key?: string; defaultValue?: string } }
      | undefined;
    expect(colorDef).toBeDefined();
    expect(colorDef?.control?.key).toBe("handleColor");
    expect(colorDef?.control?.defaultValue).toBe("#aabbcc");
    expect(colorDef?.visible?.()).toBe(true);

    plugin.settings.handleColorMode = "theme";
    expect(colorDef?.visible?.()).toBe(false);
  });
});
