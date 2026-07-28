import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./legal-page.module.css";

function inline(text: string): ReactNode {
  const parts = text.split("**");
  return parts.map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part,
  );
}

function isTableDivider(line: string) {
  return /^\|(?:\s*:?-+:?\s*\|)+$/.test(line.trim());
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function MarkdownBody({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (!line || line === "---") continue;

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index]?.trim().startsWith("|")) {
        const candidate = lines[index]?.trim() ?? "";
        if (!isTableDivider(candidate)) rows.push(tableCells(candidate));
        index += 1;
      }
      index -= 1;
      const [header = [], ...body] = rows;
      nodes.push(
        <div className={styles.tableWrap} key={`table-${index}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex}>{inline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{inline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line === "```") {
      const content: string[] = [];
      index += 1;
      while (index < lines.length && lines[index]?.trim() !== "```") {
        content.push(lines[index] ?? "");
        index += 1;
      }
      nodes.push(
        <pre className={styles.codeBlock} key={`code-${index}`}>
          {content.join("\n")}
        </pre>,
      );
      continue;
    }

    if (/^\*\*[^*]+\*\*$/.test(line)) {
      nodes.push(<h2 key={index}>{line.slice(2, -2)}</h2>);
    } else if (line.startsWith(">")) {
      nodes.push(
        <p className={styles.quote} key={index}>
          {inline(line.replace(/^>\s*/, ""))}
        </p>,
      );
    } else if (/^(?:\d+\.|-)\s/.test(line)) {
      nodes.push(
        <p className={styles.listItem} key={index}>
          {inline(line)}
        </p>,
      );
    } else {
      nodes.push(<p key={index}>{inline(line)}</p>);
    }
  }

  return <div className={styles.body}>{nodes}</div>;
}

export function LegalPage({
  title,
  markdown,
}: {
  title: string;
  markdown: string;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className="font-serif tracking-[0.16em]" href="/">
            이루리
          </Link>
          <Link href="/wishtree">소원나무</Link>
        </header>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.effective}>시행일 2026년 7월 28일</p>
        <MarkdownBody markdown={markdown} />
      </div>
    </main>
  );
}
