import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronRight, Moon, Sun, UserCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./button";

export function PageShell({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return localStorage.getItem("triguide-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("triguide-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 mb-10 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-container">
          <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <Link to="/landing" className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[var(--primary)]"
                  aria-hidden="true"
                >
                  <path
                    d="M22 12H18L15 21L9 3L6 12H2"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-['Barlow_Condensed'] text-3xl font-bold uppercase tracking-[0.04em] text-[var(--accent)]">
                  TriGuide
                </span>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em]">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>

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
          </div>
        </div>
      </header>

      <div className="page-container">
        {children}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] py-6 text-sm text-[var(--text-muted)]">
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
