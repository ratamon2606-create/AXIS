import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectUpload } from "./direct-uploads";

const mocks = vi.hoisted(() => ({
  promoteUploads: vi.fn(),
  cleanupUploads: vi.fn(),
}));

vi.mock("@/lib/direct-uploads", () => mocks);

import { withPromotedUploads } from "./upload-transaction";

const pending: DirectUpload = {
  fileName: "poster.jpg",
  mimeType: "image/jpeg",
  storageKey: "uploads/test/key.jpg",
  size: 500,
};
const persisted: DirectUpload = { ...pending, storageKey: "items/test/key.jpg" };

beforeEach(() => {
  mocks.promoteUploads.mockReset().mockResolvedValue([persisted]);
  mocks.cleanupUploads.mockReset().mockResolvedValue(undefined);
});

describe("upload persistence boundary", () => {
  it("only persists promoted keys and removes temporary uploads after success", async () => {
    const save = vi.fn().mockResolvedValue("saved");
    await expect(withPromotedUploads([pending], "test", save)).resolves.toBe("saved");
    expect(mocks.promoteUploads).toHaveBeenCalledWith([pending], "test");
    expect(save).toHaveBeenCalledWith([persisted]);
    expect(mocks.cleanupUploads).toHaveBeenCalledWith([pending]);
  });

  it("removes promoted keys when database persistence fails", async () => {
    const failure = new Error("database unavailable");
    await expect(withPromotedUploads([pending], "test", async () => { throw failure; })).rejects.toBe(failure);
    expect(mocks.cleanupUploads).toHaveBeenCalledWith([persisted]);
    expect(mocks.cleanupUploads).not.toHaveBeenCalledWith([pending]);
  });
});
