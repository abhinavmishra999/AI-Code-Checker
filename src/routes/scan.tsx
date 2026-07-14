import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, Github, FileCode, ShieldCheck } from "lucide-react";
import { analyzeCode, fetchGithubRepo } from "@/lib/scans.functions";
import { saveScan } from "@/lib/scan-store";
import type { ScanResult } from "@/lib/scan-types";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan code · AI Code Checker" },
      {
        name: "description",
        content:
          "Paste code, upload a file, or scan a GitHub repository for security vulnerabilities and leaked secrets.",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeCode);
  const ghFetch = useServerFn(fetchGithubRepo);
  const [busy, setBusy] = useState(false);

  const [snippet, setSnippet] = useState("");
  const [snippetName, setSnippetName] = useState("snippet.txt");

  const [repoUrl, setRepoUrl] = useState("");
  const [ghToken, setGhToken] = useState("");

  async function runAnalysis(
    source: ScanResult["source"],
    sourceLabel: string,
    files: { path: string; content: string }[],
  ) {
    if (files.length === 0) {
      toast.error("No code to analyze");
      return;
    }
    setBusy(true);
    try {
      const result = await analyze({ data: { files } });
      const scan: ScanResult = {
        id:
          globalThis.crypto?.randomUUID?.() ??
          `s_${Date.now().toString(36)}`,
        createdAt: Date.now(),
        source,
        sourceLabel,
        language: result.language,
        riskScore: Math.max(0, Math.min(100, Math.round(result.riskScore))),
        summary: result.summary,
        issues: result.issues.map((i, idx) => ({
          ...i,
          id: `${idx}_${i.file}_${i.line ?? 0}`,
        })),
        files: files.map((f) => ({
          path: f.path,
          language: guessLang(f.path),
          size: f.content.length,
        })),
      };
      saveScan(scan);
      toast.success(`Scan complete — ${scan.issues.length} issue(s) found`);
      navigate({ to: "/results" });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(f: File) {
    const text = await f.text();
    await runAnalysis("upload", f.name, [{ path: f.name, content: text }]);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Scan your code</h1>
          <p className="mt-1 text-muted-foreground">
            Paste a snippet, upload a file, or point us at a GitHub repository.
          </p>
        </div>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste">
              <FileCode className="mr-2 h-4 w-4" /> Paste
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="github">
              <Github className="mr-2 h-4 w-4" /> GitHub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Filename</label>
              <Input
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Textarea
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="// Paste your code here…"
              className="min-h-[320px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button
                disabled={busy || !snippet.trim()}
                onClick={() =>
                  runAnalysis("paste", snippetName || "snippet.txt", [
                    { path: snippetName || "snippet.txt", content: snippet },
                  ])
                }
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Analyze
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <label
              className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 p-8 text-center transition-colors hover:border-emerald-500/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">Click or drop a file here</div>
                <p className="text-sm text-muted-foreground">
                  Any source file (.js, .ts, .py, .go, .rb, …)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </div>
              )}
            </label>
          </TabsContent>

          <TabsContent value="github" className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repository URL</label>
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                GitHub token{" "}
                <span className="text-xs text-muted-foreground">
                  (optional · needed for private repos)
                </span>
              </label>
              <Input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_… (stays in-session, never persisted)"
              />
              <p className="text-xs text-muted-foreground">
                We fetch up to 20 source files under 60KB each. Token is sent only for this request.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={busy || !repoUrl.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await ghFetch({
                      data: { url: repoUrl, token: ghToken || undefined },
                    });
                    if (res.files.length === 0) {
                      toast.error("No scannable source files found in repo");
                      setBusy(false);
                      return;
                    }
                    toast.info(`Fetched ${res.files.length} files, analyzing…`);
                    await runAnalysis(
                      "github",
                      `${res.owner}/${res.repo}@${res.branch}`,
                      res.files,
                    );
                  } catch (e) {
                    console.error(e);
                    toast.error(
                      e instanceof Error ? e.message : "GitHub fetch failed",
                    );
                    setBusy(false);
                  }
                }}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                Scan repository
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function guessLang(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    php: "PHP",
    cs: "C#",
    cpp: "C++",
    c: "C",
  };
  return map[ext] ?? "Unknown";
}
