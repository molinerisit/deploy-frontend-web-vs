// components/licenseStatus.jsx
export default function LicenseStatus({ license, onDetach, deviceId }){
  if(!license) return <p className="small">No tenés licencia activa.</p>;
  const isActive = license.status === "active";
  return (
    <div className="card" style={{padding:18, borderColor:isActive?'rgba(34,197,94,.35)':'var(--border)'}}>
      <h3 style={{marginTop:0}}>Licencia {isActive ? 'Activa' : 'Pendiente'}</h3>
      <p><strong>Plan:</strong> {license.plan}</p>
      <p><strong>Expira:</strong> {new Date(license.expiresAt).toLocaleDateString()}</p>
      {license.token && <p><strong>Token:</strong> {license.token}</p>}
      <p><strong>Dispositivos:</strong> {(license.devices || []).length} {deviceId && (license.devices||[]).includes(deviceId) ? '(este dispositivo)' : ''}</p>
      {deviceId && (license.devices||[]).includes(deviceId) && <button className="btn danger" onClick={onDetach}>Quitar este dispositivo</button>}
    </div>
  );
}
