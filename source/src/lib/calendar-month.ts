/** Calendar month is a Bangkok civil month, never tied to a server host timezone. */
export function calendarMonth(value?: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", timeZone: "Asia/Bangkok" }).formatToParts(now);
  let year = Number(parts.find((p) => p.type === "year")?.value);
  let month = Number(parts.find((p) => p.type === "month")?.value);
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (match && Number(match[1]) >= 2000 && Number(match[1]) <= 2100 && Number(match[2]) >= 1 && Number(match[2]) <= 12) {
    year = Number(match[1]); month = Number(match[2]);
  }
  const first = (y: number, m: number) => new Date(Date.UTC(y, m - 1, 0, 17));                                               
  const start = first(year, month);
  const next = month === 12 ? first(year + 1, 1) : first(year, month + 1);
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    year, month, start, next,
    days: new Date(Date.UTC(year, month, 0)).getUTCDate(),
    leading: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    previousKey: `${previousYear}-${String(previousMonth).padStart(2, "0")}`,
    nextKey: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
  };
}
