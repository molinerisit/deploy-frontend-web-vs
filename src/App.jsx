// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import DataAdmin from "./routes/DataAdmin";
import Auth from "./routes/Auth";
import Dashboard from "./routes/Dashboard";
import Account from "./routes/Account";
import Landing from "./routes/Landing"; // 👈 importa tu landing
import { refreshLicense } from "./api";

// Ruta protegida
function Protected({ token, children }) {
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

// Vuelta desde Mercado Pago: refresca licencia y redirige a dashboard
function ReturnHandler({ token }) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  useEffect(() => {
    (async () => {
      try {
        if (token) await refreshLicense(token);
      } finally {
        const q = params.toString();
        nav(`/dashboard${q ? `?${q}` : ""}`, { replace: true });
      }
    })();
  }, [token, nav, params]);
  return null;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Mantener sincronizado si cambia localStorage (otra pestaña, etc.)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleLogin(newToken) {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    }
  }
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <Routes>
      {/* Home: si hay token → dashboard, si no → Landing */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Landing
              onStart={(plan) => {
                // si viene plan desde la landing, lo pasamos por query
                const q = plan ? `?plan=${encodeURIComponent(plan)}` : "";
                return window.location.assign(`/auth${q}`);
              }}
            />
          )
        }
      />

      {/* Auth */}
      <Route path="/auth" element={<Auth onLogin={handleLogin} />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <Protected token={token}>
            <Dashboard token={token} onLogout={handleLogout} />
          </Protected>
        }
      />

      {/* Cuenta */}
      <Route
        path="/account"
        element={
          <Protected token={token}>
            <Account token={token} onLogout={handleLogout} />
          </Protected>
        }
      />

      {/* Datos & Retención */}
      <Route
        path="/data"
        element={
          <Protected token={token}>
            <DataAdmin token={token} />
          </Protected>
        }
      />

      {/* Return desde MP */}
      <Route path="/return" element={<ReturnHandler token={token} />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
