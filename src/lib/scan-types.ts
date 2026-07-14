export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  category: string; // e.g. "OWASP A03: Injection", "Secret Leak", "Bug"
  file: string;
  line: number | null;
  codeSnippet: string;
  technicalExplanation: string;
  plainEnglish: string;
  suggestedFix: string;
  secureCodeExample: string;
}

export interface ScanResult {
  id: string;
  createdAt: number;
  source: "paste" | "upload" | "github";
  sourceLabel: string; // filename / repo url / "Pasted snippet"
  language: string;
  riskScore: number; // 0-100 (higher = worse)
  summary: string;
  issues: Issue[];
  files: { path: string; language: string; size: number }[];
}
