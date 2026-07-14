import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  scanId?: string;
  messages: UIMessage[];
}

const KEY = "acc.chatThreads";

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatThread[];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(threads));
}

export function upsertThread(thread: ChatThread) {
  const threads = loadThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) threads[idx] = thread;
  else threads.unshift(thread);
  threads.sort((a, b) => b.updatedAt - a.updatedAt);
  saveThreads(threads);
}

export function getThread(id: string): ChatThread | undefined {
  return loadThreads().find((t) => t.id === id);
}

export function deleteThread(id: string) {
  saveThreads(loadThreads().filter((t) => t.id !== id));
}

export function newThreadId() {
  return (
    (globalThis.crypto?.randomUUID?.() as string | undefined) ??
    `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  );
}
