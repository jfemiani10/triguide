import { useEffect, useState } from "react";
import { Activity, Cable, RefreshCw, Unplug } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDistance(meters) {
  if (!meters) {
    return "0.0 km";
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatMovingTime(seconds) {
  if (!seconds) {
    return "Time unavailable";
  }

  return `${Math.round(seconds / 60)} min moving`;
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

export default function StravaPage() {
  const { refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftSuccess, setDraftSuccess] = useState("");
  const [draftNote, setDraftNote] = useState(createEmptyDraft());
  const [draftActivityId, setDraftActivityId] = useState(null);
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

  function updateDraft(field, value) {
    setDraftNote((current) => ({
      ...current,
      [field]: value,
    }));
  }

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

  async function handlePrefill(activityId) {
    setBusyAction(`prefill-${activityId}`);
    setDraftError("");
    setDraftSuccess("");

    try {
      const data = await apiRequest(`/strava/activities/${activityId}/prefill`, { method: "POST" });
      setDraftNote({
        ...data.draft,
        session_date: data.draft.session_date || "",
        distance_meters: data.draft.distance_meters ?? "",
        moving_time_seconds: data.draft.moving_time_seconds ?? "",
      });
      setDraftActivityId(activityId);
    } catch (requestError) {
      setDraftError(requestError.message || "Unable to prepare coaching note.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleSaveDraft(event) {
    event.preventDefault();
    setBusyAction("save-draft");
    setDraftError("");
    setDraftSuccess("");

    try {
      await apiRequest("/coach/context", {
        method: "POST",
        body: JSON.stringify({
          ...draftNote,
          distance_meters: draftNote.distance_meters ? Number(draftNote.distance_meters) : null,
          moving_time_seconds: draftNote.moving_time_seconds ? Number(draftNote.moving_time_seconds) : null,
        }),
      });
      setDraftSuccess("Saved to your coaching notes. TriGuide can now use it in future coaching.");
      setDraftActivityId(null);
      setDraftNote(createEmptyDraft());
    } catch (requestError) {
      setDraftError(requestError.message || "Unable to save coaching note.");
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
                  Sync recent Strava activities into TriGuide for reference, review, and easy note-taking. Coaching only uses the sessions you explicitly save into your coaching notes.
                </p>
                <p className="mt-4 font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--primary)]">
                  Note: Strava connection is not fully set up yet and may still be unreliable.
                </p>
                <p className="mt-3 font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Compatible with Strava
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
                  <img src="/btn_strava_connect_with_orange.png" alt="Connect with Strava" className="h-12 w-auto" />
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

                  <p className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Cached activity data is kept short-term for up to 7 days and removed on disconnect.
                  </p>
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="kicker">Latest Imported Workouts</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    Imported activities are for reference. To use one in coaching, click <strong>Add to coaching</strong>, review the draft, and save it.
                  </p>
                </div>
                <p className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Compatible with Strava
                </p>
              </div>

              {draftActivityId ? (
                <form onSubmit={handleSaveDraft} className="mt-5 space-y-4 border border-[var(--border)] bg-[var(--bg-alt)] p-4">
                  <p className="kicker">Add to coaching</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="metric-label mb-2">Sport</p>
                      <Input value={draftNote.sport} onChange={(event) => updateDraft("sport", event.target.value)} />
                    </div>
                    <div>
                      <p className="metric-label mb-2">Session date</p>
                      <Input type="date" value={draftNote.session_date} onChange={(event) => updateDraft("session_date", event.target.value)} />
                    </div>
                  </div>
                  <div>
                    <p className="metric-label mb-2">Title</p>
                    <Input value={draftNote.title} onChange={(event) => updateDraft("title", event.target.value)} />
                  </div>
                  <div>
                    <p className="metric-label mb-2">Summary</p>
                    <Textarea value={draftNote.summary} onChange={(event) => updateDraft("summary", event.target.value)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="metric-label mb-2">Distance (meters)</p>
                      <Input type="number" min="0" value={draftNote.distance_meters} onChange={(event) => updateDraft("distance_meters", event.target.value)} />
                    </div>
                    <div>
                      <p className="metric-label mb-2">Moving time (seconds)</p>
                      <Input type="number" min="0" value={draftNote.moving_time_seconds} onChange={(event) => updateDraft("moving_time_seconds", event.target.value)} />
                    </div>
                  </div>
                  {draftError ? <p className="text-sm text-[var(--primary)]">{draftError}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={busyAction === "save-draft"}>
                      {busyAction === "save-draft" ? "Saving..." : "Save to coaching"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setDraftActivityId(null);
                        setDraftNote(createEmptyDraft());
                        setDraftError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}

              {draftSuccess ? (
                <div className="mt-5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3 text-sm text-[var(--text)]">
                  {draftSuccess}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {loading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading recent activities...</p>
                ) : status?.recent_activities?.length ? (
                  status.recent_activities.map((activity) => (
                    <div key={activity.id} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text)]">{activity.sport_type || "Workout"}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDate(activity.start_date)}</p>
                        </div>
                        <div className="text-right text-sm text-[var(--text-muted)]">
                          <p>{formatDistance(activity.distance_meters)}</p>
                          <p className="mt-1">{formatMovingTime(activity.moving_time_seconds)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handlePrefill(activity.id)}
                          disabled={busyAction === `prefill-${activity.id}`}
                          className="font-semibold text-[var(--primary)] transition hover:text-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyAction === `prefill-${activity.id}` ? "Preparing..." : "Add to coaching"}
                        </button>
                        <a
                          href={`https://www.strava.com/activities/${activity.strava_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline decoration-1 underline-offset-2 transition hover:opacity-80"
                          style={{ color: "#FC5200" }}
                        >
                          View on Strava
                        </a>
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
