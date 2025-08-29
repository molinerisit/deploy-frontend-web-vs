import { Link } from "react-router-dom";
import PlanCard from "../components/PlanCard";
import { money } from "../utils/format";

const PRICE_SINGLE = Number(import.meta.env.VITE_PRICE_SINGLE || 2999);
const PRICE_MULTI  = Number(import.meta.env.VITE_PRICE_MULTI  || 4499);

export default function Landing({ onStart }){
  return (
    <div>
      <section className="hero">
        <div className="container">
          <div className="badge" style={{marginBottom:14}}>Nuevo · Sincronización en la nube</div>
          <h1>Venta Simple: toda tu gestión comercial,<br/>simple y sincronizada</h1>
          <p>Factura, stock, clientes y reportes en un mismo lugar. Multi-dispositivo y listo para crecer. Add-ons: Bot de WhatsApp (atención automática) y Detección con Cámaras IA.</p>
          <div style={{display:'flex', gap:12, marginTop:18, flexWrap:'wrap'}}>
            <Link className="btn primary" to="/auth">Empezar gratis</Link>
            <a className="btn" href="#pricing">Ver precios</a>
          </div>
        </div>
      </section>

      <section id="features" style={{padding:'40px 0'}}>
        <div className="container grid cols-3">
          <div className="card" style={{padding:18}}>
            <h3>Gestión total</h3>
            <p className="small">Ventas, compras, stock, clientes, listas de precios y reportes claros.</p>
            <div className="hr"></div>
            <span className="kbd">POS</span> · <span className="kbd">Stock</span> · <span className="kbd">Reportes</span>
          </div>
          <div className="card" style={{padding:18}}>
            <h3>Sincronización en la nube</h3>
            <p className="small">Trabajá desde varias PCs y mantené los datos siempre al día.</p>
            <div className="hr"></div>
            <span className="kbd">Multi-dispositivo</span> · <span className="kbd">Backup</span>
          </div>
          <div className="card" style={{padding:18}}>
            <h3>Add-ons</h3>
            <p className="small">Sumá Bot de WhatsApp para consultas y pedidos, o detección con cámaras IA para conteo de personas/colas.</p>
            <div className="hr"></div>
            <span className="kbd">WhatsApp Bot</span> · <span className="kbd">Cámaras IA</span>
          </div>
        </div>
      </section>

      <section id="pricing" style={{padding:'10px 0 50px'}}>
        <div className="container">
          <h2 className="center" style={{marginBottom:18}}>Precios</h2>
          <div className="grid cols-3">
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
              onAction={() => onStart('single')}
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
              onAction={() => onStart('multi')}
            />
          </div>

          <div className="card" style={{padding:18, marginTop:18}}>
            <h3 style={{marginTop:0}}>Add-ons</h3>
            <ul className="list">
              <li><strong>Bot de WhatsApp</strong>: atención automática, pedidos y respuestas frecuentes. <em>No incluido</em> en Básico. <span className="badge">+ costo adicional</span></li>
              <li><strong>Detección con Cámaras IA</strong>: conteo de personas, alertas por cola, eventos. <span className="badge">+ costo adicional</span></li>
            </ul>
            <p className="small">¿Te interesan los add-ons? <a className="btn" href="mailto:ventas@ventasimple.app">Contactar ventas</a></p>
          </div>
        </div>
      </section>
    </div>
  );
}
