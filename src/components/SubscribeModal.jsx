// src/components/SubscribeModal.jsx
import { useEffect, useState } from "react";

export default function SubscribeModal({ open, onClose, onConfirm, plan }) {
  const [mpEmail, setMpEmail] = useState(localStorage.getItem("mpEmail") || "");
  const [error, setError] = useState("");

  useEffect(() => { if (open) setError(""); }, [open]);

  function handleConfirm() {
    if (!/\S+@\S+\.\S+/.test(mpEmail)) {
      setError("Ingresá un email válido de Mercado Pago.");
      return;
    }
    localStorage.setItem("mpEmail", mpEmail);
    onConfirm(mpEmail);
  }

  if (!open) return null;

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-labelledby="sub-modal-title">
      <div style={modalStyle}>
        <h3 id="sub-modal-title" style={{marginTop:0}}>Confirmar suscripción</h3>
        <p style={{margin: "6px 0 10px"}}>
          <strong>Plan:</strong> {plan === "multi" ? "Multi-dispositivo" : "Single"}
        </p>
        <div style={noteStyle}>
          <strong>Importante:</strong> El <u>email de Mercado Pago debe coincidir</u> con el email que uses para iniciar sesión en Mercado Pago durante el pago. Si no coincide, el checkout puede fallar con “Algo salió mal”.
        </div>
        <label style={{display:"block", marginTop:12, fontWeight:600}}>
          Email de tu cuenta de Mercado Pago
        </label>
        <input
          type="email"
          value={mpEmail}
          onChange={(e)=>setMpEmail(e.target.value)}
          placeholder="tu-email@ejemplo.com"
          style={inputStyle}
          autoFocus
        />
        {error && <div style={errorStyle}>{error}</div>}

        <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:16}}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={handleConfirm}>Continuar al pago</button>
        </div>
      </div>
    </div>
  );
}

const backdropStyle = {
  position:"fixed", inset:0, background:"rgba(0,0,0,.35)",
  display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999
};
const modalStyle = {
  width:"min(520px, 92vw)", background:"#fff", borderRadius:12, padding:20,
  boxShadow:"0 10px 30px rgba(0,0,0,.2)"
};
const inputStyle = {
  width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:8, marginTop:6
};
const noteStyle = {
  background:"#fff8e1", border:"1px solid #ffe7a3", color:"#503d00",
  borderRadius:8, padding:"10px 12px"
};
const errorStyle = {
  color:"#b00020", marginTop:8, fontSize:14
};
