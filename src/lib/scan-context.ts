import type { ScanResult } from "./scan-types";

export function buildScanContext(scan: ScanResult): string {
  const header = `Source: ${scan.sourceLabel}
Language: ${scan.language}
Risk score: ${scan.riskScore}/100
Files analyzed: ${scan.files.map((f) => f.path).join(", ")}
Summary: ${scan.summary}
Total issues: ${scan.issues.length}`;

  const issues = scan.issues
    .map(
      (i, idx) =>
        `#${idx + 1} [${i.severity.toUpperCase()}] ${i.title} (${i.category})
  File: ${i.file}${i.line ? `:${i.line}` : ""}
  Plain: ${i.plainEnglish}
  Fix: ${i.suggestedFix}`,
    )
    .join("\n\n");

  return `${header}\n\nISSUES:\n${issues}`;
}
