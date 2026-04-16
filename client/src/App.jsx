import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthGate, GuestGate, OnboardingGate } from "./hooks/useGuards";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import CoachPage from "./pages/CoachPage";
import ProfilePage from "./pages/ProfilePage";
import StravaPage from "./pages/StravaPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/signup"
            element={
              <GuestGate>
                <SignupPage />
              </GuestGate>
            }
          />
          <Route
            path="/login"
            element={
              <GuestGate>
                <LoginPage />
              </GuestGate>
            }
          />
          <Route
            path="/onboarding"
            element={
              <AuthGate>
                <OnboardingPage />
              </AuthGate>
            }
          />
          <Route
            path="/dashboard"
            element={
              <OnboardingGate>
                <DashboardPage />
              </OnboardingGate>
            }
          />
          <Route
            path="/coach"
            element={
              <OnboardingGate>
                <CoachPage />
              </OnboardingGate>
            }
          />
          <Route
            path="/profile"
            element={
              <OnboardingGate>
                <ProfilePage />
              </OnboardingGate>
            }
          />
          <Route
            path="/strava"
            element={
              <OnboardingGate>
                <StravaPage />
              </OnboardingGate>
            }
          />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
