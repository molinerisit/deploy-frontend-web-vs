import React from "react";
import { money } from "../utils/format";

export default function PlanCard({
  name,
  tag,
  price,
  features = [],
  cta = "Elegir",
  onAction = () => {},
  highlight = false,
  note,
}) {
  return (
    <div
      className="plan-card"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: highlight
          ? "linear-gradient(180deg, rgba(109,93,252,.15), rgba(81,198,255,.12))"
          : "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
        boxShadow: "var(--shadow)",
        padding: 18,
        position: "relative",
      }}
    >
      {tag && (
        <div className="chip" style={{ position: "absolute", top: 10, right: 10 }}>
          {tag}
        </div>
      )}

      <h3 className="mt-0 mb-0" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
        {name}
      </h3>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {price === 0 ? "Gratis" : money(price)}
          </div>
          {price !== 0 && (
            <div className="muted small" style={{ lineHeight: 1 }}>/ mes</div>
          )}
        </div>
      </div>

      {note && (
        <div className="small muted" style={{ marginTop: 6 }}>
          {note}
        </div>
      )}

      {/* Lista de features: emojis controlados con .emoji para que no desborden */}
      <ul
        className="plan-features"
        style={{
          margin: "12px 0 0",
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: 8,
        }}
      >
        {features.map((f, i) => (
          <li key={i} className="plan-feature">
            {/* Si el string contiene emoji, igual queda contenido por CSS global */}
            <span className="feature-text">{f}</span>
          </li>
        ))}
      </ul>

      <button
        className={`btn ${highlight ? "primary" : ""}`}
        style={{ width: "100%", marginTop: 12 }}
        onClick={onAction}
      >
        {cta}
      </button>
    </div>
  );
}
