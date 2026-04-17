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
        <Card>
          <CardContent className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="kicker">Athlete Profile</p>
                <h3 className="mt-2 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                  Current training context
                </h3>
              </div>
              <Link to="/profile">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </div>
            <div className="grid gap-0 border-y border-[var(--border)]">
              {profileFields.map(({ key, label }) => (
                <div
                  key={key}
                  className="grid gap-2 border-b border-[var(--border)] py-4 last:border-b-0 md:grid-cols-[0.35fr_0.65fr] md:items-center"
                >
                  <p className="font-['JetBrains_Mono'] text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {label}
                  </p>
                  <p className="text-lg font-medium text-[var(--text)]">
                    {key === "weekly_hours" ? `${profile?.[key] ?? "-"} hours` : profile?.[key] || "Not set"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <p className="kicker">Connected Training Data</p>
              <div className="mt-4 flex items-center gap-3 text-[var(--accent)]">
                <Waves className="h-5 w-5" />
                <span className="font-['Barlow_Condensed'] text-3xl font-bold uppercase leading-none">Strava</span>
              </div>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
                Strava connection is available in TriGuide, but the integration is still being finalized and may not be fully reliable yet.
              </p>
              <Link to="/strava" className="mt-6 inline-flex">
                <Button variant="secondary">
                  View Strava Status
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <p className="kicker">Next Step</p>
              <h3 className="mt-2 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                Open the coach chat
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
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
