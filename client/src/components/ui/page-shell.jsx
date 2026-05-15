import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function MenuLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--primary)]" />
      {label}
    </Link>
  );
}

export function PageShell({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("triguide-theme") || "dark";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("triguide-theme", theme);
    } else {
      document.documentElement.dataset.theme = "dark";
    }
  }, [theme, isAuthenticated]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 mb-10 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-container">
          <div className="flex items-center justify-between py-4">
            <Link
              to={isAuthenticated ? "/coach" : "/landing"}
              className="flex items-center gap-3"
            >
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
            </Link>

            {isAuthenticated && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Settings and account"
                  aria-expanded={menuOpen}
                  className="flex items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                    {/* User identity */}
                    <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-alt)] px-4 py-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                        <span className="text-sm font-bold">{initial}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">
                          {user?.name}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="p-2">
                      <MenuLink
                        to="/profile"
                        icon={User}
                        label="Edit Profile"
                        onClick={() => setMenuOpen(false)}
                      />
                      <MenuLink
                        to="/dashboard"
                        icon={LayoutDashboard}
                        label="Athlete Dashboard"
                        onClick={() => setMenuOpen(false)}
                      />
                      <MenuLink
                        to="/strava"
                        icon={Activity}
                        label="Strava Integration"
                        onClick={() => setMenuOpen(false)}
                      />
                      <MenuLink
                        to="/data"
                        icon={Shield}
                        label="Data & Privacy"
                        onClick={() => setMenuOpen(false)}
                      />
                    </div>

                    {/* Theme toggle */}
                    <div className="border-t border-[var(--border)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Appearance
                        </p>
                        <button
                          type="button"
                          onClick={toggleTheme}
                          aria-label={
                            theme === "dark"
                              ? "Switch to light mode"
                              : "Switch to dark mode"
                          }
                          className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] px-2.5 py-1.5 text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        >
                          {theme === "dark" ? (
                            <Sun className="h-3.5 w-3.5" />
                          ) : (
                            <Moon className="h-3.5 w-3.5" />
                          )}
                          <span className="font-['JetBrains_Mono'] text-[0.68rem] uppercase tracking-[0.1em]">
                            {theme === "dark" ? "Light" : "Dark"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Log out */}
                    <div className="border-t border-[var(--border)] p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-alt)] hover:text-[var(--danger)]"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[0.74rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span>Coaching Hub</span>
        </div>
        <div>
          <h2 className="font-['Barlow_Condensed'] text-[clamp(3rem,6vw,4.75rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[var(--accent)]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
            {description}
          </p>
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
