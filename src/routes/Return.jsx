import { useEffect } from "react";

export default function Return() {
  useEffect(() => {
    // Simulate redirect logic here, for example:
    // You can parse query params and redirect as needed
    const params = new URLSearchParams(window.location.search);
    // Example: redirect to home after 2 seconds
    setTimeout(() => {
      window.location.replace("/");
    }, 2000);
  }, []);

  return (
    <div className="card">
      <h2>Volviendo al panel…</h2>
      <p className="muted">Si no redirige automáticamente en unos segundos, hacé clic en el botón:</p>
      <p><a className="btn" href="/">Ir al panel</a></p>
      <p className="muted">URL de destino: <code>/</code></p>
    </div>
  );
}
