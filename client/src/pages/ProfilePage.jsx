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
    race_distance: profile?.race_distance || "",
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
        <Card className="rounded-[32px]">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="pill mb-4">Profile</div>
              <h2 className="text-3xl font-semibold tracking-tight">Edit your athlete details</h2>
              <p className="mt-3 text-[var(--muted)]">
                Keep your goal, limiter profile, and available hours current so TriGuide stays accurate.
              </p>
            </div>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="goal">Main goal</Label>
                <Input id="goal" value={form.goal} onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))} required />
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
                <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-[var(--muted)]">
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
                {success ? <p className="mt-2 text-sm text-emerald-300">{success}</p> : null}
              </div>
              <div className="md:col-span-2">
                <Button disabled={submitting}>{submitting ? "Saving..." : "Save Profile"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[32px]">
          <CardContent className="p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Account</p>
            <h3 className="mt-3 text-2xl font-semibold">{user?.name}</h3>
            <p className="mt-1 text-[var(--muted)]">{user?.email}</p>
            <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Messages remaining</p>
              <p className="mt-2 text-3xl font-semibold">{user?.demo_messages_remaining ?? 0}</p>
            </div>
            <Link
              to="/data"
              className="mt-4 inline-flex items-center text-sm text-[var(--secondary)] transition hover:text-white"
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
