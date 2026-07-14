import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Bug,
  KeyRound,
  MessageSquare,
  Github,
  Sparkles,
  ArrowRight,
  Gauge,
} from "lucide-react";
import { AppNav } from "@/components/app-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Code Checker — Secure your code with AI" },
      {
        name: "description",
        content:
          "Open-source AI assistant that reviews your code for OWASP Top 10 vulnerabilities, hardcoded secrets and bugs — with plain-English explanations and a chatbot guide.",
      },
      { property: "og:title", content: "AI Code Checker — Secure your code with AI" },
      {
        property: "og:description",
        content:
          "Detect vulnerabilities, prevent code leakage, and get plain-English fixes from an AI security assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(16,185,129,0.15), transparent), radial-gradient(50% 30% at 80% 20%, rgba(6,182,212,0.12), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Open-source AI security assistant
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Ship code that
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {" "}
                doesn't leak.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              AI Code Checker reviews your code for OWASP Top 10 vulnerabilities,
              hardcoded secrets and bugs — then explains every issue in plain
              English and gives you the exact fix.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-500 px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Start Scanning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/50 px-5 py-3 text-sm font-medium hover:bg-accent"
              >
                <MessageSquare className="h-4 w-4" /> Talk to the AI
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No account. Session-only privacy. Paste, upload, or scan a GitHub repo.
            </p>
          </div>

          {/* Fake terminal preview */}
          <div className="rounded-xl border border-border bg-card/60 p-1 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-xs text-muted-foreground">
                scan · auth.ts
              </span>
            </div>
            <div className="rounded-lg bg-background p-4 font-mono text-xs leading-relaxed">
              <div className="text-muted-foreground">// analyzing…</div>
              <div>
                <span className="text-red-400">critical</span>{" "}
                <span className="text-muted-foreground">A03 · Injection</span>
              </div>
              <div className="text-foreground">
                {"const q = `SELECT * FROM users WHERE id=${req.query.id}`;"}
              </div>
              <div className="mt-2">
                <span className="text-amber-400">high</span>{" "}
                <span className="text-muted-foreground">Secret Leak</span>
              </div>
              <div className="text-foreground">
                const STRIPE_KEY = "sk_live_51H…"
              </div>
              <div className="mt-3 border-t border-border pt-2">
                <span className="text-emerald-400">✓ suggested fix</span>{" "}
                use parameterized queries · move key to env
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">Built for teams that ship</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every finding is explained twice — once for engineers, once for everyone else.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="OWASP Top 10 detection"
            body="Catches injection, broken auth, XSS, SSRF, IDOR and the rest — before they reach production."
          />
          <Feature
            icon={<KeyRound className="h-5 w-5" />}
            title="Prevents code leakage"
            body="Scans for hardcoded API keys, tokens, private keys and other secrets that shouldn't ship."
          />
          <Feature
            icon={<Bug className="h-5 w-5" />}
            title="Bugs & anti-patterns"
            body="Beyond security — logic errors, deprecated APIs and unsafe patterns get flagged too."
          />
          <Feature
            icon={<Gauge className="h-5 w-5" />}
            title="Risk score dashboard"
            body="One number, colour-coded by severity. Know at a glance whether the repo is safe to ship."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5" />}
            title="AI chatbot guide"
            body="Ask follow-up questions. 'Explain like I'm 5.' 'How do I fix this in Django?' — it knows your scan."
          />
          <Feature
            icon={<Github className="h-5 w-5" />}
            title="Paste, upload or GitHub"
            body="Analyze a snippet, a file, or point it at any public GitHub repository."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Ready to check your code?</h3>
            <p className="mt-1 text-muted-foreground">
              Free, open-source, and private — nothing is stored beyond your session.
            </p>
          </div>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-500 px-5 py-3 text-sm font-semibold text-black"
          >
            Run a scan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        AI Code Checker · Open-source AI security review
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 transition-colors hover:border-emerald-500/40">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
