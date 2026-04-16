import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { PageShell, DashboardHeader } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function CoachPage() {
  const { user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await apiRequest("/coach/history");
        setMessages(data.conversation_history || []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, typing]);

  const remaining = user?.demo_messages_remaining ?? 0;

  async function handleSend(event) {
    event.preventDefault();
    if (!message.trim()) return;

    setTyping(true);
    setError("");

    try {
      const data = await apiRequest("/coach/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: messages,
        }),
      });
      setMessages(data.conversation_history);
      refreshProfile(data.user);
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setTyping(false);
    }
  }

  return (
    <PageShell>
      <DashboardHeader
        title="TriGuide chat"
        description="Profile-aware guidance that starts with smart clarifying questions and stays grounded in triathlon training principles."
        counter={remaining}
      />

      <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <Card className="rounded-[32px]">
          <CardContent className="flex h-[70vh] min-h-[540px] flex-col gap-4 p-5 md:p-6">
            <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto rounded-[24px] border border-white/8 bg-black/20 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Your coach is ready</h3>
                  <p className="mt-3 max-w-md text-[var(--muted)]">
                    Start with your current training question and TriGuide will respond using your athlete profile as context.
                  </p>
                </div>
              ) : null}

              {messages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`max-w-[88%] rounded-[24px] px-4 py-3 ${
                    entry.role === "user"
                      ? "ml-auto bg-[var(--primary)] text-slate-950"
                      : "border border-white/8 bg-white/6 text-white"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    {entry.role === "user" ? "You" : "TriGuide"}
                  </p>
                  <p className="whitespace-pre-wrap leading-7">{entry.content}</p>
                </div>
              ))}

              {typing ? (
                <div className="max-w-[88%] rounded-[24px] border border-white/8 bg-white/6 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">TriGuide</p>
                  <p className="text-[var(--muted)]">Thinking through your training context...</p>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <Textarea
                placeholder="Ask about a training week, brick session, race build, or how to adjust for your current limiters."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--muted)]">{remaining} messages remaining</p>
                <Button disabled={typing || remaining <= 0}>
                  Send
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Suggested prompts</p>
              <div className="mt-4 space-y-3">
                {promptExamples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setMessage(example)}
                    className="w-full rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-left text-sm text-white transition hover:border-[var(--primary)]/30 hover:bg-white/6"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

const promptExamples = [
  "Build me a 7-hour training week for my target race.",
  "What should my next 4 weeks prioritize given my weakest discipline?",
  "How would you structure a brick workout for me this weekend?",
];
