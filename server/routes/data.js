import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { activities, athleteProfiles, chatMessages, coachingContextEntries, stravaConnections, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/export", async (request, response) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.created_at,
      onboarding_complete: users.onboarding_complete,
      strava_connected: users.strava_connected,
      demo_messages_remaining: users.demo_messages_remaining,
    })
    .from(users)
    .where(eq(users.id, request.user.id))
    .limit(1);

  const [athleteProfile] = await db
    .select({
      goal: athleteProfiles.goal,
      target_race: athleteProfiles.target_race,
      race_date: athleteProfiles.race_date,
      race_date_undetermined: athleteProfiles.race_date_undetermined,
      race_distance: athleteProfiles.race_distance,
      goal_finish_time: athleteProfiles.goal_finish_time,
      goal_finish_time_undetermined: athleteProfiles.goal_finish_time_undetermined,
      experience_level: athleteProfiles.experience_level,
      weakest_discipline: athleteProfiles.weakest_discipline,
      weekly_hours: athleteProfiles.weekly_hours,
      injuries_limiters: athleteProfiles.injuries_limiters,
      updated_at: athleteProfiles.updated_at,
    })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.user_id, request.user.id))
    .limit(1);

  const exportedChatMessages = await db
    .select({
      role: chatMessages.role,
      content: chatMessages.content,
      created_at: chatMessages.created_at,
    })
    .from(chatMessages)
    .where(eq(chatMessages.user_id, request.user.id))
    .orderBy(asc(chatMessages.created_at));

  const [stravaConnection] = await db
    .select({
      athlete_id: stravaConnections.athlete_id,
      athlete_username: stravaConnections.athlete_username,
      athlete_firstname: stravaConnections.athlete_firstname,
      athlete_lastname: stravaConnections.athlete_lastname,
      profile_medium: stravaConnections.profile_medium,
      city: stravaConnections.city,
      state: stravaConnections.state,
      country: stravaConnections.country,
      scope: stravaConnections.scope,
      connected_at: stravaConnections.connected_at,
      updated_at: stravaConnections.updated_at,
    })
    .from(stravaConnections)
    .where(eq(stravaConnections.user_id, request.user.id))
    .limit(1);

  const exportedActivities = await db
    .select({
      strava_id: activities.strava_id,
      sport_type: activities.sport_type,
      start_date: activities.start_date,
      distance_meters: activities.distance_meters,
      moving_time_seconds: activities.moving_time_seconds,
      avg_heart_rate: activities.avg_heart_rate,
      elevation_gain: activities.elevation_gain,
      suffer_score: activities.suffer_score,
    })
    .from(activities)
    .where(eq(activities.user_id, request.user.id))
    .orderBy(asc(activities.start_date));

  const exportedCoachingNotes = await db
    .select({
      source: coachingContextEntries.source,
      strava_activity_id: coachingContextEntries.strava_activity_id,
      sport: coachingContextEntries.sport,
      session_date: coachingContextEntries.session_date,
      title: coachingContextEntries.title,
      summary: coachingContextEntries.summary,
      distance_meters: coachingContextEntries.distance_meters,
      moving_time_seconds: coachingContextEntries.moving_time_seconds,
      created_at: coachingContextEntries.created_at,
    })
    .from(coachingContextEntries)
    .where(eq(coachingContextEntries.user_id, request.user.id))
    .orderBy(asc(coachingContextEntries.created_at));

  response.setHeader("Content-Type", "application/json");
  response.setHeader("Content-Disposition", 'attachment; filename="triguide-data-export.json"');

  return response.status(200).send(
    JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        user: user || null,
        athlete_profile: athleteProfile || null,
        chat_messages: exportedChatMessages,
        strava_connection: stravaConnection || null,
        activities: exportedActivities,
        coaching_notes: exportedCoachingNotes,
      },
      null,
      2,
    ),
  );
});

router.delete("/account", async (request, response) => {
  await db.delete(users).where(eq(users.id, request.user.id));
  return response.status(204).send();
});

export default router;
