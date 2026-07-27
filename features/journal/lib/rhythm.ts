const DAY_IN_MS = 86400000;

function toDayNumber(journalId: string) {
  const [year, month, day] = journalId.split("-").map(Number);

  if (!year || !month || !day) return null;

  return Date.UTC(year, month - 1, day) / DAY_IN_MS;
}

export function describeRhythm(journalIds: string[], nowJournalId: string) {
  const today = toDayNumber(nowJournalId);

  if (today === null) return null;

  const activeDays = [...new Set(journalIds)]
    .map(toDayNumber)
    .filter(
      (day): day is number => day !== null && day <= today && day > today - 30,
    )
    .sort((a, b) => a - b);

  if (activeDays.length === 0) return null;
  if (activeDays.length === 1) return "처음의 한 걸음이 나무에 남았어요.";

  const gaps = activeDays
    .slice(1)
    .map((day, index) => day - activeDays[index]!);
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  if (averageGap <= 2) return "자주 돌아와 나무를 돌보고 있어요.";
  if (averageGap <= 5) return "당신만의 느긋한 리듬으로 이어가고 있어요.";

  return "생각날 때마다 돌아오는 리듬도 충분히 아름다워요.";
}
