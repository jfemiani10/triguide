import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/form-field";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const defaultForm = {
  goal: "",
  target_race: "",
  race_date: "",
  race_date_undetermined: false,
  race_distance: "",
  goal_finish_time: "",
  experience_level: "",
  weakest_discipline: "",
  weekly_hours: 6,
  injuries_limiters: "",
  health_data_consent: false,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile, profile } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest("/onboarding");
        setForm((current) => ({
          ...current,
          ...data.profile,
          health_data_consent: Boolean(data.profile?.health_data_consent_at),
        }));
      } catch (err) {
        if (profile) {
          setForm((current) => ({
            ...current,
            ...profile,
            health_data_consent: Boolean(profile.health_data_consent_at),
          }));
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile]);

  const requiredKeys = ["goal", "target_race", "race_distance", "experience_level", "weakest_discipline", "weekly_hours"];
  const filled = requiredKeys.filter((key) => String(form[key] || "").trim()).length;
  const completion = Math.round((filled / requiredKeys.length) * 100);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        weekly_hours: Number(form.weekly_hours),
      };
      const data = await apiRequest("/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      refreshProfile(data.user, data.profile);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageShell />;
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-['JetBrains_Mono'] text-[0.75rem] uppercase tracking-[0.12em] text-[var(--primary)]">
                    Step 2 of 3
                  </p>
                  <h2 className="mt-3 font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                    Build your athlete profile
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
                    TriGuide uses this information to personalize every recommendation. Complete all required fields to
                    unlock your dashboard and coaching chat.
                  </p>
                </div>
                <div className="hidden border-l border-[var(--border)] pl-6 text-right md:block">
                  <p className="font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Athlete
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text)]">{user?.name}</p>
                </div>
              </div>
              <Progress value={completion} />
              <p className="mt-3 font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {completion}% complete
              </p>
            </div>

            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <Label>Main goal</Label>
                <Select value={form.goal} onValueChange={(value) => setForm((current) => ({ ...current, goal: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your main goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete my first triathlon">Complete my first triathlon</SelectItem>
                    <SelectItem value="Improve my finish time">Improve my finish time</SelectItem>
                    <SelectItem value="Prepare for a specific race">Prepare for a specific race</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_race">Target race</Label>
                <Input
                  id="target_race"
                  placeholder="IRONMAN 70.3 Ohio"
                  value={form.target_race}
                  onChange={(event) => setForm((current) => ({ ...current, target_race: event.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Target race distance</Label>
                <Select
                  value={form.race_distance}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      race_distance: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your race distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sprint">Sprint</SelectItem>
                    <SelectItem value="Olympic">Olympic</SelectItem>
                    <SelectItem value="70.3">70.3</SelectItem>
                    <SelectItem value="Full Ironman">Full Ironman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="race_date">Race date</Label>
                <Input
                  id="race_date"
                  type="date"
                  value={form.race_date_undetermined ? "" : form.race_date || ""}
                  onChange={(event) => setForm((current) => ({ ...current, race_date: event.target.value }))}
                  disabled={Boolean(form.race_date_undetermined)}
                />
                <label className="mt-3 flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--primary)]"
                    checked={Boolean(form.race_date_undetermined)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        race_date_undetermined: event.target.checked,
                        race_date: event.target.checked ? "" : current.race_date,
                      }))
                    }
                  />
                  <span>Undetermined race date</span>
                </label>
              </div>

              <div>
                <Label htmlFor="goal_finish_time">Goal finish time</Label>
                <Input
                  id="goal_finish_time"
                  type="text"
                  inputMode="numeric"
                  placeholder="5:12:30"
                  value={form.goal_finish_time || ""}
                  onChange={(event) => setForm((current) => ({ ...current, goal_finish_time: event.target.value }))}
                />
                <p className="mt-2 text-sm text-[var(--text-muted)]">Enter race duration as hours, minutes, and seconds, for example `5:12:30`.</p>
              </div>

              <div>
                <Label>Experience level</Label>
                <Select
                  value={form.experience_level}
                  onValueChange={(value) => setForm((current) => ({ ...current, experience_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner (0-1 seasons)">Beginner (0-1 seasons)</SelectItem>
                    <SelectItem value="Intermediate (2-4 seasons)">Intermediate (2-4 seasons)</SelectItem>
                    <SelectItem value="Advanced (5+ seasons)">Advanced (5+ seasons)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Weakest discipline</Label>
                <Select
                  value={form.weakest_discipline}
                  onValueChange={(value) => setForm((current) => ({ ...current, weakest_discipline: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your weakest discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Swimming">Swimming</SelectItem>
                    <SelectItem value="Cycling">Cycling</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="All roughly equal">All roughly equal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weekly_hours">Weekly training hours available</Label>
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
                <Label htmlFor="injuries_limiters">Current injuries or physical limiters</Label>
                <Textarea
                  id="injuries_limiters"
                  placeholder="Optional. Include recurring pain, recovery limits, or mobility constraints."
                  value={form.injuries_limiters || ""}
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
              </div>
              <div className="md:col-span-2">
                <Button disabled={submitting}>
                  {submitting ? "Saving athlete profile..." : "Complete Onboarding"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
