// src/components/ui/AppShell.jsx
import { Link, NavLink } from "react-router-dom";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <aside className="aside">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark">VS</span>
          <span className="brand-text">Venta Simple</span>
        </Link>

        <nav className="nav-group">
          <NavItem to="/dashboard" label="Panel" icon="📊" />
          <NavItem to="/data#stats" label="Estadísticas" icon="📈" />
          <NavItem to="/data" label="Datos & Retención" icon="🗄️" />
          <NavItem to="/account" label="Mi cuenta" icon="👤" />
        </nav>

        <div className="aside-footer">
          <a href="mailto:soporte@ventasimple.app" className="muted small">Soporte</a>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-dot" />
            <span className="topbar-title">Panel de gestión</span>
          </div>
          <div className="topbar-right">
            <Link to="/account" className="btn ghost">Cuenta</Link>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "nav-item" + (isActive ? " active" : "")
      }
    >
      <span className="nav-ico" aria-hidden>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
