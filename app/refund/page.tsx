import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/legal-page";
import { REFUND_MARKDOWN } from "@/lib/legal-content";

export const metadata: Metadata = { title: "환불정책" };

export default function RefundPage() {
  return <LegalPage markdown={REFUND_MARKDOWN} title="환불정책" />;
}
