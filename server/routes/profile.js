import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { athleteProfiles, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeUser } from "./auth.js";

const router = Router();

function validateProfileInput(payload) {
  const requiredFields = ["goal", "race_distance", "experience_level", "weakest_discipline"];
  for (const field of requiredFields) {
    if (!String(payload?.[field] || "").trim()) {
      return `${field} is required`;
    }
  }

  const weeklyHours = Number(payload?.weekly_hours);
  if (!Number.isInteger(weeklyHours) || weeklyHours < 3 || weeklyHours > 20) {
    return "weekly_hours must be an integer between 3 and 20";
  }

  const injuriesLimiters = String(payload?.injuries_limiters || "").trim();
  if (injuriesLimiters && !payload?.health_data_consent) {
    return "Health data consent is required if you share injuries or physical limiters";
  }

  const goalFinishTime = String(payload?.goal_finish_time || "").trim();
  if (goalFinishTime && !/^\d{1,2}:\d{2}:\d{2}$/.test(goalFinishTime)) {
    return "goal_finish_time must use H:MM:SS or HH:MM:SS format";
  }

  return null;
}

async function fetchProfile(userId) {
  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.user_id, userId)).limit(1);
  return profile || null;
}

router.use(requireAuth);

router.get("/onboarding", async (request, response) => {
  const profile = await fetchProfile(request.user.id);
  return response.json({ profile });
});

async function upsertOnboarding(request, response) {
  const error = validateProfileInput(request.body);
  if (error) {
    return response.status(400).json({ error });
  }

  const payload = {
    user_id: request.user.id,
    goal: request.body.goal.trim(),
    target_race: request.body.target_race?.trim() || `${request.body.race_distance.trim()} goal race`,
    race_date: request.body.race_date_undetermined ? null : request.body.race_date?.trim() || null,
    race_date_undetermined: Boolean(request.body.race_date_undetermined),
    race_distance: request.body.race_distance.trim(),
    goal_finish_time: request.body.goal_finish_time?.trim() || null,
    goal_finish_time_undetermined: false,
    experience_level: request.body.experience_level.trim(),
    weakest_discipline: request.body.weakest_discipline.trim(),
    weekly_hours: Number(request.body.weekly_hours),
    injuries_limiters: request.body.injuries_limiters?.trim() || null,
    health_data_consent_at: request.body.injuries_limiters?.trim() ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const existingProfile = await fetchProfile(request.user.id);

  if (existingProfile) {
    await db.update(athleteProfiles).set(payload).where(eq(athleteProfiles.user_id, request.user.id));
  } else {
    await db.insert(athleteProfiles).values(payload);
  }

  const userUpdate = await db
    .update(users)
    .set({ onboarding_complete: true })
    .where(eq(users.id, request.user.id))
    .returning();

  const updatedUser = userUpdate[0];
  const profile = await fetchProfile(request.user.id);

  return response.json({
    user: serializeUser(updatedUser),
    profile,
  });
}

router.post("/onboarding", upsertOnboarding);
router.post("/profile/onboarding", upsertOnboarding);

router.get("/profile", async (request, response) => {
  const profile = await fetchProfile(request.user.id);
  return response.json({
    user: serializeUser(request.user),
    profile,
  });
});

router.put("/profile", async (request, response) => {
  const error = validateProfileInput(request.body);
  if (error) {
    return response.status(400).json({ error });
  }

  const existingProfile = await fetchProfile(request.user.id);
  if (!existingProfile) {
    return response.status(404).json({ error: "Profile not found. Complete onboarding first." });
  }

  await db
    .update(athleteProfiles)
    .set({
      goal: request.body.goal.trim(),
      target_race: request.body.target_race?.trim() || `${request.body.race_distance.trim()} goal race`,
      race_date: request.body.race_date_undetermined ? null : request.body.race_date?.trim() || null,
      race_date_undetermined: Boolean(request.body.race_date_undetermined),
      race_distance: request.body.race_distance.trim(),
      goal_finish_time: request.body.goal_finish_time?.trim() || null,
      goal_finish_time_undetermined: false,
      experience_level: request.body.experience_level.trim(),
      weakest_discipline: request.body.weakest_discipline.trim(),
      weekly_hours: Number(request.body.weekly_hours),
      injuries_limiters: request.body.injuries_limiters?.trim() || null,
      health_data_consent_at: request.body.injuries_limiters?.trim() ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(athleteProfiles.user_id, request.user.id));

  const profile = await fetchProfile(request.user.id);
  return response.json({
    user: serializeUser(request.user),
    profile,
  });
});

export default router;
