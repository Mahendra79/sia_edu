import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authService } from "../services/authService";
import { AUTH_EXPIRED_EVENT, ensureFreshAccessToken } from "../services/api";
import { clearAllCached } from "../utils/sessionCache";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../utils/storage";

const AuthContext = createContext(null);

// Comfortably under the 30-minute access token lifetime so the token is renewed
// even if the user is idle/passive (e.g. watching a video) for long stretches
// with no API traffic to trigger the reactive refresh in services/api.js.
const PROACTIVE_REFRESH_INTERVAL_MS = 20 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuth().user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const { access, user: storedUser } = getStoredAuth();
      if (!access || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        setUser(response.data);
        setStoredAuth({ access, refresh: getStoredAuth().refresh, user: response.data });
      } catch {
        clearStoredAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      ensureFreshAccessToken();
    }, PROACTIVE_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { access, refresh, user: loggedInUser } = response.data;
    clearAllCached();
    setStoredAuth({ access, refresh, user: loggedInUser });
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (payload) => {
    const response = await authService.signup(payload);
    const data = response.data || {};
    const { access, refresh, user: signedUpUser } = data;
    if (access && refresh && signedUpUser) {
      clearAllCached();
      setStoredAuth({ access, refresh, user: signedUpUser });
      setUser(signedUpUser);
    }
    return data;
  };

  const logout = async () => {
    const { refresh } = getStoredAuth();
    if (refresh) {
      try {
        await authService.logout({ refresh });
      } catch {
        // best effort
      }
    }
    clearStoredAuth();
    clearAllCached();
    setUser(null);
  };

  const refreshProfile = async () => {
    const response = await authService.getProfile();
    const { access, refresh } = getStoredAuth();
    setStoredAuth({ access, refresh, user: response.data });
    setUser(response.data);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_admin),
      login,
      signup,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
