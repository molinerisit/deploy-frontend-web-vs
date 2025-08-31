// src/components/ui/StatCard.jsx
export default function StatCard({ label, value, hint, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {hint ? <span className="stat-hint">{hint}</span> : null}
      </div>
      <div className="stat-value">{value}</div>
      {trend ? <div className={`stat-trend ${trend.sign || ""}`}>{trend.text}</div> : null}
    </div>
  );
}
