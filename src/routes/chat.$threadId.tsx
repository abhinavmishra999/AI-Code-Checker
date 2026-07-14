import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  deleteThread,
  getThread,
  loadThreads,
  newThreadId,
  upsertThread,
  type ChatThread,
} from "@/lib/thread-store";
import { Plus, Trash2, MessageSquare, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "AI Chat · AI Code Checker" },
      {
        name: "description",
        content:
          "Chat with the AI Code Checker assistant about your scan results and get plain-English fixes.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [thread, setThread] = useState<ChatThread | undefined>();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap: ensure thread exists
  useEffect(() => {
    const all = loadThreads();
    let t = all.find((x) => x.id === threadId);
    if (!t) {
      t = {
        id: threadId,
        title: "New chat",
        updatedAt: Date.now(),
        messages: [],
      };
      upsertThread(t);
    }
    setThread(t);
    setThreads(loadThreads());
  }, [threadId]);

  const scanContext = useMemo(() => {
    if (!thread?.scanId) return undefined;
    return sessionStorage.getItem(`acc.scanContext.${thread.scanId}`) ?? undefined;
  }, [thread?.scanId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ scanContext }),
      }),
    [scanContext],
  );

  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: thread?.messages ?? [],
    transport,
  });

  // Persist messages
  useEffect(() => {
    if (!thread) return;
    if (messages.length === 0) return;
    const title =
      thread.title === "New chat" || thread.title === ""
        ? deriveTitle(messages) ?? thread.title
        : thread.title;
    upsertThread({
      ...thread,
      title,
      updatedAt: Date.now(),
      messages,
    });
    setThreads(loadThreads());
  }, [messages, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep textarea focused
  useEffect(() => {
    promptRef.current?.focus();
  }, [threadId, status]);

  function createThread() {
    const id = newThreadId();
    upsertThread({
      id,
      title: "New chat",
      updatedAt: Date.now(),
      messages: [],
    });
    navigate({ to: "/chat/$threadId", params: { threadId: id } });
  }

  function removeThread(id: string) {
    deleteThread(id);
    const remaining = loadThreads();
    setThreads(remaining);
    if (id === threadId) {
      if (remaining[0]) {
        navigate({
          to: "/chat/$threadId",
          params: { threadId: remaining[0].id },
        });
      } else {
        createThread();
      }
    }
  }

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNav />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={createThread}
          >
            <Plus className="mr-2 h-4 w-4" /> New chat
          </Button>
          <div className="mt-4 space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-md text-sm ${
                  t.id === threadId ? "bg-accent" : "hover:bg-accent/60"
                }`}
              >
                <button
                  onClick={() =>
                    navigate({
                      to: "/chat/$threadId",
                      params: { threadId: t.id },
                    })
                  }
                  className="flex flex-1 items-center gap-2 truncate px-2 py-2 text-left"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title || "New chat"}</span>
                </button>
                <button
                  onClick={() => removeThread(t.id)}
                  className="mr-1 rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <div className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card/30">
          {scanContext && (
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              This chat has access to your latest scan results.{" "}
              <Link to="/results" className="ml-auto underline">
                View scan
              </Link>
            </div>
          )}

          <Conversation className="flex-1">
            <ConversationContent>
              {messages.length === 0 && !isLoading && (
                <EmptyState onPick={(q) => sendMessage({ text: q })} />
              )}
              {messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-background prose-pre:border prose-pre:border-border">
                      <ReactMarkdown>{textOf(m)}</ReactMarkdown>
                    </div>
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Thinking…</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border/60 p-3">
            <PromptInput
              onSubmit={(e) => {
                e.preventDefault?.();
                const text = input.trim();
                if (!text || isLoading) return;
                sendMessage({ text });
                setInput("");
              }}
            >
              <PromptInputTextarea
                ref={promptRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a finding, request a fix in your framework, or say 'explain like I'm 5'…"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} disabled={!input.trim()} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "Explain the OWASP Top 10 like I'm 5.",
    "How do I safely handle user input in Express?",
    "What's the difference between hashing and encryption?",
    "How do I store secrets in a Next.js project?",
  ];
  return (
    <div className="grid place-items-center py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-black">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        Ask the AI Code Checker anything
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        I explain vulnerabilities in plain English and give you working, secure code.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border border-border bg-card/60 px-4 py-3 text-left text-sm hover:border-emerald-500/50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function textOf(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

function deriveTitle(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return undefined;
  const t = textOf(first);
  return t.length > 40 ? `${t.slice(0, 40)}…` : t;
}
