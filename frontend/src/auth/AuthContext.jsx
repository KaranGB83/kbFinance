import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, LOGOUT_EVENT, tokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(tokens.hasSession());

  // Restore the session on first load.
  useEffect(() => {
    if (!tokens.hasSession()) return;
    api
      .get("/auth/me/")
      .then(setUser)
      .catch(() => tokens.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API client fires this when a token can no longer be refreshed.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, []);

  const startSession = useCallback((data) => {
    tokens.save(data);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (username, password) =>
      startSession(await api.post("/auth/login/", { username, password }, { auth: false })),
    [startSession]
  );

  const register = useCallback(
    async (form) => startSession(await api.post("/auth/register/", form, { auth: false })),
    [startSession]
  );

  const logout = useCallback(async () => {
    const refresh = tokens.refresh();
    tokens.clear();
    setUser(null);
    if (refresh) await api.post("/auth/logout/", { refresh }, { auth: false }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
