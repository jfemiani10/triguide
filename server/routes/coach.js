import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { activities, athleteProfiles, chatMessages, stravaConnections, usageLog, users } from "../db/schema.js";
import { requireAuth, requireOnboarding } from "../middleware/auth.js";
import { createCoachResponse } from "../services/anthropic.js";
import { serializeUser } from "./auth.js";

const router = Router();

function formatDuration(seconds) {
  if (!seconds) {
    return "time unavailable";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDistance(meters) {
  if (!meters) {
    return "distance unavailable";
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function buildStravaContext(connection, recentActivities) {
  if (!connection) {
    return "This athlete has not connected Strava yet, so you have no workout history. Coach based on their profile and what they share in conversation.";
  }

  const athleteName =
    [connection.athlete_firstname, connection.athlete_lastname].filter(Boolean).join(" ") ||
    connection.athlete_username ||
    "Connected athlete";

  if (!recentActivities.length) {
    return `This athlete has connected Strava as ${athleteName}, but there are no imported activities yet. Use that connection status in your reasoning, but ask them to sync or describe their recent training if needed.`;
  }

  const activitySummary = recentActivities
    .map((activity) => {
      const parts = [
        activity.sport_type || "Workout",
        activity.start_date ? `on ${activity.start_date}` : null,
        formatDistance(activity.distance_meters),
        formatDuration(activity.moving_time_seconds),
      ].filter(Boolean);

      return `- ${parts.join(", ")}`;
    })
    .join("\n");

  return `This athlete has connected Strava as ${athleteName}. You have access to imported recent activity history, summarized below. Use it when it helps, but be honest about its limits because this is only a partial snapshot of training.\n\nRecent imported activities:\n${activitySummary}`;
}

function buildSystemPrompt(profile, connection, recentActivities) {
  return `You are TriGuide, an expert triathlon coach trained in the principles of data-driven, periodized triathlon training - similar in philosophy to platforms like TriDot.

Athlete profile:
- Goal: ${profile.goal} - ${profile.target_race}
- Race distance: ${profile.race_distance}
- Experience: ${profile.experience_level}
- Weakest discipline: ${profile.weakest_discipline}
- Available training time: ${profile.weekly_hours} hours/week
- Injuries/limiters: ${profile.injuries_limiters || "None reported"}

${buildStravaContext(connection, recentActivities)}

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

router.post("/chat", async (request, response) => {
  const { message, conversation_history: conversationHistory = [] } = request.body || {};

  if (!String(message || "").trim()) {
    return response.status(400).json({ error: "message is required" });
  }

  if (request.user.demo_messages_remaining <= 0) {
    return response.status(403).json({ error: "No coaching messages remaining" });
  }

  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.user_id, request.user.id)).limit(1);
  const [connection] = await db
    .select()
    .from(stravaConnections)
    .where(eq(stravaConnections.user_id, request.user.id))
    .limit(1);
  const recentActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.user_id, request.user.id))
    .orderBy(desc(activities.start_date))
    .limit(8);

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
      systemPrompt: buildSystemPrompt(profile, connection || null, recentActivities),
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
