import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const IssueSchema = z.object({
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  category: z.string(),
  file: z.string(),
  line: z.number().nullable(),
  codeSnippet: z.string(),
  technicalExplanation: z.string(),
  plainEnglish: z.string(),
  suggestedFix: z.string(),
  secureCodeExample: z.string(),
});

const AnalysisSchema = z.object({
  language: z.string(),
  riskScore: z.number(),
  summary: z.string(),
  issues: z.array(IssueSchema),
});

const InputSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
      }),
    )
    .min(1),
});

const SYSTEM_PROMPT = `You are a senior application security engineer and code reviewer.
Analyze the provided source code files for:
- OWASP Top 10 vulnerabilities (injection, broken auth, XSS, SSRF, IDOR, etc.)
- Hardcoded secrets, API keys, tokens, passwords, private keys ("code leakage")
- Common bugs, logic errors, unsafe patterns
- Insecure dependencies or deprecated APIs

For EVERY issue you find, output:
- title: short name
- severity: critical | high | medium | low | info
- category: e.g. "OWASP A03: Injection", "Secret Leak", "Bug", "OWASP A01: Broken Access Control"
- file: exact filename
- line: line number if identifiable, else null
- codeSnippet: 1-8 lines of the offending code
- technicalExplanation: precise, developer-focused explanation of the vulnerability
- plainEnglish: simple jargon-free explanation for a non-technical person (2-3 sentences, business impact)
- suggestedFix: concrete steps to remediate
- secureCodeExample: a corrected code snippet demonstrating the fix

Also produce:
- language: dominant language detected
- riskScore: 0-100 (0 = perfectly safe, 100 = extremely risky). Weight critical/high issues heavily.
- summary: 2-3 sentence executive summary

Be thorough but avoid false positives. If code is clean, return an empty issues array with a low riskScore.`;

export const analyzeCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    // Cap content per file to keep prompts reasonable
    const MAX_PER_FILE = 20_000;
    const MAX_TOTAL = 120_000;
    let total = 0;
    const trimmed = data.files.map((f) => {
      const remaining = Math.max(0, MAX_TOTAL - total);
      const content = f.content.slice(0, Math.min(MAX_PER_FILE, remaining));
      total += content.length;
      return { path: f.path, content };
    });

    const prompt = trimmed
      .map(
        (f) =>
          `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE: ${f.path} ---`,
      )
      .join("\n\n");

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        output: Output.object({ schema: AnalysisSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          language: "unknown",
          riskScore: 0,
          summary:
            "The analyzer could not produce a structured result. Try a smaller snippet or fewer files.",
          issues: [],
        };
      }
      throw error;
    }
  });

const RepoInput = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.includes("github.com"), "Must be a GitHub URL"),
  token: z.string().optional(),
});

const CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "php",
  "cs",
  "cpp",
  "c",
  "h",
  "hpp",
  "swift",
  "sh",
  "sql",
  "vue",
  "svelte",
  "html",
  "env",
  "yml",
  "yaml",
  "toml",
]);

const IGNORE = /node_modules|dist|build|\.next|\.turbo|\.git|vendor|__pycache__|target/;

export const fetchGithubRepo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RepoInput.parse(input))
  .handler(async ({ data }) => {
    const m = data.url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
    if (!m) throw new Error("Invalid GitHub URL");
    const owner = m[1];
    const repo = m[2].replace(/\.git$/, "");

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ai-code-checker",
    };
    if (data.token) headers.Authorization = `Bearer ${data.token}`;

    // Get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });
    if (!repoRes.ok) {
      const body = await repoRes.text();
      if (repoRes.status === 404) {
        throw new Error(
          `Repository not found: ${owner}/${repo}. Check the URL, or if it's private, provide a GitHub token with 'repo' scope.`,
        );
      }
      if (repoRes.status === 401 || repoRes.status === 403) {
        const isRate = /rate limit/i.test(body);
        throw new Error(
          isRate
            ? `GitHub API rate limit reached. Provide a personal access token to raise the limit.`
            : `GitHub denied access (${repoRes.status}). If the repo is private, provide a valid token with 'repo' scope.`,
        );
      }
      throw new Error(`GitHub repo fetch failed (${repoRes.status}): ${body}`);
    }
    const repoJson = (await repoRes.json()) as { default_branch: string };
    const branch = repoJson.default_branch;

    // Tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers },
    );
    if (!treeRes.ok) {
      throw new Error(`GitHub tree fetch failed (${treeRes.status})`);
    }
    const treeJson = (await treeRes.json()) as {
      tree: { path: string; type: string; size?: number }[];
    };

    const candidates = treeJson.tree
      .filter((n) => n.type === "blob" && !IGNORE.test(n.path))
      .filter((n) => {
        const ext = n.path.split(".").pop()?.toLowerCase() ?? "";
        return CODE_EXTS.has(ext) || n.path.endsWith(".env");
      })
      .filter((n) => (n.size ?? 0) < 60_000)
      .slice(0, 20);

    const files = await Promise.all(
      candidates.map(async (n) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${n.path}`;
        const r = await fetch(rawUrl, {
          headers: data.token ? { Authorization: `Bearer ${data.token}` } : {},
        });
        const content = r.ok ? await r.text() : "";
        return { path: n.path, content };
      }),
    );

    return {
      owner,
      repo,
      branch,
      files: files.filter((f) => f.content.length > 0),
    };
  });
