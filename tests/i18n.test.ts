import { describe, expect, it } from "vitest";
import { en } from "../src/i18n/en";
import { t, resolveLocale, setLocaleForTests } from "../src/i18n";
import { MESSAGE_KEYS } from "../src/i18n/types";
import { zh } from "../src/i18n/zh";

describe("i18n", () => {
  it("maps zh* to Chinese and everything else to English", () => {
    expect(resolveLocale("zh")).toBe("zh");
    expect(resolveLocale("zh-TW")).toBe("zh");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
  });

  it("has the same keys in both catalogs", () => {
    expect(Object.keys(en).sort()).toEqual([...MESSAGE_KEYS].sort());
    expect(Object.keys(zh).sort()).toEqual([...MESSAGE_KEYS].sort());
  });

  it("interpolates notices", () => {
    setLocaleForTests("en");
    expect(t("notice.convertFailed", { detail: "boom" })).toBe(
      "Could not convert this block: boom",
    );
    setLocaleForTests("zh");
    expect(t("notice.convertFailed", { detail: "boom" })).toBe(
      "无法转换该块：boom",
    );
  });
});
