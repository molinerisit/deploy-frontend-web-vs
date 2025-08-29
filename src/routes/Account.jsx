// src/routes/Account.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLicense, pauseSubscription, resumeSubscription, cancelSubscription, changePaymentMethod
} from "../api";
import Toast from "../components/Toast";

export default function Account({ token, onLogout }) {
  const nav = useNavigate();
  const [lic, setLic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open:false, msg:"", type:"info" });

  useEffect(() => {
    if (!token) { nav("/auth"); return; }
    (async () => {
      try { setLic(await getLicense(token)); } finally { setLoading(false); }
    })();
  }, [token, nav]);

  async function doPause() {
    const r = await pauseSubscription(token);
    if (r?.ok) { setLic(await getLicense(token)); setToast({ open:true, msg:"Suscripción en pausa.", type:"success" }); }
    else setToast({ open:true, msg:r?.error || "No se pudo pausar.", type:"error" });
  }
  async function doResume() {
    const r = await resumeSubscription(token);
    if (r?.ok) { setLic(await getLicense(token)); setToast({ open:true, msg:"Suscripción reanudada.", type:"success" }); }
    else setToast({ open:true, msg:r?.error || "No se pudo reanudar.", type:"error" });
  }
  async function doCancel() {
    if (!confirm("¿Seguro que querés cancelar la suscripción?")) return;
    const r = await cancelSubscription(token);
    if (r?.ok) { setLic(await getLicense(token)); setToast({ open:true, msg:"Suscripción cancelada.", type:"success" }); }
    else setToast({ open:true, msg:r?.error || "No se pudo cancelar.", type:"error" });
  }
  async function doChangeMethod() {
    const mpEmail = prompt("Email de tu cuenta de Mercado Pago (para re-vincular):", lic?.userEmail || "");
    if (!mpEmail) return;
    const r = await changePaymentMethod(token, { mpEmail, plan: lic?.plan });
    if (r?.init_point) {
      window.location.href = r.init_point; // redirigimos al checkout de re-vinculación
    } else {
      setToast({ open:true, msg:r?.error || "No se pudo iniciar la re-vinculación.", type:"error" });
    }
  }

  const status = lic?.status || "—";
  const next = lic?.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : "—";

  return (
    <div style={{maxWidth:960, margin:"30px auto", padding:"0 16px"}}>
      <header style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div>
          <h2 style={{margin:0}}>Mi cuenta</h2>
          <div style={{fontSize:13, color:"#6b7280"}}>Suscripción y facturación</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn" onClick={()=>nav("/dashboard")}>Volver al panel</button>
          <button className="btn danger" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="card">
        <h3 style={{marginTop:0}}>Estado de suscripción</h3>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12}}>
          <Info label="Estado" value={status.toUpperCase()} />
          <Info label="Plan" value={lic?.plan || "—"} />
          <Info label="Vence" value={next} />
          <Info label="Dispositivos" value={Array.isArray(lic?.devices) ? lic.devices.length : 0} />
        </div>

        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:14}}>
          <button className="btn" onClick={doChangeMethod}>Cambiar medio de pago</button>
          {status === "paused" ? (
            <button className="btn primary" onClick={doResume}>Reanudar</button>
          ) : (
            <button className="btn" onClick={doPause}>Pausar</button>
          )}
          <button className="btn danger" onClick={doCancel}>Cancelar</button>
        </div>

        <p style={{marginTop:12, fontSize:13, color:"#374151"}}>
          <strong>Tip:</strong> si re-vinculás un nuevo medio de pago, cuando quede <em>authorized</em> el sistema migrará tu suscripción a la nueva y cancelará la anterior automáticamente.
        </p>
      </div>

      <Toast open={toast.open} type={toast.type} message={toast.msg} onClose={()=>setToast({ ...toast, open:false })} />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 12px"}}>
      <div style={{fontSize:12, color:"#64748b"}}>{label}</div>
      <div style={{fontSize:18, fontWeight:700}}>{value}</div>
    </div>
  );
}
