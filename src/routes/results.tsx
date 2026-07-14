import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { loadScan } from "@/lib/scan-store";
import type { Issue, ScanResult, Severity } from "@/lib/scan-types";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ScanLine,
} from "lucide-react";
import { newThreadId, upsertThread } from "@/lib/thread-store";
import { buildScanContext } from "@/lib/scan-context";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Scan results · AI Code Checker" },
      {
        name: "description",
        content:
          "Risk score dashboard and detailed findings from your AI code security scan.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanResult | null>(null);
  useEffect(() => {
    setScan(loadScan());
  }, []);

  if (!scan) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <ScanLine className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">No scan loaded</h1>
          <p className="mt-2 text-muted-foreground">
            Run a scan to see your risk dashboard and findings.
          </p>
          <div className="mt-6">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Start a scan
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const counts = countBySeverity(scan.issues);
  const riskColor = riskColorFor(scan.riskScore);

  function askAboutScan() {
    const id = newThreadId();
    upsertThread({
      id,
      title: `Chat about ${scan!.sourceLabel}`,
      updatedAt: Date.now(),
      scanId: scan!.id,
      messages: [],
    });
    // stash the compiled context under the thread's scan id
    sessionStorage.setItem(
      `acc.scanContext.${scan!.id}`,
      buildScanContext(scan!),
    );
    navigate({ to: "/chat/$threadId", params: { threadId: id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Scan · {new Date(scan.createdAt).toLocaleString()}
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {scan.sourceLabel}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {scan.language} · {scan.files.length} file
              {scan.files.length === 1 ? "" : "s"} analyzed
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/scan" })}>
              New scan
            </Button>
            <Button onClick={askAboutScan}>
              <MessageSquare className="mr-2 h-4 w-4" /> Ask the AI
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div
            className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2"
            style={{ borderColor: riskColor.border }}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Risk score
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div
                className="text-6xl font-bold"
                style={{ color: riskColor.fg }}
              >
                {scan.riskScore}
              </div>
              <div className="text-sm text-muted-foreground">/ 100</div>
              <Badge
                className="ml-auto"
                style={{ backgroundColor: riskColor.fg, color: "#000" }}
              >
                {riskColor.label}
              </Badge>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full transition-all"
                style={{
                  width: `${scan.riskScore}%`,
                  backgroundColor: riskColor.fg,
                }}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{scan.summary}</p>
          </div>

          <StatCard label="Critical" value={counts.critical} tone="critical" />
          <StatCard label="High" value={counts.high} tone="high" />
          <StatCard label="Medium" value={counts.medium} tone="medium" />
          <StatCard label="Low / Info" value={counts.low + counts.info} tone="low" />
        </section>

        {/* Issues */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Findings</h2>
          {scan.issues.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-6">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="font-medium">Clean scan</div>
                <p className="text-sm text-muted-foreground">
                  No issues detected. Great work.
                </p>
              </div>
            </div>
          ) : (
            <Accordion type="multiple" className="mt-4 space-y-2">
              {scan.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </Accordion>
          )}
        </section>
      </main>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const c = severityColor(issue.severity);
  return (
    <AccordionItem
      value={issue.id}
      className="overflow-hidden rounded-xl border border-border bg-card/50"
      style={{ borderLeft: `4px solid ${c.fg}` }}
    >
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex flex-1 items-center gap-3 text-left">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: c.fg }} />
          <span
            className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
            style={{ backgroundColor: c.bg, color: c.fg }}
          >
            {issue.severity}
          </span>
          <span className="font-medium">{issue.title}</span>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
            {issue.file}
            {issue.line ? `:${issue.line}` : ""}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border/60 bg-background/40 px-4 pt-4">
        <div className="mb-3 text-xs text-muted-foreground">
          {issue.category} · {issue.file}
          {issue.line ? `:${issue.line}` : ""}
        </div>

        <pre className="overflow-x-auto rounded-md bg-background p-3 font-mono text-xs">
          <code>{issue.codeSnippet}</code>
        </pre>

        <Tabs defaultValue="plain" className="mt-4">
          <TabsList>
            <TabsTrigger value="plain">Plain English</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="fix">Fix</TabsTrigger>
          </TabsList>
          <TabsContent value="plain" className="prose-invert pt-3 text-sm">
            {issue.plainEnglish}
          </TabsContent>
          <TabsContent value="technical" className="pt-3 text-sm">
            {issue.technicalExplanation}
          </TabsContent>
          <TabsContent value="fix" className="pt-3">
            <p className="text-sm">{issue.suggestedFix}</p>
            <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
              Secure example
            </div>
            <pre className="mt-1 overflow-x-auto rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 font-mono text-xs">
              <code>{issue.secureCodeExample}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Severity;
}) {
  const c = severityColor(tone);
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold" style={{ color: c.fg }}>
        {value}
      </div>
    </div>
  );
}

function countBySeverity(issues: Issue[]) {
  const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const i of issues) c[i.severity]++;
  return c;
}

function severityColor(s: Severity) {
  switch (s) {
    case "critical":
      return { fg: "#f43f5e", bg: "rgba(244,63,94,0.12)" };
    case "high":
      return { fg: "#fb923c", bg: "rgba(251,146,60,0.12)" };
    case "medium":
      return { fg: "#facc15", bg: "rgba(250,204,21,0.12)" };
    case "low":
      return { fg: "#38bdf8", bg: "rgba(56,189,248,0.12)" };
    case "info":
      return { fg: "#a3a3a3", bg: "rgba(163,163,163,0.12)" };
  }
}

function riskColorFor(score: number) {
  if (score >= 75)
    return { fg: "#f43f5e", border: "rgba(244,63,94,0.4)", label: "Critical" };
  if (score >= 50)
    return { fg: "#fb923c", border: "rgba(251,146,60,0.4)", label: "High" };
  if (score >= 25)
    return { fg: "#facc15", border: "rgba(250,204,21,0.4)", label: "Medium" };
  return { fg: "#34d399", border: "rgba(52,211,153,0.4)", label: "Low" };
}
