import { describe, expect, it } from "vitest";
import { resolveCoverAttachmentId } from "./cover-image";

describe("announcement cover selection", () => {
  const images = [{ id: "first" }, { id: "second" }, { id: "third" }];
  it("uses the explicitly selected image", () => {
    expect(resolveCoverAttachmentId(images, "third")).toBe("third");
  });
  it("falls back to the first image when none has been chosen", () => {
    expect(resolveCoverAttachmentId(images, null)).toBe("first");
  });
  it("does not display a stale or foreign cover id", () => {
    expect(resolveCoverAttachmentId(images, "from-other-item")).toBe("first");
  });
  it("handles announcements with no images", () => {
    expect(resolveCoverAttachmentId([], "stale")).toBeNull();
  });
});
