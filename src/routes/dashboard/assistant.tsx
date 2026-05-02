import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/routes/dashboard";
import { Send, Mic, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/assistant")({
  component: AssistantPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROMPTS = [
  "Am I on track this month?",
  "Where am I overspending?",
  "Optimize my subscriptions",
  "How can I save more?",
  "Analyze my spending habits",
];

const RESPONSES: Record<string, string> = {
  "Am I on track this month?": "Based on your current spending patterns, you're tracking well this month. Your expenses are within 85% of your budget limits. Keep it up! Consider reducing dining out by 10% to stay under your food budget.",
  "Where am I overspending?": "Looking at your transactions, the top areas where you're spending more than average are: 1) Food & Dining (23% above budget), 2) Entertainment (15% above). I recommend setting stricter alerts for these categories.",
  "Optimize my subscriptions": "You have several active subscriptions. I noticed some overlap — you're paying for both streaming services. Consider keeping one and saving ~80 MAD/month. Also, your gym membership hasn't been used in 3 weeks.",
  "How can I save more?": "Here are 3 quick wins: 1) Switch to a cheaper phone plan (save ~50 MAD/month), 2) Use the 50/30/20 rule for your salary, 3) Set up auto-transfer of 10% of income to your savings goal on payday.",
  "Analyze my spending habits": "Your spending profile shows you're a 'Weekend Spender' — 62% of discretionary spending happens Friday-Sunday. You tend to make impulsive purchases in the evening. Consider setting a weekend spending cap.",
};

function AssistantPage() {
  const { user } = useDashboard();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate AI response with typewriter
    const response = RESPONSES[text.trim()] || `I've analyzed your financial data. ${text.includes("save") ? "Based on your income and expenses, I recommend automating a 15% savings transfer each month." : "Your financial health score is improving. Keep maintaining your streak and tracking all transactions for the most accurate insights."}`;
    
    setTimeout(() => {
      setTyping(false);
      typewriterEffect(response);
    }, 1000);
  }

  function typewriterEffect(text: string) {
    let i = 0;
    const id = setInterval(() => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { role: "assistant", content: text.slice(0, i + 1) }];
        }
        return [...prev, { role: "assistant", content: text.slice(0, i + 1) }];
      });
      i++;
      if (i >= text.length) clearInterval(id);
    }, 15);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Moniq Assistant</h1>
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
