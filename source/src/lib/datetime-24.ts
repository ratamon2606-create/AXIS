/**
 * Keep Bangkok wall-clock values in the exact YYYY-MM-DDTHH:mm form the
 * existing server-side parser expects. No timezone or 12-hour conversion.
 */
export function splitDateTime24(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return {
    date: match?.[1] ?? "",
    hour: match?.[2] ?? "00",
    minute: match?.[3] ?? "00",
  };
}

export function joinDateTime24(date: string, hour: string, minute: string): string {
  return date ? `${date}T${hour}:${minute}` : "";
}
