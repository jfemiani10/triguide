import { Link } from "react-router-dom";
import { Cable, ChevronRight } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function StravaPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-[36px]">
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--secondary)]/16 text-[var(--secondary)]">
              <Cable className="h-7 w-7" />
            </div>
            <div className="pill mb-4">Integration Stub</div>
            <h2 className="text-4xl font-semibold tracking-tight">Strava Integration Coming Soon</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Phase 1 intentionally stops at the placeholder. Once activity sync is live, TriGuide will use training
              history to sharpen coaching recommendations and quantify load trends.
            </p>
            <Link to="/dashboard" className="mt-8 inline-flex">
              <Button variant="secondary">
                Back to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
