import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/form-field";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await login(data);
      navigate(location.state?.from || (data.user.onboarding_complete ? "/dashboard" : "/onboarding"), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="pill mb-4">Log In</div>
              <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                Back to your training block
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
                Pick up where you left off and continue the coaching conversation.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </div>
              <FieldError message={error} />
              <Button className="w-full" disabled={submitting}>
                {submitting ? "Checking credentials..." : "Log In"}
              </Button>
            </form>
            <p className="mt-6 text-sm text-[var(--text-muted)]">
              New here?{" "}
              <Link to="/signup" className="font-semibold text-[var(--primary)]">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
