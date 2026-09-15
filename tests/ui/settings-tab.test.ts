import { describe, expect, it } from "vitest";
import TinyDraggerPlugin from "../../src/main";
import { setLocaleForTests } from "../../src/i18n";
import { DEFAULT_SETTINGS } from "../../src/settings";
import { TinyDraggerSettingTab } from "../../src/ui/settings-tab";

describe("TinyDraggerSettingTab", () => {
  it("renders the four handle settings", () => {
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
    expect(names.join("\n")).toContain("Handle side");
    expect(names.join("\n")).toContain("Handle horizontal offset");
  });
});
