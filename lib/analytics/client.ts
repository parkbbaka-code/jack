export type AnalyticsEventName =
  | "wishtree_viewed"
  | "signup_completed"
  | "paper_hung"
  | "paper_edited"
  | "paper_fulfilled"
  | "paper_taken_down"
  | "paper_opened"
  | "mywish_located"
  | "share_created"
  | "report_submitted";

type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(
  name: AnalyticsEventName,
  properties: EventProperties = {},
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({ name, properties });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/events",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
