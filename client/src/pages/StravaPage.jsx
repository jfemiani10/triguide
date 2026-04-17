import { useEffect, useState } from "react";
import { Activity, Cable, RefreshCw, Unplug } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatDistance(meters) {
  if (!meters) {
    return "0.0 km";
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function readFlashMessage(searchParams) {
  const statusParam = searchParams.get("status");
  const messageParam = searchParams.get("message");

  if (statusParam === "connected") {
    return { tone: "success", text: "Strava connected and your latest activities were synced." };
  }

  if (statusParam === "error") {
    return { tone: "error", text: messageParam ? `Strava connection failed: ${messageParam}` : "Strava connection failed." };
  }

  return null;
}

export default function StravaPage() {
  const { refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [flashMessage] = useState(() => readFlashMessage(searchParams));

  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest("/strava");

        if (ignore) {
          return;
        }

        setStatus(data);
        refreshProfile(data.user);
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Unable to load Strava status.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!searchParams.get("status") && !searchParams.get("message")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("status");
    nextParams.delete("message");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  async function handleConnect() {
    setBusyAction("connect");
    setError("");

    try {
      const data = await apiRequest("/strava/connect-url");
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || "Unable to start the Strava connection flow.");
      setBusyAction("");
    }
  }

  async function runMutation(path, options, actionName) {
    setBusyAction(actionName);
    setError("");

    try {
      const data = await apiRequest(path, options);
      setStatus(data);
      refreshProfile(data.user);
    } catch (requestError) {
      setError(requestError.message || "Strava request failed.");
    } finally {
      setBusyAction("");
    }
  }

  const connection = status?.connection;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="pill mb-4">Strava Integration</div>
                <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                  Connect your training history to TriGuide
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
                  Pull your recent Strava activities into TriGuide so coaching can lean on real training load instead of
                  profile details alone.
                </p>
                <p className="mt-4 font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--primary)]">
                  Note: Strava connection is not fully set up yet and may still be unreliable.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--primary)]">
                <Cable className="h-8 w-8" />
              </div>
            </div>

            {flashMessage ? (
              <div
                className={`mt-6 rounded-[4px] border px-5 py-4 text-sm ${
                  flashMessage.tone === "success"
                    ? "border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)]"
                    : "border-[var(--primary)] bg-[#fdf0ee] text-[var(--text)]"
                }`}
              >
                {flashMessage.text}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[4px] border border-[var(--primary)] bg-[#fdf0ee] px-5 py-4 text-sm text-[var(--text)]">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {connection ? (
                <Button onClick={handleConnect} disabled={busyAction === "connect"}>
                  {busyAction === "connect" ? "Reconnecting..." : "Reconnect Strava"}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={busyAction === "connect"}
                  className="rounded-[4px] transition disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Connect with Strava"
                >
                  <img
                    src="/btn_strava_connect_with_orange.png"
                    alt="Connect with Strava"
                    className="h-12 w-auto"
                  />
                </button>
              )}
              <Button
                variant="secondary"
                onClick={() => runMutation("/strava/sync", { method: "POST" }, "sync")}
                disabled={!connection || busyAction === "sync" || loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {busyAction === "sync" ? "Syncing..." : "Sync Activities"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => runMutation("/strava/connection", { method: "DELETE" }, "disconnect")}
                disabled={!connection || busyAction === "disconnect" || loading}
              >
                <Unplug className="mr-2 h-4 w-4" />
                {busyAction === "disconnect" ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
            {!connection && busyAction === "connect" ? (
              <p className="mt-3 font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Opening Strava authorization...
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--accent)]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="kicker">Connection Status</p>
                  <h3 className="font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                    {connection ? "Connected" : "Not connected"}
                  </h3>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-[var(--text-muted)]">Loading Strava status...</p>
              ) : connection ? (
                <div className="space-y-4 text-sm text-[var(--text-muted)]">
                  <div className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] p-4">
                    <p className="font-semibold text-[var(--text)]">{connection.athlete_name || connection.athlete_username || "Connected athlete"}</p>
                    <p className="mt-1">
                      {[connection.city, connection.state, connection.country].filter(Boolean).join(", ") || "Location unavailable"}
                    </p>
                    <p className="mt-3">Scopes: {connection.scope || "Not reported by Strava"}</p>
                    <p className="mt-1">Connected: {formatDate(connection.connected_at)}</p>
                    <p className="mt-1">Token expires: {formatDate(Number(connection.expires_at) * 1000)}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="metric-label">Recent activities stored</p>
                      <p className="metric-value mt-2">{status?.activity_count ?? 0}</p>
                    </div>
                    <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="metric-label">Last sync</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                        {status?.recent_activities?.[0]?.synced_at ? formatDate(status.recent_activities[0].synced_at) : "No sync yet"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  Use the connect button above, authorize TriGuide in Strava, and you will land back here automatically.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="kicker">Latest Imported Workouts</p>
              <div className="mt-5 space-y-3">
                {loading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading recent activities...</p>
                ) : status?.recent_activities?.length ? (
                  status.recent_activities.map((activity) => (
                    <div key={activity.id} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text)]">{activity.sport_type || "Workout"}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDate(activity.start_date)}</p>
                        </div>
                        <div className="text-right text-sm text-[var(--text-muted)]">
                          <p>{formatDistance(activity.distance_meters)}</p>
                          <p className="mt-1">{activity.moving_time_seconds ? `${Math.round(activity.moving_time_seconds / 60)} min moving` : "Time unavailable"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-[var(--text-muted)]">
                    No Strava activities have been imported yet. After connecting, use “Sync Activities” to pull the latest workouts.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
