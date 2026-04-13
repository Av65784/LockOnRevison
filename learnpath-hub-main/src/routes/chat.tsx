import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AIChat } from "@/components/AIChat";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "AI Chat — LockOnRevision" },
      { name: "description", content: "Chat with your AI study buddy for help with any subject." },
    ],
  }),
});

function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AIChat />
      </main>
    </div>
  );
}
