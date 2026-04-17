import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, ShieldCheck, Trash2, Unplug } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest, getToken } from "../lib/api";
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

export default function DataPage() {
  const { user, refreshProfile, logout } = useAuth();
  const [busyAction, setBusyAction] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [stravaInfo, setStravaInfo] = useState(null);
  const [error, setError] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadStravaInfo() {
      if (!user?.strava_connected) {
        setStravaInfo(null);
        return;
      }

      try {
        const data = await apiRequest("/strava");

        if (ignore) {
          return;
        }

        setStravaInfo(data);
        refreshProfile(data.user);
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Unable to load Strava data.");
        }
      }
    }

    loadStravaInfo();

    return () => {
      ignore = true;
    };
  }, [user?.strava_connected]);

  useEffect(() => {
    if (!exportSuccess) {
      return;
    }

    const timeoutId = setTimeout(() => setExportSuccess(false), 3000);
    return () => clearTimeout(timeoutId);
  }, [exportSuccess]);

  async function handleExport() {
    setBusyAction("export");
    setError("");
    setExportSuccess(false);

    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "")}/data/export`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        let message = "Unable to export your data.";

        try {
          const payload = await response.json();
          message = payload?.error || message;
        } catch {
          message = "Unable to export your data.";
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "triguide-data-export.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setExportSuccess(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to export your data.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleClearStrava() {
    setBusyAction("clearStrava");
    setError("");

    try {
      const data = await apiRequest("/strava/connection", { method: "DELETE" });
      setStravaInfo(null);
      refreshProfile(data?.user || { ...user, strava_connected: false });
    } catch (requestError) {
      setError(requestError.message || "Unable to clear Strava data.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDeleteAccount() {
    setBusyAction("deleteAccount");
    setError("");

    try {
      await apiRequest("/data/account", { method: "DELETE" });
      logout();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete your account.");
      setBusyAction("");
    }
  }

  const stravaConnection = stravaInfo?.connection || null;
  const activityCount = stravaInfo?.activity_count ?? 0;
  const deleteConfirmMatches = deleteConfirmText.trim() === "delete my account";

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="rounded-[36px] border-[rgba(70,178,255,0.18)] bg-[linear-gradient(180deg,rgba(8,17,30,0.96),rgba(5,9,16,0.98))]">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="pill mb-4">Data & Privacy</div>
                <h2 className="text-4xl font-semibold tracking-tight">Manage your account data and privacy rights</h2>
                <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
                  Export what TriGuide stores, clear connected Strava data, delete your account, or review your privacy rights.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--secondary)]/14 text-[var(--secondary)]">
                <ShieldCheck className="h-8 w-8" />
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-3xl border border-[rgba(255,107,107,0.28)] bg-[rgba(255,107,107,0.08)] px-5 py-4 text-sm text-[#ffd1d1]">
                {error}
              </div>
            ) : null}

            {exportSuccess ? (
              <div className="mt-6 rounded-3xl border border-[rgba(70,211,161,0.28)] bg-[rgba(70,211,161,0.08)] px-5 py-4 text-sm text-[#b4f4db]">
                Your data export has started downloading.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Export Your Data</p>
              <h3 className="mt-3 text-2xl font-semibold">Download a full account export</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                Export your profile, chat history, Strava connection details, and imported activities in JSON format.
              </p>
              <div className="mt-6">
                <Button onClick={handleExport} disabled={busyAction === "export"}>
                  <Download className="mr-2 h-4 w-4" />
                  {busyAction === "export" ? "Preparing export..." : "Export my data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Strava Data</p>
              <h3 className="mt-3 text-2xl font-semibold">Review and clear synced training data</h3>
              {user?.strava_connected && stravaConnection ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--muted)]">
                    <p className="font-semibold text-white">
                      {stravaConnection.athlete_name || stravaConnection.athlete_username || "Connected athlete"}
                    </p>
                    <p className="mt-1">
                      {[stravaConnection.city, stravaConnection.state, stravaConnection.country].filter(Boolean).join(", ") || "Location unavailable"}
                    </p>
                    <p className="mt-3">Imported activities stored: {activityCount}</p>
                    <p className="mt-1">Last updated: {formatDate(stravaConnection.updated_at)}</p>
                  </div>
                  <Button variant="secondary" onClick={handleClearStrava} disabled={busyAction === "clearStrava"}>
                    <Unplug className="mr-2 h-4 w-4" />
                    {busyAction === "clearStrava" ? "Clearing..." : "Clear Strava data"}
                  </Button>
                </div>
              ) : (
                <p className="mt-4 leading-7 text-[var(--muted)]">No Strava data stored.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-[rgba(255,107,107,0.18)]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--danger)]">Danger Zone</p>
              <h3 className="mt-3 text-2xl font-semibold">Delete your account</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                This permanently deletes your account and all related profile, chat, Strava connection, and activity data stored in TriGuide.
              </p>
              <div className="mt-6">
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete my account
                </Button>
              </div>

              {showDeleteModal ? (
                <div className="mt-6 rounded-[24px] border border-[rgba(255,107,107,0.24)] bg-[rgba(255,107,107,0.08)] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ffd1d1]">Confirm deletion</p>
                  <p className="mt-3 text-sm leading-7 text-[#ffe3e3]">
                    Type <span className="font-semibold text-white">delete my account</span> to enable permanent account deletion.
                  </p>
                  <input
                    className="input-base mt-4"
                    value={deleteConfirmText}
                    onChange={(event) => setDeleteConfirmText(event.target.value)}
                    placeholder="delete my account"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={!deleteConfirmMatches || busyAction === "deleteAccount"}
                    >
                      {busyAction === "deleteAccount" ? "Deleting..." : "Confirm account deletion"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Your Privacy Rights</p>
              <h3 className="mt-3 text-2xl font-semibold">Know, access, correct, export, and delete</h3>
              <div className="mt-4 space-y-4 leading-7 text-[var(--muted)]">
                <p>
                  Depending on where you live, you may have rights under laws such as GDPR or CCPA/US state privacy laws,
                  including rights to access your data, request correction, request deletion, and receive a copy of what we store.
                </p>
                <p>
                  You can review our legal documents here:
                  {" "}
                  <Link to="/privacy-policy" className="text-[var(--secondary)] hover:underline">
                    Privacy Policy
                  </Link>
                  {" "}
                  and
                  {" "}
                  <Link to="/terms-of-use" className="text-[var(--secondary)] hover:underline">
                    Terms of Use
                  </Link>
                  .
                </p>
                <p>
                  For privacy questions or formal requests, email{" "}
                  <a className="text-[var(--secondary)] hover:underline" href="mailto:jonah.femiani07@gmail.com">
                    jonah.femiani07@gmail.com
                  </a>
                  {" "}
                  or use the Termly form below.
                </p>
                <p>
                  <a
                    className="inline-flex items-center text-[var(--secondary)] hover:underline"
                    href="https://app.termly.io/dsar/9ca1c0b9-8ff3-4d1c-88b7-ffc8271e92ad"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open the Termly privacy request form
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
