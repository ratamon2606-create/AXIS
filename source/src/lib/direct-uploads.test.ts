import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { attachment: { findUnique: vi.fn().mockResolvedValue(null) } },
}));
vi.mock("@/lib/s3", () => ({
  headObject: vi.fn().mockResolvedValue({ ContentLength: 123, ContentType: "application/pdf" }),
  checkFile: vi.fn(({ size, type }: { size: number; type: string }) =>
    size <= 0 || size > 20 * 1024 * 1024 || type !== "application/pdf" ? "invalid file" : null
  ),
  copyObject: vi.fn(),
  validateStoredFileType: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn(),
}));

import { parseDirectUploadDescriptors, verifyDirectUploads } from "@/lib/direct-uploads";
import { headObject } from "@/lib/s3";
import { db } from "@/lib/db";

const key = "uploads/user123/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.pdf";
const descriptor = { storageKey: key, fileName: "document.pdf", mimeType: "application/pdf", size: 123 };

beforeEach(() => {
  vi.mocked(headObject).mockResolvedValue({ ContentLength: 123, ContentType: "application/pdf" } as never);
  vi.mocked(db.attachment.findUnique).mockResolvedValue(null);
});

describe("server-side direct upload claims", () => {
  it("checks an uploaded object before accepting metadata", async () => {
    await expect(verifyDirectUploads(JSON.stringify([descriptor]), "user123")).resolves.toEqual([descriptor]);
    expect(headObject).toHaveBeenCalledWith(key);
  });
  it("rejects keys belonging to another editor", async () => {
    await expect(verifyDirectUploads(JSON.stringify([descriptor]), "someoneelse")).rejects.toThrow();
  });
  it("rejects replays of an already claimed object", async () => {
    vi.mocked(db.attachment.findUnique).mockResolvedValue({ id: "old" } as never);
    await expect(verifyDirectUploads(JSON.stringify([descriptor]), "user123")).rejects.toThrow(/ถูกใช้งาน/);
  });
  it("rejects a mismatched object length", async () => {
    vi.mocked(headObject).mockResolvedValue({ ContentLength: 124, ContentType: "application/pdf" } as never);
    await expect(verifyDirectUploads(JSON.stringify([descriptor]), "user123")).rejects.toThrow(/ไม่ตรงกัน/);
  });
  it("rejects duplicate attachment keys and extra files", async () => {
    await expect(verifyDirectUploads(JSON.stringify([descriptor, descriptor]), "user123")).rejects.toThrow(/ซ้ำ/);
    await expect(verifyDirectUploads(JSON.stringify([descriptor, descriptor]), "user123", 1)).rejects.toThrow(/สูงสุด/);
  });
});

describe("pure direct-upload descriptor validation", () => {
  it("accepts verified descriptor shapes without touching cloud storage", () => {
    expect(parseDirectUploadDescriptors(JSON.stringify([descriptor]), "user123")).toEqual([descriptor]);
  });
  it("accepts no uploads when no descriptor was supplied", () => {
    expect(parseDirectUploadDescriptors(null, "user123")).toEqual([]);
  });
  it("rejects malformed JSON", () => {
    expect(() => parseDirectUploadDescriptors("[bad", "user123")).toThrow(/ไม่ถูกต้อง/);
  });
  it("rejects files with invalid size", () => {
    expect(() => parseDirectUploadDescriptors(JSON.stringify([{ ...descriptor, size: -1 }]), "user123")).toThrow();
  });
  it("rejects duplicate files before contacting storage", () => {
    expect(() => parseDirectUploadDescriptors(JSON.stringify([descriptor, descriptor]), "user123")).toThrow(/ซ้ำ/);
  });
});
