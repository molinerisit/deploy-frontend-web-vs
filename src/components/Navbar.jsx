// Components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ token }){
  const { pathname } = useLocation();
  return (
    <div className="site-nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">VS</span>
          <span className="logo-text">Venta Simple</span>
        </Link>
        <div className="nav-links">
          <a href="/#features" className="small">Funciones</a>
          <a href="/#pricing" className="small">Precios</a>
          {token ? (
            <Link to="/dashboard" className="btn primary">Ir al Panel</Link>
          ) : (
            <Link to="/auth" className="btn primary">Ingresar</Link>
          )}
        </div>
      </div>
    </div>
  );
}
