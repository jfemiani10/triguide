import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
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
        <Card>
          <CardContent className="flex h-[70vh] min-h-[540px] flex-col gap-4 p-5 md:p-6">
            <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto border border-[var(--border)] bg-[var(--bg)] p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-start justify-center text-left">
                  <p className="pill w-fit">Coach Channel</p>
                  <h3 className="mt-4 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                    Your coach is ready
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[var(--text-muted)]">
                    Start with your current training question and TriGuide will respond using your athlete profile as context.
                  </p>
                </div>
              ) : null}

              {messages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`max-w-[90%] px-4 py-4 ${
                    entry.role === "user"
                      ? "bg-[#fdf0ee] text-[var(--text)]"
                      : "border-l-[4px] border-[var(--accent)] bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  }`}
                >
                  <p className="mb-2 font-['JetBrains_Mono'] text-[0.72rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {entry.role === "user" ? "You" : "Coach"}
                  </p>
                  <p className="whitespace-pre-wrap leading-7">{entry.content}</p>
                </div>
              ))}

              {typing ? (
                <div className="max-w-[90%] border-l-[4px] border-[var(--accent)] bg-[var(--surface)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <p className="mb-2 font-['JetBrains_Mono'] text-[0.72rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Coach
                  </p>
                  <p className="text-[var(--text-muted)]">Thinking through your training context...</p>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <Textarea
                placeholder="Ask about a training week, brick session, race build, or how to adjust for your current limiters."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--text-muted)]">{remaining} messages remaining</p>
                  <p className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Responses generated by Claude AI · Not medical advice
                  </p>
                </div>
                <Button disabled={typing || remaining <= 0}>
                  Send
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="kicker">Suggested Prompts</p>
              <div className="mt-5 space-y-4">
                {promptExamples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setMessage(example)}
                    className="block w-full text-left text-sm leading-6 text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                  >
                    <span className="mr-2 text-[var(--primary)]">&gt;</span>
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
