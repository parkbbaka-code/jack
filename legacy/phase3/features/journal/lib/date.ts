export function getKoreanDateId(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function formatJournalDate(journalId: string) {
  const [, month, day] = journalId.split("-");

  if (!month || !day) return journalId;

  return `${Number(month)}월 ${Number(day)}일`;
}
