export default function Footer(){
  return (
    <footer style={{borderTop:'1px solid var(--border)', marginTop:40}}>
      <div className="container" style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div className="small">© {new Date().getFullYear()} Venta Simple — Gestión Comercial</div>
        <div className="small">Sync en la nube · Multi-dispositivo · Add-ons: Bot de WhatsApp, Cámaras IA</div>
      </div>
    </footer>
  );
}
