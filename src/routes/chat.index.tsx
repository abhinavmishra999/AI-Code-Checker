import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadThreads, newThreadId, upsertThread } from "@/lib/thread-store";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const threads = loadThreads();
    if (threads.length > 0) {
      navigate({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
      return;
    }
    const id = newThreadId();
    upsertThread({
      id,
      title: "New chat",
      updatedAt: Date.now(),
      messages: [],
    });
    navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
  }, [navigate]);
  return null;
}
