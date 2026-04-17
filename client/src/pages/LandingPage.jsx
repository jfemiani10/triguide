import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Button } from "../components/ui/button";

const metrics = [
  { value: "3", label: "Disciplines" },
  { value: "1", label: "Personalized Plan" },
  { value: "24/7", label: "Real Activity Data" },
];

export default function LandingPage() {
  return (
    <PageShell>
      <section className="grid gap-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <div className="pill w-fit">Editorial Coaching Platform</div>
            <h1 className="font-['Barlow_Condensed'] text-[clamp(4rem,9vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[var(--accent)]">
              Your AI
              <br />
              Triathlon Coach
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              TriGuide blends athlete profiling, training context, and activity history into coaching software that feels
              built for the season ahead, not for a demo day.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup">
                <Button className="w-full sm:w-auto">
                  Start Training
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Log In
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="pill w-fit">Athlete Profile</p>
                <h2 className="mt-4 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                  Training Context First
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-base leading-7 text-[var(--text-muted)]">
                  Build around race distance, weekly hours, and the discipline that needs the most work before race day.
                </p>
                <p className="text-base leading-7 text-[var(--text-muted)]">
                  Keep every recommendation grounded in the realities of your schedule, durability, and recent work.
                </p>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="relative overflow-hidden bg-[var(--bg)]">
              <img
                src="/hero-cyclist-cutout.png"
                alt="Time trial cyclist in aerodynamic position"
                className="h-[620px] w-full translate-y-[18%] object-contain object-right-top"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[var(--bg)] via-[color:color-mix(in_srgb,var(--bg)_78%,transparent)] to-transparent" />
            </div>

            <div className="relative z-10 -mt-44 ml-auto w-full max-w-[88%] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.14)] md:p-8">
              <div>
                <p className="kicker">Built For Race Season</p>
                <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
                  Structured athlete intake, practical coaching chat, and Strava-backed context in one place.
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="border-t border-[var(--border)] pt-4">
                    <p className="metric-value">{metric.value}</p>
                    <p className="metric-label mt-2">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
