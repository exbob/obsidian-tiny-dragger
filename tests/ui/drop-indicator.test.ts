import { describe, expect, it } from "vitest";
import { DropIndicator } from "../../src/ui/drop-indicator";

describe("DropIndicator", () => {
  it("offsets the drop line left edge for nested indent", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = {
      scrollDOM: host,
    } as never;

    const indicator = new DropIndicator();
    indicator.attach(view);
    indicator.show(40, 96);

    const line = host.querySelector(".tiny-dragger-drop-line") as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.hidden).toBe(false);
    expect(line.style.top).toBe("40px");
    expect(line.style.left).toBe("96px");
    expect(line.style.right).toBe("0px");

    indicator.hide();
    expect(line.hidden).toBe(true);
    indicator.detach();
    host.remove();
  });
});
