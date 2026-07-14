import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 text-black">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span>
            AI Code Checker
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              Solution
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/scan"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Scan
          </Link>
          <Link
            to="/results"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Results
          </Link>
          <Link
            to="/chat"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            AI Chat
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="ml-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Open Source
          </a>
        </nav>
      </div>
    </header>
  );
}
