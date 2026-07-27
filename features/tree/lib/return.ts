import { getKoreanDateId } from "@/features/journal/lib/date";

export type ReturnTier = "none" | "soft" | "season" | "wildflower" | "company";

export function getAwayDays(lastWateredAt: Date | null, now = new Date()) {
  if (!lastWateredAt) return 0;

  const [lastYear, lastMonth, lastDay] = getKoreanDateId(lastWateredAt)
    .split("-")
    .map(Number) as [number, number, number];
  const [nowYear, nowMonth, nowDay] = getKoreanDateId(now)
    .split("-")
    .map(Number) as [number, number, number];

  const lastDayAtMidnight = Date.UTC(lastYear, lastMonth - 1, lastDay);
  const nowAtMidnight = Date.UTC(nowYear, nowMonth - 1, nowDay);

  return Math.max(
    0,
    Math.floor((nowAtMidnight - lastDayAtMidnight) / 86400000),
  );
}

export function getReturnTier(awayDays: number): ReturnTier {
  if (awayDays < 3) return "none";
  if (awayDays < 7) return "soft";
  if (awayDays < 30) return "season";
  if (awayDays < 90) return "wildflower";

  return "company";
}

export function getReturnMessage(awayDays: number) {
  switch (getReturnTier(awayDays)) {
    case "soft":
      return "나무는 조용히 기다리고 있었어요. 오늘의 한 걸음부터 다시 시작해요.";
    case "season":
      return "계절이 한 번 바뀌었네요. 나무는 그대로 당신을 기다리고 있었어요.";
    case "wildflower":
      return "오랜만이에요. 기다리는 동안 작은 들꽃들이 곁을 지켜주었어요.";
    case "company":
      return "돌아와줘서 반가워요. 나무는 늘 이 자리에 있었어요.";
    case "none":
      return null;
  }
}
