import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/legal-page";
import { TERMS_MARKDOWN } from "@/lib/legal-content";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return <LegalPage markdown={TERMS_MARKDOWN} title="이용약관" />;
}
