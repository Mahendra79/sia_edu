import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authService } from "../services/authService";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../utils/storage";

const AuthContext = createContext(null);

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

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { access, refresh, user: loggedInUser } = response.data;
    setStoredAuth({ access, refresh, user: loggedInUser });
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (payload) => {
    const response = await authService.signup(payload);
    const data = response.data || {};
    const { access, refresh, user: signedUpUser } = data;
    if (access && refresh && signedUpUser) {
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
