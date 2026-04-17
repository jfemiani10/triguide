import { Link, NavLink } from "react-router-dom";
import { ChevronRight, UserCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./button";

export function PageShell({ children }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="sticky top-0 z-30 mb-10 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 px-1 py-5 md:flex-row md:items-center md:justify-between">
            <Link to="/landing" className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-3xl font-bold uppercase tracking-[0.04em] text-[var(--accent)]">
                  TriGuide
                </span>
                <span className="text-[var(--primary)]">/</span>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className="rounded px-3 py-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                    Dashboard
                  </NavLink>
                  <NavLink to="/coach" className="rounded px-3 py-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                    Coach
                  </NavLink>
                  <NavLink to="/profile" className="rounded px-3 py-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                    Profile
                  </NavLink>
                  <NavLink to="/data" className="rounded px-3 py-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                    Data & Privacy
                  </NavLink>
                  <Button variant="ghost" onClick={logout} className="px-3 py-2">
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="rounded px-3 py-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                    Log In
                  </NavLink>
                  <Link to="/signup">
                    <Button className="px-4 py-2">Start Training</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-1 py-6 text-sm text-[var(--text-muted)]">
          <p>TriGuide</p>
          <div className="flex items-center gap-4">
            <Link to="/data" className="transition hover:text-[var(--primary)]">
              Data & Privacy
            </Link>
            <Link to="/terms-of-use" className="transition hover:text-[var(--primary)]">
              Terms of Use
            </Link>
            <Link to="/privacy-policy" className="transition hover:text-[var(--primary)]">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function DashboardHeader({ title, description, counter }) {
  return (
    <div className="mb-12 grid gap-6 lg:grid-cols-[1.45fr_0.55fr] lg:items-end">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[0.74rem] uppercase tracking-[0.12em] text-[var(--text-muted)] font-['JetBrains_Mono']">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span>Coaching Hub</span>
        </div>
        <div>
          <h2 className="font-['Barlow_Condensed'] text-[clamp(3rem,6vw,4.75rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[var(--accent)]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-muted)]">{description}</p>
        </div>
      </div>
      <div className="panel rounded-[8px] p-6">
        <div className="mb-3 flex items-center gap-3 text-[var(--text-muted)]">
          <UserCircle2 className="h-5 w-5 text-[var(--accent)]" />
          Message Budget
        </div>
        <p className="metric-value">{counter}</p>
        <p className="metric-label mt-3">Messages Remaining</p>
      </div>
    </div>
  );
}
