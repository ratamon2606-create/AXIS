import {
  cleanupUploads,
  promoteUploads,
  type DirectUpload,
} from "@/lib/direct-uploads";

export async function withPromotedUploads<T>(
  uploads: DirectUpload[],
  itemId: string,
  save: (promoted: DirectUpload[]) => Promise<T>,
): Promise<T> {
  const promoted = await promoteUploads(uploads, itemId);

  try {
    const result = await save(promoted);
    await cleanupUploads(uploads);
    return result;
  } catch (error) {
    await cleanupUploads(promoted);
    throw error;
  }
}
