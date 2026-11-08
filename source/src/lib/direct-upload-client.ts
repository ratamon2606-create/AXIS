"use client";

import { requestDirectUpload } from "@/app/actions/direct-upload";
import type { DirectUpload } from "@/lib/direct-uploads";

export async function uploadDirect(files: File[]): Promise<DirectUpload[]> {
  const result: DirectUpload[] = [];
  for (const file of files) {
    const ticket = await requestDirectUpload(file.name, file.type, file.size);
    const response = await fetch(ticket.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!response.ok) throw new Error(`อัปโหลด ${file.name} ไม่สำเร็จ (HTTP ${response.status})`);
    result.push({ storageKey: ticket.storageKey, fileName: file.name, mimeType: file.type, size: file.size });
  }
  return result;
}
