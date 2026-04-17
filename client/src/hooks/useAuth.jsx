import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { apiRequest, clearToken, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        setUser(null);
        setProfile(null);
        return;
      }

      try {
        const data = await apiRequest("/profile");
        setUser(data.user);
        setProfile(data.profile);
      } catch (error) {
        clearToken();
        setTokenState(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [token]);

  const value = {
    token,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(token),
    isOnboarded: Boolean(user?.onboarding_complete),
    login(payload) {
      flushSync(() => {
        setToken(payload.token);
        setTokenState(payload.token);
        setUser(payload.user);
        setProfile(payload.profile || null);
        setLoading(false);
      });
    },
    logout() {
      flushSync(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });
    },
    refreshProfile(nextUser, nextProfile) {
      if (nextUser) setUser(nextUser);
      if (nextProfile !== undefined) setProfile(nextProfile);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
