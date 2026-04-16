import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
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

async function buildStatusResponse(user) {
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
    .limit(5);

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
  const payload = await buildStatusResponse(request.user);
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
