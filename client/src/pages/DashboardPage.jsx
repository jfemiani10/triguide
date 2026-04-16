import { Link } from "react-router-dom";
import { ArrowUpRight, Waves } from "lucide-react";
import { PageShell, DashboardHeader } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";

const profileFields = [
  { key: "goal", label: "Goal" },
  { key: "target_race", label: "Target race" },
  { key: "race_distance", label: "Distance" },
  { key: "experience_level", label: "Experience" },
  { key: "weakest_discipline", label: "Weakest discipline" },
  { key: "weekly_hours", label: "Hours/week" },
];

export default function DashboardPage() {
  const { user, profile } = useAuth();

  return (
    <PageShell>
      <DashboardHeader
        title={`Welcome back, ${user?.name || "athlete"}`}
        description="Your athlete profile is live. Keep refining your race preparation and use TriGuide for direct, profile-aware training guidance."
        counter={user?.demo_messages_remaining ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[32px]">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Athlete profile</p>
                <h3 className="mt-2 text-2xl font-semibold">Current training context</h3>
              </div>
              <Link to="/profile">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {profileFields.map(({ key, label }) => (
                <div key={key} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
                  <p className="mt-2 text-lg font-medium">
                    {key === "weekly_hours" ? `${profile?.[key] ?? "-"} hours` : profile?.[key] || "Not set"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[32px] border-[rgba(70,178,255,0.18)] bg-[linear-gradient(180deg,rgba(8,17,30,0.95),rgba(5,9,16,0.95))]">
            <CardContent className="p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)]/16 text-[var(--secondary)]">
                <Waves className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold">Connect Strava for deeper insights</h3>
              <p className="mt-3 text-[var(--muted)]">
                Phase 1 keeps the integration stubbed, but the app is ready to surface training-history-driven coaching later.
              </p>
              <Link to="/strava" className="mt-6 inline-flex">
                <Button variant="secondary">
                  View Strava Status
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardContent className="p-8">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Next step</p>
              <h3 className="mt-2 text-2xl font-semibold">Open the coach chat</h3>
              <p className="mt-3 text-[var(--muted)]">
                Ask for a week outline, a race build recommendation, or help adjusting training around your constraints.
              </p>
              <Link to="/coach" className="mt-6 inline-flex">
                <Button>Start Chatting</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
