import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/form-field";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    goal: profile?.goal || "",
    target_race: profile?.target_race || "",
    race_date: profile?.race_date || "",
    race_distance: profile?.race_distance || "",
    goal_finish_time: profile?.goal_finish_time || "",
    goal_finish_time_undetermined: Boolean(profile?.goal_finish_time_undetermined),
    experience_level: profile?.experience_level || "",
    weakest_discipline: profile?.weakest_discipline || "",
    weekly_hours: profile?.weekly_hours || 6,
    injuries_limiters: profile?.injuries_limiters || "",
    health_data_consent: Boolean(profile?.health_data_consent_at),
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const data = await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          weekly_hours: Number(form.weekly_hours),
        }),
      });
      refreshProfile(data.user, data.profile);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <Card>
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="pill mb-4">Profile</div>
              <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                Edit your athlete details
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
                Keep your goal, limiter profile, and available hours current so TriGuide stays accurate.
              </p>
            </div>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="goal">Main goal</Label>
                <Input id="goal" value={form.goal} onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="target_race">Target race</Label>
                <Input
                  id="target_race"
                  value={form.target_race}
                  onChange={(event) => setForm((current) => ({ ...current, target_race: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="race_distance">Race distance</Label>
                <Input
                  id="race_distance"
                  value={form.race_distance}
                  onChange={(event) => setForm((current) => ({ ...current, race_distance: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="race_date">Race date</Label>
                <Input
                  id="race_date"
                  type="date"
                  value={form.race_date}
                  onChange={(event) => setForm((current) => ({ ...current, race_date: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="goal_finish_time">Goal finish time</Label>
                <Input
                  id="goal_finish_time"
                  type="text"
                  inputMode="numeric"
                  placeholder="5:12:30"
                  value={form.goal_finish_time_undetermined ? "" : form.goal_finish_time}
                  onChange={(event) => setForm((current) => ({ ...current, goal_finish_time: event.target.value }))}
                  disabled={Boolean(form.goal_finish_time_undetermined)}
                />
                <p className="mt-2 text-sm text-[var(--text-muted)]">Enter race duration as hours, minutes, and seconds, for example `5:12:30`.</p>
                <label className="mt-3 flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--primary)]"
                    checked={Boolean(form.goal_finish_time_undetermined)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        goal_finish_time_undetermined: event.target.checked,
                        goal_finish_time: event.target.checked ? "" : current.goal_finish_time,
                      }))
                    }
                  />
                  <span>Undetermined time</span>
                </label>
              </div>
              <div>
                <Label htmlFor="experience_level">Experience level</Label>
                <Input
                  id="experience_level"
                  value={form.experience_level}
                  onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weakest_discipline">Weakest discipline</Label>
                <Input
                  id="weakest_discipline"
                  value={form.weakest_discipline}
                  onChange={(event) => setForm((current) => ({ ...current, weakest_discipline: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weekly_hours">Weekly hours</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  min={3}
                  max={20}
                  value={form.weekly_hours}
                  onChange={(event) => setForm((current) => ({ ...current, weekly_hours: event.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="injuries_limiters">Injuries or limiters</Label>
                <Textarea
                  id="injuries_limiters"
                  value={form.injuries_limiters}
                  onChange={(event) => setForm((current) => ({ ...current, injuries_limiters: event.target.value }))}
                />
                <label className="mt-4 flex items-start gap-3 rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                    checked={Boolean(form.health_data_consent)}
                    onChange={(event) => setForm((current) => ({ ...current, health_data_consent: event.target.checked }))}
                  />
                  <span>
                    If I share injury or health information here, I consent to TriGuide processing it to personalize coaching guidance.
                  </span>
                </label>
              </div>
              <div className="md:col-span-2">
                <FieldError message={error} />
                {success ? <p className="mt-2 text-sm text-[var(--primary)]">{success}</p> : null}
              </div>
              <div className="md:col-span-2">
                <Button disabled={submitting}>{submitting ? "Saving..." : "Save Profile"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="kicker">Account</p>
            <h3 className="mt-3 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
              {user?.name}
            </h3>
            <p className="mt-2 text-[var(--text-muted)]">{user?.email}</p>
            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <p className="metric-value">{user?.demo_messages_remaining ?? 0}</p>
              <p className="metric-label mt-2">Messages Remaining</p>
            </div>
            <Link
              to="/data"
              className="mt-5 inline-flex items-center text-sm text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Manage data and privacy
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
