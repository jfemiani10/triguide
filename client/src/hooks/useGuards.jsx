import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

function GuardFallback() {
  return <div className="min-h-[40vh] bg-[var(--bg)]" />;
}

export function AuthGate({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GuardFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function GuestGate({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) return <GuardFallback />;
  if (isAuthenticated) {
    return <Navigate to={isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  }

  return children;
}

export function OnboardingGate({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GuardFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return children;
}
