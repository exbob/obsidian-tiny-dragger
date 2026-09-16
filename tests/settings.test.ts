import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  handleCssColor,
  handleCssOffset,
  normalizeSettings,
  THEME_HANDLE_COLOR,
} from "../src/settings";

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
      handleOffset: -12,
    });
    expect("handleSide" in settings).toBe(false);
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

describe("handleCssColor", () => {
  it("uses the theme accent variable by default", () => {
    expect(handleCssColor(DEFAULT_SETTINGS)).toBe(THEME_HANDLE_COLOR);
    expect(THEME_HANDLE_COLOR).toBe("var(--interactive-accent)");
  });

  it("uses the stored hex in custom mode", () => {
    expect(
      handleCssColor({
        ...DEFAULT_SETTINGS,
        handleColorMode: "custom",
        handleColor: "#aabbcc",
      }),
    ).toBe("#aabbcc");
  });
});

describe("handleCssOffset", () => {
  it("insets the left handle 10px toward the content", () => {
    expect(handleCssOffset(DEFAULT_SETTINGS)).toBe("10px");
    expect(
      handleCssOffset({
        ...DEFAULT_SETTINGS,
        handleOffset: 5,
      }),
    ).toBe("15px");
  });
});
