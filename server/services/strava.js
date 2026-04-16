import jwt from "jsonwebtoken";

const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const DEFAULT_SCOPES = ["read", "activity:read_all"];

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Strava configuration: ${name}`);
  }

  return value;
}

export function getStravaConfig() {
  return {
    clientId: getRequiredEnv("STRAVA_CLIENT_ID"),
    clientSecret: getRequiredEnv("STRAVA_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("STRAVA_REDIRECT_URI"),
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  };
}

export function createOAuthState(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      intent: "strava_oauth",
    },
    getRequiredEnv("JWT_SECRET"),
    { expiresIn: "10m" },
  );
}

export function verifyOAuthState(state) {
  const payload = jwt.verify(state, getRequiredEnv("JWT_SECRET"));

  if (payload.intent !== "strava_oauth") {
    throw new Error("Invalid Strava OAuth state");
  }

  return Number(payload.sub);
}

export function buildAuthorizationUrl(userId, scopes = DEFAULT_SCOPES) {
  const { clientId, redirectUri } = getStravaConfig();
  const url = new URL(`${STRAVA_OAUTH_BASE}/authorize`);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", scopes.join(","));
  url.searchParams.set("state", createOAuthState(userId));

  return url.toString();
}

async function stravaTokenRequest(params) {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.errors?.[0]?.resource || "Strava token request failed");
  }

  return payload;
}

export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret } = getStravaConfig();

  return stravaTokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
  });
}

export async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getStravaConfig();

  return stravaTokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
}

async function stravaApiRequest(path, accessToken, searchParams) {
  const url = new URL(`${STRAVA_API_BASE}${path}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.errors?.[0]?.code || "Strava API request failed");
  }

  return payload;
}

export async function fetchAthlete(accessToken) {
  return stravaApiRequest("/athlete", accessToken);
}

export async function fetchActivities(accessToken, options = {}) {
  return stravaApiRequest("/athlete/activities", accessToken, options);
}

export async function deauthorize(accessToken) {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.message || "Failed to deauthorize Strava connection");
  }
}

export function normalizeConnection(userId, tokenPayload, athlete) {
  return {
    user_id: userId,
    athlete_id: athlete?.id ? String(athlete.id) : null,
    athlete_username: athlete?.username || null,
    athlete_firstname: athlete?.firstname || null,
    athlete_lastname: athlete?.lastname || null,
    profile_medium: athlete?.profile_medium || null,
    profile: athlete?.profile || null,
    city: athlete?.city || null,
    state: athlete?.state || null,
    country: athlete?.country || null,
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token,
    expires_at: String(tokenPayload.expires_at),
    scope: Array.isArray(tokenPayload.scope) ? tokenPayload.scope.join(",") : tokenPayload.scope || null,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function normalizeActivity(userId, activity) {
  return {
    user_id: userId,
    strava_id: String(activity.id),
    sport_type: activity.sport_type || activity.type || null,
    start_date: activity.start_date || null,
    distance_meters: activity.distance ? Math.round(activity.distance) : null,
    moving_time_seconds: activity.moving_time ?? null,
    avg_heart_rate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    elevation_gain: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : null,
    suffer_score: activity.suffer_score ?? null,
    synced_at: new Date().toISOString(),
  };
}
