// src/routes/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function LoginFormInline({ onSubmit = () => {}, loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ email, password });
      }}
    >
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="field">
        <label>Contraseña</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

function RegisterFormInline({ onSubmit = () => {}, loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ email, password });
      }}
    >
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="field">
        <label>Contraseña</label>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const goDashboard = () => navigate("/dashboard");

  const handleLogin = async ({ email, password }) => {
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al iniciar sesión");
      localStorage.setItem("token", data.token);
      goDashboard();
    } catch (e) {
      setErrorMsg(e.message || "Error de login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ email, password }) => {
    setErrorMsg("");
    setLoading(true);
    try {
      // 1) Registrar
      const r1 = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1?.error || "No se pudo registrar");

      // 2) Auto-login
      const r2 = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2?.error || "Error al iniciar sesión");
      localStorage.setItem("token", d2.token);
      goDashboard();
    } catch (e) {
      setErrorMsg(e.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card">
        <h1 style={{ marginBottom: 8 }}>
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        {errorMsg ? (
          <div
            style={{
              background: "#fecaca",
              color: "#7f1d1d",
              padding: "8px 12px",
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {mode === "login" ? (
          <LoginFormInline onSubmit={handleLogin} loading={loading} />
        ) : (
          <RegisterFormInline onSubmit={handleRegister} loading={loading} />
        )}

        <div style={{ marginTop: 12, fontSize: 14 }}>
          {mode === "login" ? (
            <>
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                disabled={loading}
                style={{
                  textDecoration: "underline",
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                disabled={loading}
                style={{
                  textDecoration: "underline",
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
