import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { setAuthToken } from "./api";

const AuthContext = createContext(null);

const LS_KEY = "dpi_movie_booking_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = auth?.token || null;
    setAuthToken(token);
    try {
      if (auth) localStorage.setItem(LS_KEY, JSON.stringify(auth));
      else localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
  }, [auth]);

  const value = useMemo(
    () => ({
      auth,
      isAuthed: Boolean(auth?.token),
      user: auth?.user || null,
      login: (payload) => setAuth(payload),
      logout: () => setAuth(null),
    }),
    [auth]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

