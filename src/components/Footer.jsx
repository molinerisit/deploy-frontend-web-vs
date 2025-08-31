// components/footer.jsx
export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>© {new Date().getFullYear()} <b>Venta Simple</b></div>
        <div className="muted small">Sync en la nube • Multi-dispositivo • Add-ons: WhatsApp Bot, Cámaras IA</div>
      </div>
    </footer>
  );
}
