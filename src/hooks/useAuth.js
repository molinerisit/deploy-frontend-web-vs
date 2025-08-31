// hooks/useAuth.js
import { useState, useCallback } from "react";
import { api } from "../api";

export function useAuth(){
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => (token ? JSON.parse(localStorage.getItem("user") || "null") : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (email, password) => {
    setError(""); setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token); setUser(res.user);
      return true;
    } catch(e){ setError(e.message); return false; }
    finally{ setLoading(false); }
  }, []);

  const register = useCallback(async (email, password) => {
    setError(""); setLoading(true);
    try { await api.register(email, password); return true; }
    catch(e){ setError(e.message); return false; }
    finally{ setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null); setUser(null);
  }, []);

  return { token, user, login, register, logout, loading, error };
}
