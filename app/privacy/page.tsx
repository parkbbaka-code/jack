import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/legal-page";
import { PRIVACY_MARKDOWN } from "@/lib/legal-content";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return <LegalPage markdown={PRIVACY_MARKDOWN} title="개인정보처리방침" />;
}
