// src/routes/Account.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLicense,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  changePaymentMethod,
} from "../api";
import Toast from "../components/Toast";

// --- helper: normaliza estados del backend a un set manejable ---
function normalizeStatus(raw) {
  const s = String(raw || "—").toLowerCase().trim();
  if (["canceled"].includes(s)) return "cancelled";
  if (["past-due", "past_due"].includes(s)) return "past_due";
  if (["trial", "trialing", "trial_period"].includes(s)) return "trial";
  if (["onhold", "on_hold"].includes(s)) return "on_hold";
  if (["expired"].includes(s)) return "expired";
  if (["paused"].includes(s)) return "paused";
  if (["active", "authorized"].includes(s)) return "active";
  return s || "—";
}

// util rgba desde hex
function toAlpha(hex, a) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export default function Account({ token, onLogout }) {
  const nav = useNavigate();

  // ✅ token efectivo (prop o localStorage)
  const effToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== "undefined") return localStorage.getItem("token");
    return null;
  }, [token]);

  const [lic, setLic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({ pause: false, resume: false, cancel: false, change: false });
  const [toast, setToast] = useState({ open: false, msg: "", type: "info" });

  useEffect(() => {
    if (!effToken) { nav("/auth"); return; }
    (async () => {
      try { setLic(await getLicense(effToken)); }
      finally { setLoading(false); }
    })();
  }, [effToken, nav]);

  async function doPause() {
    try {
      setBusy(b => ({ ...b, pause: true }));
      const r = await pauseSubscription(effToken);
      if (r?.ok) {
        setLic(await getLicense(effToken));
        setToast({ open: true, msg: "Suscripción en pausa.", type: "success" });
      } else {
        setToast({ open: true, msg: r?.error || "No se pudo pausar.", type: "error" });
      }
    } finally {
      setBusy(b => ({ ...b, pause: false }));
    }
  }

  async function doResume() {
    try {
      setBusy(b => ({ ...b, resume: true }));
      const r = await resumeSubscription(effToken);
      if (r?.ok) {
        setLic(await getLicense(effToken));
        setToast({ open: true, msg: "Suscripción reanudada.", type: "success" });
      } else {
        setToast({ open: true, msg: r?.error || "No se pudo reanudar.", type: "error" });
      }
    } finally {
      setBusy(b => ({ ...b, resume: false }));
    }
  }

  async function doCancel() {
    if (!confirm("¿Seguro que querés cancelar la suscripción?")) return;
    try {
      setBusy(b => ({ ...b, cancel: true }));
      const r = await cancelSubscription(effToken);
      if (r?.ok) {
        setLic(await getLicense(effToken));
        setToast({ open: true, msg: "Suscripción cancelada.", type: "success" });
      } else {
        setToast({ open: true, msg: r?.error || "No se pudo cancelar.", type: "error" });
      }
    } finally {
      setBusy(b => ({ ...b, cancel: false }));
    }
  }

  async function doChangeMethod() {
    const mpEmail = prompt("Email de tu cuenta de Mercado Pago (para re-vincular):", lic?.userEmail || "");
    if (!mpEmail) return;
    try {
      setBusy(b => ({ ...b, change: true }));
      const r = await changePaymentMethod(effToken, { mpEmail, plan: lic?.plan });
      if (r?.init_point) {
        window.location.href = r.init_point; // checkout de re-vinculación
      } else {
        setToast({ open: true, msg: r?.error || "No se pudo iniciar la re-vinculación.", type: "error" });
      }
    } finally {
      setBusy(b => ({ ...b, change: false }));
    }
  }

  const status = normalizeStatus(lic?.status);
  const next = lic?.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : "—";
  const devicesCount = Array.isArray(lic?.devices) ? lic.devices.length : 0;

  const isCancelled = status === "cancelled";

  return (
    <div style={{ maxWidth: 960, margin: "30px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Mi cuenta</h2>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Suscripción y facturación</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => nav("/dashboard")}>Volver al panel</button>
          <button className="btn danger" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="card" style={cardWrap}>
        <div style={cardHeader}>
          <h3 style={{ margin: 0 }}>Estado de suscripción</h3>
          {!loading && <StatusChip status={status} />}
        </div>

        {loading ? (
          <div className="muted">Cargando…</div>
        ) : (
          <>
            <div style={gridInfo}>
              <Info label="Estado" value={status.toUpperCase()} />
              <Info label="Plan" value={lic?.plan || "—"} />
              <Info label="Vence" value={next} />
              <Info label="Dispositivos" value={devicesCount} />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <button className="btn" onClick={doChangeMethod} disabled={busy.change}>
                {busy.change ? "Abriendo…" : "Cambiar medio de pago"}
              </button>

              {status === "paused" ? (
                <button className="btn primary" onClick={doResume} disabled={busy.resume}>
                  {busy.resume ? "Reanudando…" : "Reanudar"}
                </button>
              ) : (
                <button className="btn" onClick={doPause} disabled={busy.pause || isCancelled}>
                  {busy.pause ? "Pausando…" : "Pausar"}
                </button>
              )}

              <button className="btn danger" onClick={doCancel} disabled={busy.cancel || isCancelled}>
                {busy.cancel ? "Cancelando…" : "Cancelar"}
              </button>
            </div>

            <p style={{ marginTop: 12, fontSize: 13, color: "#9aa6bf" }}>
              <strong>Tip:</strong> si re-vinculás un nuevo medio de pago, cuando quede <em>authorized</em> el sistema migrará tu
              suscripción a la nueva y cancelará la anterior automáticamente.
            </p>
          </>
        )}
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

/* ---------- subcomponentes ---------- */
function Info({ label, value }) {
  return (
    <div style={infoBoxDark}>
      <div style={infoLabelDark}>{label}</div>
      <div style={infoValueDark}>{value}</div>
    </div>
  );
}

function StatusChip({ status }) {
  // paleta por estado (pensada para dark)
  const M = {
    active:    { base: "#10b981", text: "#10b981",  bgA: 0.14, label: "ACTIVA" },
    paused:    { base: "#94a3b8", text: "#cbd5e1",  bgA: 0.18, label: "EN PAUSA" },
    cancelled: { base: "#ef4444", text: "#fecaca",  bgA: 0.14, label: "CANCELADA" },
    pending:   { base: "#f59e0b", text: "#fde68a",  bgA: 0.16, label: "PENDIENTE" },
    past_due:  { base: "#f59e0b", text: "#fde68a",  bgA: 0.16, label: "PAGO ATRASADO" },
    trial:     { base: "#60a5fa", text: "#dbeafe",  bgA: 0.16, label: "PRUEBA" },
    expired:   { base: "#ef4444", text: "#fecaca",  bgA: 0.14, label: "VENCIDA" },
    on_hold:   { base: "#a78bfa", text: "#ede9fe",  bgA: 0.16, label: "EN REVISIÓN" },
    "—":       { base: "#9ca3af", text: "#cbd5e1",  bgA: 0.12, label: "SIN ESTADO" },
  };
  const k = M[status] ? status : "pending";
  const m = M[k];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: toAlpha(m.base, m.bgA),   // fondo teñido
        border: `1px solid ${toAlpha(m.base, 0.5)}`,
        color: m.text,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
      }}
    >
      {m.label}
    </span>
  );
}

/* ---------- estilos locales ---------- */
const cardWrap = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
};
const cardHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 };

const gridInfo = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 };

// versión dark de Info (evita blancos fuertes)
const infoBoxDark = { background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" };
const infoLabelDark = { fontSize: 12, color: "#93a4c1" };
const infoValueDark = { fontSize: 18, fontWeight: 800 };
