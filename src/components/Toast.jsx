// src/components/Toast.jsx
import { useEffect } from "react";

export default function Toast({ open, message, type="info", onClose, autoHideMs=2200 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [open, onClose, autoHideMs]);

  if (!open) return null;

  const styles = {
    base: {
      position:"fixed", right:16, bottom:16, zIndex:9999,
      padding:"12px 14px", borderRadius:10, color:"#0b253a", border:"1px solid #cce3ff",
      background:"#e6f4ff", boxShadow:"0 6px 22px rgba(0,0,0,.12)", maxWidth:360
    },
    error: { background:"#fdecea", border:"1px solid #f5c6cb", color:"#611a15" },
    success: { background:"#ecfdf5", border:"1px solid #a7f3d0", color:"#064e3b" },
    warn: { background:"#fff8e1", border:"1px solid #ffe7a3", color:"#6b4b00" },
  };
  const style = {
    ...styles.base,
    ...(type === "error" ? styles.error : type === "success" ? styles.success : type === "warn" ? styles.warn : {})
  };

  return (
    <div style={style} role="alert">
      {message}
    </div>
  );
}
