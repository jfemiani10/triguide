import { Link, NavLink } from "react-router-dom";
import { Activity, MessageSquareText, UserCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./button";

export function PageShell({ children }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/8 bg-black/20 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/16 text-[var(--primary)]">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Triathlon Coaching</p>
              <h1 className="text-xl font-semibold tracking-tight">TriGuide</h1>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="rounded-xl px-3 py-2 text-[var(--muted)] hover:bg-white/6 hover:text-white">
                  Dashboard
                </NavLink>
                <NavLink to="/coach" className="rounded-xl px-3 py-2 text-[var(--muted)] hover:bg-white/6 hover:text-white">
                  Coach
                </NavLink>
                <NavLink to="/profile" className="rounded-xl px-3 py-2 text-[var(--muted)] hover:bg-white/6 hover:text-white">
                  Profile
                </NavLink>
                <Button variant="ghost" onClick={logout} className="rounded-xl px-3 py-2">
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="rounded-xl px-3 py-2 text-[var(--muted)] hover:bg-white/6 hover:text-white">
                  Log In
                </NavLink>
                <Link to="/signup">
                  <Button className="rounded-xl">Start Training</Button>
                </Link>
              </>
            )}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}

export function DashboardHeader({ title, description, counter }) {
  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="panel grid-pattern rounded-[32px] p-6 md:p-8">
        <div className="pill mb-4">
          <MessageSquareText className="h-3.5 w-3.5" />
          AI Endurance Coaching
        </div>
        <h2 className="mb-3 text-4xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-base text-[var(--muted)]">{description}</p>
      </div>
      <div className="panel rounded-[32px] p-6">
        <div className="mb-3 flex items-center gap-3 text-[var(--muted)]">
          <UserCircle2 className="h-5 w-5" />
          Message Budget
        </div>
        <p className="text-4xl font-semibold">{counter}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Coaching messages remaining in your demo allocation.</p>
      </div>
    </div>
  );
}
