import { describe, expect, it } from "vitest";
import {
  DRAG_THRESHOLD_PX,
  HANDLE_OFFSET_DEFAULT,
  HANDLE_OFFSET_MAX,
  HANDLE_OFFSET_MIN,
  HANDLE_GUTTER_GAP_PX,
  HANDLE_SIZE_DEFAULT,
  HANDLE_SIZE_MAX,
  HANDLE_SIZE_MIN,
  HANDLE_SIZE_STEP,
  MIN_APP_VERSION,
  PLUGIN_ID,
  PLUGIN_NAME,
} from "../src/constants";

describe("constants", () => {
  it("identifies the plugin and drag threshold from the spec", () => {
    expect(PLUGIN_ID).toBe("tiny-dragger");
    expect(PLUGIN_NAME).toBe("Tiny Dragger");
    expect(MIN_APP_VERSION).toBe("1.7.2");
    expect(DRAG_THRESHOLD_PX).toBe(4);
    expect(HANDLE_SIZE_MIN).toBe(12);
    expect(HANDLE_SIZE_MAX).toBe(28);
    expect(HANDLE_SIZE_STEP).toBe(2);
    expect(HANDLE_SIZE_DEFAULT).toBe(20);
    expect(HANDLE_OFFSET_MIN).toBe(-80);
    expect(HANDLE_OFFSET_MAX).toBe(80);
    expect(HANDLE_OFFSET_DEFAULT).toBe(0);
    expect(HANDLE_GUTTER_GAP_PX).toBe(8);
  });
});
