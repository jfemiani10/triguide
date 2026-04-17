import { Router } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { athleteProfiles, chatMessages, coachingContextEntries, usageLog, users } from "../db/schema.js";
import { requireAuth, requireOnboarding } from "../middleware/auth.js";
import { createCoachResponse } from "../services/anthropic.js";
import { serializeUser } from "./auth.js";

const router = Router();
const MAX_PROMPT_CHARACTERS = 4000;

function formatDuration(seconds) {
  if (!seconds) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDistance(meters) {
  if (!meters) {
    return null;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function buildCoachingContext(notes) {
  if (!notes.length) {
    return "No saved coaching notes yet. Coach from the athlete profile and the current conversation, and ask for recent training details when needed.";
  }

  const noteSummary = notes
    .map((note) => {
      const metadata = [
        note.sport || null,
        note.session_date ? `on ${note.session_date}` : null,
        formatDistance(note.distance_meters),
        formatDuration(note.moving_time_seconds),
      ]
        .filter(Boolean)
        .join(", ");

      return `- ${note.title}${metadata ? ` (${metadata})` : ""}: ${note.summary}`;
    })
    .join("\n");

  return `Recent TriGuide coaching notes explicitly saved by the athlete:\n${noteSummary}`;
}

function buildSystemPrompt(profile, notes) {
  return `You are TriGuide, an expert triathlon coach trained in the principles of data-driven, periodized triathlon training - similar in philosophy to platforms like TriDot.

Athlete profile:
- Goal: ${profile.goal} - ${profile.target_race}
- Race distance: ${profile.race_distance}
- Experience: ${profile.experience_level}
- Weakest discipline: ${profile.weakest_discipline}
- Available training time: ${profile.weekly_hours} hours/week
- Injuries/limiters: ${profile.injuries_limiters || "None reported"}

${buildCoachingContext(notes)}

Ask smart clarifying questions before prescribing workouts. Be direct, specific, and motivating. Reference their goal race and timeline in your advice. Use proper triathlon coaching terminology: periodization, Z2, brick workouts, race-pace intervals, TSS.`;
}

router.use(requireAuth, requireOnboarding);

router.get("/history", async (request, response) => {
  const history = await db
    .select({
      role: chatMessages.role,
      content: chatMessages.content,
      created_at: chatMessages.created_at,
    })
    .from(chatMessages)
    .where(eq(chatMessages.user_id, request.user.id))
    .orderBy(asc(chatMessages.id));

  return response.json({ conversation_history: history });
});

router.get("/context", async (request, response) => {
  const notes = await db
    .select()
    .from(coachingContextEntries)
    .where(eq(coachingContextEntries.user_id, request.user.id))
    .orderBy(desc(coachingContextEntries.session_date), desc(coachingContextEntries.created_at), desc(coachingContextEntries.id));

  return response.json({ notes });
});

router.post("/context", async (request, response) => {
  const {
    source = "manual",
    sport = null,
    session_date = null,
    title,
    summary,
    distance_meters = null,
    moving_time_seconds = null,
  } = request.body || {};

  if (source !== "manual" && source !== "strava_prefill") {
    return response.status(400).json({ error: "source must be manual or strava_prefill" });
  }

  if (!String(title || "").trim()) {
    return response.status(400).json({ error: "title is required" });
  }

  if (!String(summary || "").trim()) {
    return response.status(400).json({ error: "summary is required" });
  }

  const [note] = await db
    .insert(coachingContextEntries)
    .values({
      user_id: request.user.id,
      source,
      sport: sport ? String(sport).trim() : null,
      session_date: session_date ? String(session_date).trim() : null,
      title: String(title).trim(),
      summary: String(summary).trim(),
      distance_meters: distance_meters === null || distance_meters === "" ? null : Number(distance_meters),
      moving_time_seconds:
        moving_time_seconds === null || moving_time_seconds === "" ? null : Number(moving_time_seconds),
    })
    .returning();

  return response.status(201).json({ note });
});

router.delete("/context/:id", async (request, response) => {
  const noteId = Number(request.params.id);

  if (!Number.isInteger(noteId) || noteId <= 0) {
    return response.status(400).json({ error: "Invalid note id" });
  }

  const [deletedNote] = await db
    .delete(coachingContextEntries)
    .where(and(eq(coachingContextEntries.id, noteId), eq(coachingContextEntries.user_id, request.user.id)))
    .returning();

  if (!deletedNote) {
    return response.status(404).json({ error: "Coaching note not found" });
  }

  return response.status(204).send();
});

router.post("/chat", async (request, response) => {
  const { message, conversation_history: conversationHistory = [] } = request.body || {};

  if (!String(message || "").trim()) {
    return response.status(400).json({ error: "message is required" });
  }

  if (String(message).trim().length > MAX_PROMPT_CHARACTERS) {
    return response.status(400).json({
      error: `Message is too long. Keep prompts under ${MAX_PROMPT_CHARACTERS} characters.`,
    });
  }

  if (request.user.demo_messages_remaining <= 0) {
    return response.status(403).json({ error: "No coaching messages remaining" });
  }

  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.user_id, request.user.id)).limit(1);
  const notes = await db
    .select()
    .from(coachingContextEntries)
    .where(eq(coachingContextEntries.user_id, request.user.id))
    .orderBy(desc(coachingContextEntries.session_date), desc(coachingContextEntries.created_at), desc(coachingContextEntries.id))
    .limit(6);

  if (!profile) {
    return response.status(400).json({ error: "Athlete profile not found" });
  }

  const sanitizedHistory = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((entry) => entry?.role === "user" || entry?.role === "assistant")
        .map((entry) => ({ role: entry.role, content: String(entry.content || "") }))
    : [];

  const conversation = [...sanitizedHistory, { role: "user", content: String(message).trim() }];
  let coachReply;

  try {
    coachReply = await createCoachResponse({
      systemPrompt: buildSystemPrompt(profile, notes),
      conversationHistory: conversation,
    });
  } catch (error) {
    const status = error.message.includes("ANTHROPIC_API_KEY") ? 503 : 502;
    return response.status(status).json({
      error: error.message.includes("ANTHROPIC_API_KEY")
        ? "ANTHROPIC_API_KEY is not configured on the server"
        : error.message || "Failed to reach Anthropic",
    });
  }

  await db.insert(chatMessages).values([
    { user_id: request.user.id, role: "user", content: String(message).trim() },
    { user_id: request.user.id, role: "assistant", content: coachReply.content },
  ]);

  await db.insert(usageLog).values({
    user_id: request.user.id,
    input_tokens: coachReply.input_tokens,
    output_tokens: coachReply.output_tokens,
  });

  const [updatedUser] = await db
    .update(users)
    .set({ demo_messages_remaining: request.user.demo_messages_remaining - 1 })
    .where(eq(users.id, request.user.id))
    .returning();

  return response.json({
    user: serializeUser(updatedUser),
    conversation_history: [...conversation, { role: "assistant", content: coachReply.content }],
  });
});

export default router;
