import { Link } from "react-router-dom";
import PlanCard from "../components/PlanCard";
import { money } from "../utils/format";

const PRICE_SINGLE = Number(import.meta.env.VITE_PRICE_SINGLE || 2999);
const PRICE_MULTI  = Number(import.meta.env.VITE_PRICE_MULTI  || 4499);

export default function Landing({ onStart }) {
  return (
    <div>

      {/* ===== Top Nav ===== */}
      <header className="site-nav">
        <div className="container nav-inner">
          <div className="logo">
            <div className="logo-mark">VS</div>
            <div className="logo-text">Venta Simple</div>
          </div>
          <nav className="nav-links">
            <a href="#features" className="muted">Características</a>
            <a href="#pricing" className="muted">Precios</a>
            <Link className="btn btn-sm ghost" to="/auth">Iniciar sesión</Link>
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-left">
            <span className="chip">Nuevo · Sincronización en la nube</span>
            <h1 className="hero-title">
              Gestión comercial <span className="grad">simple</span> y <span className="grad-2">sincronizada</span>
            </h1>
            <p className="hero-sub">
              Facturación, stock, clientes y reportes en un solo lugar.
              Trabajá en varias PCs, con respaldo automático y add-ons potentes:
              Bot de WhatsApp y Detección con Cámaras IA.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-lg primary" to="/auth">Empezar gratis</Link>
              <a className="btn btn-lg ghost" href="#pricing">Ver precios</a>
            </div>
            <div className="hero-trust muted">
              Sin instalación complicada · Probalo en minutos
            </div>
          </div>

          <div className="hero-right card">
            {/* Mockup simple / highlights */}
            <div className="mock">
              <div className="mock-row">
                <div className="mock-pill" />
                <div className="mock-pill" />
                <div className="mock-pill long" />
              </div>
              <div className="mock-kpis">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">Ventas (30d)</span>
                    <span className="stat-hint">+12%</span>
                  </div>
                  <div className="stat-value">$ 1,245,000</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">Tickets</span>
                    <span className="stat-hint">+6%</span>
                  </div>
                  <div className="stat-value">832</div>
                </div>
              </div>
              <div className="mock-table">
                <div className="thead">
                  <div>Fecha</div><div>Cliente</div><div>Total</div><div>Estado</div>
                </div>
                {[1,2,3,4].map(i=>(
                  <div className="tr" key={i}>
                    <div>12/0{i}</div><div>Consumidor Final</div><div>$ {i}2.300</div><div>OK</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">Todo lo que necesitás</h2>
          <p className="section-sub muted">
            Operativa ágil, datos seguros y reportes claros para decidir mejor.
          </p>

          <div className="grid features-grid">
            <Feature
              icon="🧾"
              title="Gestión total"
              desc="Ventas, compras, stock, clientes, listas y reportes accionables."
              chips={["POS","Stock","Reportes"]}
            />
            <Feature
              icon="☁️"
              title="Sincronización en la nube"
              desc="Trabajá desde varias PCs y mantené todo al día, con backup."
              chips={["Multi-dispositivo","Backup"]}
            />
            <Feature
              icon="⚙️"
              title="Add-ons"
              desc="Sumá Bot de WhatsApp o Cámaras IA para automatizar y detectar colas."
              chips={["WhatsApp Bot","Cámaras IA"]}
            />
            <Feature
              icon="📈"
              title="KPIs y análisis"
              desc="Series, comparativas y mapa de calor por día/hora para vender más."
              chips={["KPIs","Heatmap","Top productos"]}
            />
            <Feature
              icon="🔐"
              title="Licenciamiento claro"
              desc="Planes simples, control de dispositivos y uso offline temporal."
              chips={["1-3 dispositivos","Offline 72h"]}
            />
            <Feature
              icon="🧰"
              title="Datos & Retención"
              desc="Limpieza automática, exportes PDF/CSV y optimización de tablas."
              chips={["Exportes","Retención","Vacuum"]}
            />
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section-title">Precios</h2>
          <p className="section-sub muted">Elegí el plan que mejor se adapta a tu negocio.</p>

          <div className="pricing-grid">
            <PlanCard
              name="Gratis"
              tag="Empieza hoy"
              price={0}
              features={[
                "Funciones básicas",
                "1 dispositivo",
                "Sin sincronización"
              ]}
              cta="Crear cuenta"
              onAction={onStart}
            />
            <PlanCard
              name="Básico"
              tag="Recomendado"
              price={PRICE_SINGLE}
              features={[
                "Funciones premium",
                "1 dispositivo",
                "Sincronización en la nube"
              ]}
              cta={`Suscribirse ${money(PRICE_SINGLE)}`}
              onAction={() => onStart("single")}
              highlight
            />
            <PlanCard
              name="Multi-dispositivo"
              price={PRICE_MULTI}
              features={[
                "Funciones premium",
                "Hasta 3 dispositivos",
                "Sincronización en la nube"
              ]}
              cta={`Suscribirse ${money(PRICE_MULTI)}`}
              onAction={() => onStart("multi")}
            />
          </div>

          <div className="card addons">
            <h3 className="mt-0">Add-ons</h3>
            <ul className="list">
              <li>
                <strong>Bot de WhatsApp:</strong> atención automática, pedidos y FAQs.
                <em> No incluido</em> en Básico. <span className="badge">+ costo adicional</span>
              </li>
              <li>
                <strong>Detección con Cámaras IA:</strong> conteo de personas, alertas por cola, eventos.
                <span className="badge"> + costo adicional</span>
              </li>
            </ul>
            <p className="small">
              ¿Te interesan los add-ons?{" "}
              <a className="btn btn-sm" href="mailto:ventas@ventasimple.app">Contactar ventas</a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="muted small">© {new Date().getFullYear()} Venta Simple</div>
          <div className="nav-links">
            <a href="#features" className="small muted">Características</a>
            <a href="#pricing" className="small muted">Precios</a>
            <Link to="/auth" className="small">Ingresar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc, chips=[] }) {
  return (
    <div className="card feature-card">
      <div className="feature-head">
        <div className="feature-ico">{icon}</div>
        <h3 className="mt-0">{title}</h3>
      </div>
      <p className="small muted">{desc}</p>
      <div className="hr"></div>
      <div className="chips">
        {chips.map((c)=> <span className="kbd" key={c}>{c}</span>)}
      </div>
    </div>
  );
}
