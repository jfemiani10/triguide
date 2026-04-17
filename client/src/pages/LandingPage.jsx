import { Link } from "react-router-dom";
import { ArrowRight, Gauge, HeartPulse, TimerReset } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const highlights = [
  {
    title: "Profile-aware coaching",
    copy: "TriGuide adapts recommendations to your race goal, available training time, and limiter profile.",
    icon: HeartPulse,
  },
  {
    title: "Periodized guidance",
    copy: "Every chat response is framed around triathlon-specific concepts like Z2 loading, brick work, and race-pace control.",
    icon: TimerReset,
  },
  {
    title: "Built for serious athletes",
    copy: "Dark, performance-first UX designed for athletes who care about specificity, not motivational fluff.",
    icon: Gauge,
  },
];

export default function LandingPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="panel grid-pattern rounded-[40px] p-8 md:p-12">
            <div className="pill mb-5">Phase 1 Coaching Platform</div>
            <h2 className="section-title mb-6 max-w-3xl font-semibold">
              Train for your next triathlon with an AI coach that speaks your language.
            </h2>
            <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              TriGuide helps you turn a race goal into structured coaching conversations. Capture your athlete profile,
              get direct feedback, and keep your plan focused even before your training data is connected.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup">
                <Button className="w-full sm:w-auto">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Log In
                </Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-[40px] bg-[linear-gradient(180deg,rgba(11,20,34,0.96),rgba(5,10,18,0.98))]">
            <CardContent className="space-y-6 p-8">
              <div className="rounded-[28px] border border-white/8 bg-white/4 p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Coach Snapshot</p>
                <p className="mt-3 text-xl font-medium leading-8 text-slate-100">
                  “You’ve got 7 hours a week and a 70.3 on the calendar. Let’s stabilize your run durability before we
                  layer in more threshold bike work.”
                </p>
              </div>
              <div className="grid gap-4">
                {highlights.map(({ title, copy, icon: Icon }) => (
                  <div key={title} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary)]/14 text-[var(--secondary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-black/20 px-5 py-4 text-sm text-[var(--muted)]">
          <p>TriGuide legal and privacy information.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="transition hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
