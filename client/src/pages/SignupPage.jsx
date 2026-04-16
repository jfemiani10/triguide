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
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
        <Card className="rounded-[32px]">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="pill mb-4">Sign Up</div>
              <h2 className="text-3xl font-semibold tracking-tight">Start building your race plan</h2>
              <p className="mt-3 text-[var(--muted)]">
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
              <FieldError message={error} />
              <Button className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <p className="mt-6 text-sm text-[var(--muted)]">
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
