import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = readFileSync(resolve(root, "docs/LEGAL.md"), "utf8");

function extract(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = end
    ? source.indexOf(end, startIndex + start.length)
    : source.length;
  if (startIndex < 0 || endIndex < 0)
    throw new Error(`Legal section missing: ${start}`);
  return source
    .slice(startIndex + start.length, endIndex)
    .trim()
    .replace(/\s*⚠️\s*\*[^\n]*\*/g, "")
    .replaceAll("Vercel Inc.", "Cloudflare, Inc.")
    .replaceAll("2026년 8월 17일", "2026년 7월 28일");
}

const terms = extract("# 2. 이용약관", "# 3. 환불정책")
  .replace(/\n---\s*$/, "")
  .trim();
const refund = extract("# 3. 환불정책", "# 4. 개인정보처리방침")
  .replace(/\n\*\*필수 이행 사항\*\*[\s\S]*?(?=\n\*\*제3조)/, "\n")
  .replace(/\n---\s*$/, "")
  .trim();
const privacy = extract("# 4. 개인정보처리방침")
  .replace(/\n---\s*$/, "")
  .trim();

function asTemplate(value) {
  return value.replaceAll("`", "\\`").replaceAll("${", "\\${");
}

const output = `// Generated from docs/LEGAL.md by scripts/generate-legal-content.mjs.\n// Edit the source document, then regenerate this file.\n\nexport const TERMS_MARKDOWN = \`${asTemplate(terms)}\`;\n\nexport const REFUND_MARKDOWN = \`${asTemplate(refund)}\`;\n\nexport const PRIVACY_MARKDOWN = \`${asTemplate(privacy)}\`;\n`;

writeFileSync(resolve(root, "lib/legal-content.ts"), output);
