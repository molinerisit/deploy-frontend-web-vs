import { useState } from "react";

export default function RegisterForm({ onSubmit = () => {}, loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
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
