// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import DataAdmin from "./routes/DataAdmin";

import Auth from "./routes/Auth";
import Dashboard from "./routes/Dashboard";
import Account from "./routes/Account";
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

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />

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

      {/* Return desde MP */}
      <Route path="/return" element={<ReturnHandler token={token} />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* Datos & Retención */}
      <Route
        path="/data"
        element={
          <Protected token={token}>
            <DataAdmin token={token} />
          </Protected>
        }
      />
    </Routes>
  );
}
