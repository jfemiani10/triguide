import { Router } from "express";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { activities, stravaConnections, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeUser } from "./auth.js";
import {
  buildAuthorizationUrl,
  deauthorize,
  exchangeCodeForTokens,
  fetchActivities,
  fetchAthlete,
  getStravaConfig,
  normalizeActivity,
  normalizeConnection,
  refreshAccessToken,
  verifyOAuthState,
} from "../services/strava.js";

const router = Router();
const STRAVA_CACHE_RETENTION_DAYS = 7;

router.get("/__probe_public", (_request, response) => {
  return response.json({ ok: true, route: "strava-public-probe-v1" });
});

function getCallbackRedirect(status, message) {
  const { clientOrigin } = getStravaConfig();
  const url = new URL("/strava", clientOrigin);
  url.searchParams.set("status", status);

  if (message) {
    url.searchParams.set("message", message);
  }

  return url.toString();
}

async function getConnection(userId) {
  const [connection] = await db.select().from(stravaConnections).where(eq(stravaConnections.user_id, userId)).limit(1);
  return connection || null;
}

async function upsertConnection(userId, tokenPayload, athlete) {
  const existing = await getConnection(userId);
  const payload = normalizeConnection(userId, tokenPayload, athlete);

  if (existing) {
    await db
      .update(stravaConnections)
      .set({
        ...payload,
        connected_at: existing.connected_at,
      })
      .where(eq(stravaConnections.user_id, userId));
  } else {
    await db.insert(stravaConnections).values(payload);
  }
}

async function markUserConnected(userId, connected) {
  const [updatedUser] = await db
    .update(users)
    .set({ strava_connected: connected })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

async function ensureValidConnection(userId) {
  const connection = await getConnection(userId);

  if (!connection) {
    throw new Error("Connect Strava before syncing activities");
  }

  const expiresAt = Number(connection.expires_at || 0);
  const now = Math.floor(Date.now() / 1000);

  if (Number.isFinite(expiresAt) && expiresAt > now + 60) {
    return connection;
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const nextValues = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: String(refreshed.expires_at),
    updated_at: new Date().toISOString(),
  };

  await db.update(stravaConnections).set(nextValues).where(eq(stravaConnections.user_id, userId));

  return {
    ...connection,
    ...nextValues,
  };
}

async function syncActivitiesForUser(userId) {
  const connection = await ensureValidConnection(userId);
  const athlete = await fetchAthlete(connection.access_token);
  await upsertConnection(userId, connection, athlete);

  const fetchedActivities = await fetchActivities(connection.access_token, { per_page: 100, page: 1 });
  const normalizedActivities = fetchedActivities.map((activity) => normalizeActivity(userId, activity));

  await db.delete(activities).where(eq(activities.user_id, userId));

  if (normalizedActivities.length > 0) {
    await db.insert(activities).values(normalizedActivities);
  }

  return {
    athlete,
    normalizedActivities,
  };
}

async function cleanupExpiredActivities(userId) {
  const cutoff = new Date(Date.now() - STRAVA_CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.delete(activities).where(and(eq(activities.user_id, userId), lt(activities.synced_at, cutoff)));
}

function buildPrefillDraft(activity) {
  const sport = activity.sport_type || "Workout";
  const dateLabel = activity.start_date ? new Date(activity.start_date).toISOString().slice(0, 10) : null;
  const distanceLabel = activity.distance_meters ? `${(activity.distance_meters / 1000).toFixed(1)} km` : null;
  const durationMinutes = activity.moving_time_seconds ? Math.round(activity.moving_time_seconds / 60) : null;
  const durationLabel = durationMinutes ? `${durationMinutes} minutes` : null;
  const metrics = [distanceLabel, durationLabel].filter(Boolean).join(" and ");

  return {
    source: "strava_prefill",
    strava_activity_id: activity.strava_id,
    sport,
    session_date: dateLabel,
    title: `${sport} session from Strava`,
    summary: metrics
      ? `${sport} session${dateLabel ? ` on ${dateLabel}` : ""} covering ${metrics}. Add how it felt, what the effort was, and any context you want TriGuide to use in future coaching.`
      : `${sport} session${dateLabel ? ` on ${dateLabel}` : ""}. Add how it felt, what the effort was, and any context you want TriGuide to use in future coaching.`,
    distance_meters: activity.distance_meters,
    moving_time_seconds: activity.moving_time_seconds,
  };
}

async function buildStatusResponse(user, activityLimit = 5) {
  await cleanupExpiredActivities(user.id);

  const connection = await getConnection(user.id);
  const [activitySummary] = await db
    .select({ count: sql`count(*)` })
    .from(activities)
    .where(eq(activities.user_id, user.id));
  const recentActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.user_id, user.id))
    .orderBy(desc(activities.start_date))
    .limit(activityLimit);

  return {
    user: serializeUser(user),
    connection: connection
      ? {
          athlete_id: connection.athlete_id,
          athlete_username: connection.athlete_username,
          athlete_name: [connection.athlete_firstname, connection.athlete_lastname].filter(Boolean).join(" ") || null,
          profile_medium: connection.profile_medium,
          city: connection.city,
          state: connection.state,
          country: connection.country,
          scope: connection.scope,
          connected_at: connection.connected_at,
          updated_at: connection.updated_at,
          expires_at: Number(connection.expires_at),
        }
      : null,
    activity_count: Number(activitySummary?.count || 0),
    recent_activities: recentActivities,
  };
}

router.get("/callback", async (request, response) => {
  const { error, code, state } = request.query || {};

  if (error) {
    return response.redirect(getCallbackRedirect("error", String(error)));
  }

  if (!code || !state) {
    return response.redirect(getCallbackRedirect("error", "missing_code_or_state"));
  }

  try {
    const userId = verifyOAuthState(String(state));
    const tokenPayload = await exchangeCodeForTokens(String(code));
    const athlete = tokenPayload.athlete?.id ? tokenPayload.athlete : await fetchAthlete(tokenPayload.access_token);

    await upsertConnection(userId, tokenPayload, athlete);
    await markUserConnected(userId, true);
    await syncActivitiesForUser(userId);

    return response.redirect(getCallbackRedirect("connected"));
  } catch (callbackError) {
    console.error(callbackError);
    return response.redirect(getCallbackRedirect("error", "oauth_callback_failed"));
  }
});

router.use(requireAuth);

router.get("/", async (request, response) => {
  const requestedLimit = Number.parseInt(String(request.query.limit || "5"), 10);
  const safeLimit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 5;
  const payload = await buildStatusResponse(request.user, safeLimit);
  return response.json(payload);
});

router.get("/connect-url", async (request, response) => {
  try {
    const url = buildAuthorizationUrl(request.user.id);
    return response.json({ url });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Strava configuration is incomplete" });
  }
});

router.post("/sync", async (request, response) => {
  try {
    const { normalizedActivities } = await syncActivitiesForUser(request.user.id);
    const payload = await buildStatusResponse(request.user);

    return response.json({
      ...payload,
      synced: true,
      synced_count: normalizedActivities.length,
    });
  } catch (error) {
    return response.status(400).json({ error: error.message || "Strava sync failed" });
  }
});

router.post("/activities/:id/prefill", async (request, response) => {
  await cleanupExpiredActivities(request.user.id);

  const activityId = Number(request.params.id);

  if (!Number.isInteger(activityId) || activityId <= 0) {
    return response.status(400).json({ error: "Invalid activity id" });
  }

  const [activity] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.user_id, request.user.id)))
    .limit(1);

  if (!activity) {
    return response.status(404).json({ error: "Strava activity not found" });
  }

  return response.json({ draft: buildPrefillDraft(activity) });
});

router.delete("/connection", async (request, response) => {
  const connection = await getConnection(request.user.id);

  if (!connection) {
    return response.status(404).json({ error: "No Strava connection found" });
  }

  try {
    const validConnection = await ensureValidConnection(request.user.id);
    await deauthorize(validConnection.access_token);
  } catch (error) {
    console.error(error);
  }

  await db.delete(activities).where(eq(activities.user_id, request.user.id));
  await db.delete(stravaConnections).where(eq(stravaConnections.user_id, request.user.id));
  const updatedUser = await markUserConnected(request.user.id, false);

  return response.json({
    user: serializeUser(updatedUser),
    connection: null,
    activity_count: 0,
    recent_activities: [],
  });
});

router.all("*", (_request, response) => {
  return response.status(404).json({
    error: "Strava route not found",
  });
});

export default router;
