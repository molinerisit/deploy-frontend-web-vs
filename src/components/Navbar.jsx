import { Link, useLocation } from "react-router-dom";

export default function Navbar({ token }){
  const { pathname } = useLocation();
  return (
    <div className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">VS</span>
          <span>Venta Simple</span>
        </Link>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <Link to="/#features" className="small">Funciones</Link>
          <Link to="/#pricing" className="small">Precios</Link>
          {token ? (
            <Link to="/app" className="btn">Ir al Panel</Link>
          ) : (
            <Link to="/auth" className="btn primary">Ingresar</Link>
          )}
        </div>
      </div>
    </div>
  );
}
