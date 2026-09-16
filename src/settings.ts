import {
  DEFAULT_HANDLE_COLOR,
  HANDLE_GUTTER_GAP_PX,
  HANDLE_OFFSET_DEFAULT,
  HANDLE_OFFSET_MAX,
  HANDLE_OFFSET_MIN,
  HANDLE_SIZE_DEFAULT,
  HANDLE_SIZE_MAX,
  HANDLE_SIZE_MIN,
  HANDLE_SIZE_STEP,
} from "./constants";

export interface TinyDraggerSettings {
  handleSize: number;
  handleColorMode: "theme" | "custom";
  handleColor: string;
  handleOffset: number;
}

export const DEFAULT_SETTINGS: TinyDraggerSettings = {
  handleSize: HANDLE_SIZE_DEFAULT,
  handleColorMode: "theme",
  handleColor: DEFAULT_HANDLE_COLOR,
  handleOffset: HANDLE_OFFSET_DEFAULT,
};

export const THEME_HANDLE_COLOR = "var(--interactive-accent)";

export function handleCssColor(settings: TinyDraggerSettings): string {
  return settings.handleColorMode === "custom"
    ? settings.handleColor
    : THEME_HANDLE_COLOR;
}

export function handleCssOffset(settings: TinyDraggerSettings): string {
  return `${settings.handleOffset - settings.handleSize - HANDLE_GUTTER_GAP_PX}px`;
}

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

function evenInRange(
  value: unknown,
  min: number,
  max: number,
  step: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return fallback;
  }
  if (value < min || value > max || (value - min) % step !== 0) {
    return fallback;
  }
  return value;
}

export function normalizeSettings(value: unknown): TinyDraggerSettings {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const handleSize = evenInRange(
    record.handleSize,
    HANDLE_SIZE_MIN,
    HANDLE_SIZE_MAX,
    HANDLE_SIZE_STEP,
    DEFAULT_SETTINGS.handleSize,
  );
  const handleColorMode =
    record.handleColorMode === "custom" || record.handleColorMode === "theme"
      ? record.handleColorMode
      : DEFAULT_SETTINGS.handleColorMode;
  const handleColor =
    typeof record.handleColor === "string" && HEX_COLOR.test(record.handleColor)
      ? record.handleColor.toLowerCase()
      : DEFAULT_SETTINGS.handleColor;
  const handleOffset = evenInRange(
    record.handleOffset,
    HANDLE_OFFSET_MIN,
    HANDLE_OFFSET_MAX,
    1,
    DEFAULT_SETTINGS.handleOffset,
  );
  return { handleSize, handleColorMode, handleColor, handleOffset };
}
