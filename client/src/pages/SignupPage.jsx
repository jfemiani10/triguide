import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { FieldError } from "../components/ui/form-field";
import { apiRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    accepted_terms: false,
    accepted_privacy: false,
    age_confirmed: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await login(data);
      navigate("/onboarding", { replace: true });
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
              <div className="pill mb-4">Sign Up</div>
              <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                Start building your race plan
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
                Set up your profile and unlock direct, triathlon-specific coaching guidance.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </div>
              <label className="flex items-start gap-3 rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3 text-sm text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  checked={form.accepted_terms}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accepted_terms: event.target.checked,
                      accepted_privacy: event.target.checked,
                    }))
                  }
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms-of-use" className="font-semibold text-[var(--primary)] hover:underline">
                    Terms of Use
                  </Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" className="font-semibold text-[var(--primary)] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[4px] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3 text-sm text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  checked={form.age_confirmed}
                  onChange={(event) => setForm((current) => ({ ...current, age_confirmed: event.target.checked }))}
                  required
                />
                <span>I confirm that I am 18 years of age or older.</span>
              </label>
              <FieldError message={error} />
              <Button className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Already training with us?{" "}
              <Link to="/login" className="font-semibold text-[var(--primary)]">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
