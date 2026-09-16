import { describe, expect, it } from "vitest";
import TinyDraggerPlugin from "../../src/main";
import { setLocaleForTests } from "../../src/i18n";
import { DEFAULT_SETTINGS } from "../../src/settings";
import { TinyDraggerSettingTab } from "../../src/ui/settings-tab";

describe("TinyDraggerSettingTab", () => {
  it("renders the handle settings without a side control", () => {
    setLocaleForTests("en");
    const plugin = new TinyDraggerPlugin(
      {} as never,
      { id: "tiny-dragger" } as never,
    );
    plugin.settings = { ...DEFAULT_SETTINGS };
    const tab = new TinyDraggerSettingTab({} as never, plugin);
    tab.display();
    const names = [...tab.containerEl.querySelectorAll("div")].map(
      (el) => el.textContent,
    );
    expect(names.join("\n")).toContain("Handle size");
    expect(names.join("\n")).toContain("Handle color");
    expect(names.join("\n").indexOf("Handle color")).toBeLessThan(
      names.join("\n").indexOf("Handle size"),
    );
    expect(names.join("\n")).not.toContain("Handle side");
    expect(names.join("\n")).toContain("Handle horizontal offset");
    expect(tab.containerEl.querySelector('input[type="color"]')).toBeNull();
  });

  it("shows a color picker with the current color only in custom mode", () => {
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
    tab.display();
    const picker = tab.containerEl.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement | null;
    expect(picker).not.toBeNull();
    expect(picker?.value).toBe("#aabbcc");
  });

  it("exposes declarative setting definitions for Obsidian search", () => {
    setLocaleForTests("en");
    const plugin = new TinyDraggerPlugin(
      {} as never,
      { id: "tiny-dragger" } as never,
    );
    plugin.settings = { ...DEFAULT_SETTINGS };
    const tab = new TinyDraggerSettingTab({} as never, plugin);
    const definitions = tab.getSettingDefinitions();
    const names = definitions.map((item) => (item as { name?: string }).name);
    expect(names).toContain("Handle color");
    expect(names).toContain("Handle size");
    expect(names).toContain("Handle horizontal offset");
  });
});
