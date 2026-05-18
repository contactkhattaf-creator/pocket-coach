import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { chatAssistant } from "@/server/ai.functions";
import { Send } from "lucide-react";

export const Route = createFileRoute("/dashboard/assistant")({
  component: AssistantPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROMPTS = [
  "Suis-je sur la bonne voie ce mois-ci ?",
  "Où est-ce que je dépense trop ?",
  "Optimise mes abonnements",
  "Comment économiser plus ?",
  "Analyse mes habitudes de dépense",
];

function AssistantPage() {
  const chatFn = useServerFn(chatAssistant);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(text: string) {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setTyping(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { reply } = await chatFn({ data: { message: text.trim(), history } });
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat failed", err);
      toast.error("L'assistant n'a pas pu répondre. Réessayez.");
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Monique Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask anything about your finances</p>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 ring-1 ring-border">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-bright/15">
              <span className="text-2xl">💬</span>
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">How can I help you today?</p>
            <p className="mt-1 text-xs text-muted-foreground">Try one of the suggestions below</p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user" ? "bg-violet-bright text-white" : "bg-surface text-foreground"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => sendMessage(p)} className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition hover:bg-surface-hover hover:border-violet-bright">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask or Search..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-12 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground"
          />
        </div>
        <button onClick={() => sendMessage(input)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-bright text-white transition hover:bg-violet-bright/90">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
