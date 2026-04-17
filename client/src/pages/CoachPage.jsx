import { useEffect, useRef, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { PageShell, DashboardHeader } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

function formatDate(value) {
  if (!value) {
    return "Date not set";
  }

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

function createEmptyDraft() {
  return {
    source: "manual",
    sport: "",
    session_date: "",
    title: "",
    summary: "",
    distance_meters: "",
    moving_time_seconds: "",
  };
}

export default function CoachPage() {
  const { user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteDraft, setNoteDraft] = useState(createEmptyDraft());
  const [error, setError] = useState("");
  const [noteError, setNoteError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadPageData() {
      try {
        const [historyData, contextData] = await Promise.all([apiRequest("/coach/history"), apiRequest("/coach/context")]);
        setMessages(historyData.conversation_history || []);
        setNotes(contextData.notes || []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadPageData();
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, typing]);

  const remaining = user?.demo_messages_remaining ?? 0;

  function updateDraft(field, value) {
    setNoteDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openNewNoteForm() {
    setNoteError("");
    setNoteDraft(createEmptyDraft());
    setShowNoteForm(true);
  }

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

  async function handleSaveNote(event) {
    event.preventDefault();
    setSavingNote(true);
    setNoteError("");

    try {
      const payload = {
        ...noteDraft,
        distance_meters: noteDraft.distance_meters ? Number(noteDraft.distance_meters) : null,
        moving_time_seconds: noteDraft.moving_time_seconds ? Number(noteDraft.moving_time_seconds) : null,
      };
      const data = await apiRequest("/coach/context", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotes((current) => [data.note, ...current]);
      setNoteDraft(createEmptyDraft());
      setShowNoteForm(false);
    } catch (err) {
      setNoteError(err.message || "Unable to save coaching note.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    setDeletingNoteId(noteId);
    setNoteError("");

    try {
      await apiRequest(`/coach/context/${noteId}`, { method: "DELETE" });
      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch (err) {
      setNoteError(err.message || "Unable to delete coaching note.");
    } finally {
      setDeletingNoteId(null);
    }
  }

  return (
    <PageShell>
      <DashboardHeader
        title="TriGuide chat"
        description="Profile-aware guidance built from your athlete intake, conversation history, and any coaching notes you explicitly save."
        counter={remaining}
      />

      <div className="grid gap-6 lg:grid-cols-[0.68fr_0.32fr]">
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
                    Start with your current training question, and TriGuide will respond using your athlete profile plus any coaching notes you have saved.
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="kicker">Coaching Notes</p>
                  <h3 className="mt-2 font-['Barlow_Condensed'] text-3xl font-bold uppercase leading-none text-[var(--accent)]">
                    Saved training context
                  </h3>
                </div>
                <Button variant="secondary" onClick={openNewNoteForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  New coaching note
                </Button>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                Save workouts, observations, or training context here. TriGuide uses only these explicit notes, not raw Strava activity data, in AI coaching.
              </p>

              {showNoteForm ? (
                <form onSubmit={handleSaveNote} className="mt-6 space-y-4 border border-[var(--border)] bg-[var(--bg-alt)] p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="metric-label mb-2">Sport</p>
                      <Input value={noteDraft.sport} onChange={(event) => updateDraft("sport", event.target.value)} placeholder="Bike, Run, Swim" />
                    </div>
                    <div>
                      <p className="metric-label mb-2">Session date</p>
                      <Input type="date" value={noteDraft.session_date} onChange={(event) => updateDraft("session_date", event.target.value)} />
                    </div>
                  </div>
                  <div>
                    <p className="metric-label mb-2">Title</p>
                    <Input value={noteDraft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Long ride with race-pace block" />
                  </div>
                  <div>
                    <p className="metric-label mb-2">Summary</p>
                    <Textarea value={noteDraft.summary} onChange={(event) => updateDraft("summary", event.target.value)} placeholder="What happened, how it felt, and what the coach should know next time." />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="metric-label mb-2">Distance (meters)</p>
                      <Input type="number" min="0" value={noteDraft.distance_meters} onChange={(event) => updateDraft("distance_meters", event.target.value)} placeholder="40000" />
                    </div>
                    <div>
                      <p className="metric-label mb-2">Moving time (seconds)</p>
                      <Input type="number" min="0" value={noteDraft.moving_time_seconds} onChange={(event) => updateDraft("moving_time_seconds", event.target.value)} placeholder="5400" />
                    </div>
                  </div>
                  {noteError ? <p className="text-sm text-[var(--primary)]">{noteError}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={savingNote}>
                      {savingNote ? "Saving..." : "Save note"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowNoteForm(false);
                        setNoteDraft(createEmptyDraft());
                        setNoteError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}

              <div className="mt-6 space-y-3">
                {notes.length ? (
                  notes.map((note) => (
                    <div key={note.id} className="border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text)]">{note.title}</p>
                          <p className="mt-1 font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            {[note.source === "strava_prefill" ? "Saved from Strava" : "Manual note", note.sport, formatDate(note.session_date)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          className="text-[var(--text-muted)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete coaching note ${note.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{note.summary}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-[var(--text-muted)]">
                    No coaching notes saved yet. Add one here or save a Strava workout from the Strava page.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
