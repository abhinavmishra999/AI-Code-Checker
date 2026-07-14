import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

interface ChatBody {
  messages?: UIMessage[];
  scanContext?: string;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, scanContext } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are the "AI Code Checker" assistant — a friendly, expert security engineer helping developers AND non-technical people understand code issues.

Rules:
- When asked "explain like I'm 5" or by a non-technical user, use simple analogies, no jargon.
- When asked for a fix, provide concrete, framework-specific code examples.
- Reference the scan results below when relevant.
- Be concise. Use markdown, code blocks, and bullet lists.

${scanContext ? `\n=== CURRENT SCAN CONTEXT ===\n${scanContext}\n=== END SCAN CONTEXT ===` : "\nNo scan is currently loaded. The user may ask general secure-coding questions."}`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
