/** Select a stored image cover only when it belongs to the current announcement. */
export function resolveCoverAttachmentId(
  images: ReadonlyArray<{ id: string }>,
  selectedId: string | null | undefined,
): string | null {
  if (selectedId && images.some((image) => image.id === selectedId)) return selectedId;
  return images[0]?.id ?? null;
}
