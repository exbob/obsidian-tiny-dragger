import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/settings";

describe("normalizeSettings", () => {
  it("returns defaults for invalid payloads", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ handleSize: 19, handleOffset: 999 })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it("keeps in-range values", () => {
    const settings = normalizeSettings({
      handleSize: 24,
      handleColorMode: "custom",
      handleColor: "#aabbcc",
      handleSide: "right",
      handleOffset: -12,
    });
    expect(settings).toEqual({
      handleSize: 24,
      handleColorMode: "custom",
      handleColor: "#aabbcc",
      handleSide: "right",
      handleOffset: -12,
    });
  });

  it("rejects non-hex custom colors", () => {
    expect(
      normalizeSettings({
        ...DEFAULT_SETTINGS,
        handleColorMode: "custom",
        handleColor: "red",
      }).handleColor,
    ).toBe(DEFAULT_SETTINGS.handleColor);
  });
});
