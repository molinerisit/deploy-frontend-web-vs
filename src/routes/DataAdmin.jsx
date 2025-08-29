// src/routes/DataAdmin.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getBusinessProfile, updateBusinessProfile,
  getRetentionSettings, updateRetentionSettings, runCleanupNow,
  createDataExport, listDataExports, getExportStatus,
  listTables, getTableInfo, vacuumTable, truncateTable,
  getStatsSummary, getTopProducts, getCategoryLeaders, getSalesSeries,
  getLicense,
  aiRequestActivation, aiListCameras, aiCreateCamera, aiUpdateCamera, aiToggleCamera, aiTestCamera, aiDeleteCamera, aiListEvents
} from "../api";
import Toast from "../components/Toast";

// Charts (Recharts)
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Pie, PieChart, Cell, Legend,
  LineChart, Line
} from "recharts";

export default function DataAdmin({ token }) {
  const nav = useNavigate();
  const { hash } = useLocation();
  const [toast, setToast] = useState({ open:false, msg:"", type:"info" });

  // refs para anclas
  const refPerfil = useRef(null);
  const refRetencion = useRef(null);
  const refTablas = useRef(null);
  const refExport = useRef(null);
  const refStats = useRef(null);
  const refCams = useRef(null);

  // Licencia (para features)
  const [lic, setLic] = useState(null);

  // Negocio
  const [biz, setBiz] = useState({ name:"", cuit:"", address:"", phone:"" });
  const [bizLoading, setBizLoading] = useState(true);
  const [bizSaving, setBizSaving] = useState(false);

  // Retención
  const [ret, setRet] = useState({ days: 60, autoExportPdf: true, frequency: "weekly" });
  const [retLoading, setRetLoading] = useState(true);
  const [retSaving, setRetSaving] = useState(false);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyCleanup, setBusyCleanup] = useState(false);
  const [busyExportPdf, setBusyExportPdf] = useState(false);
  const [busyExportCsv, setBusyExportCsv] = useState(false);
  const daysMax = 60;

  // Tablas
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableInfo, setTableInfo] = useState(null);
  const [busyVacuum, setBusyVacuum] = useState(false);
  const [busyTruncate, setBusyTruncate] = useState(false);

  // Exportes
  const [exportsList, setExportsList] = useState([]);
  const [pollingId, setPollingId] = useState(null);
  const hasProcessing = exportsList.some(e => String(e.status).toLowerCase() === "processing");

  // Stats
  const [range, setRange] = useState(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 30*24*60*60*1000);
    return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
  });
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Serie temporal
  const [series, setSeries] = useState([]);
  const [bucket, setBucket] = useState("day"); // "day" | "week" | "month"
  const [seriesLoading, setSeriesLoading] = useState(true);

  // Cámaras IA
  const [camsInfo, setCamsInfo] = useState({ enabled:false, requested:false, items:[] });
  const [camsLoading, setCamsLoading] = useState(true);
  const [newCam, setNewCam] = useState({ name:"", rtspUrl:"" });
  const [busyAddCam, setBusyAddCam] = useState(false);
  const [busyActivation, setBusyActivation] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsFilter, setEventsFilter] = useState({ cameraId:"", type:"", limit:200 });

  // init
  useEffect(() => {
    if (!token) { nav("/auth"); return; }
    (async () => {
      try { setLic(await getLicense(token)); } catch {}
      try { setBiz(await getBusinessProfile(token)); } finally { setBizLoading(false); }
      try { setRet(await getRetentionSettings(token)); } finally { setRetLoading(false); }
      try { setTables(await listTables(token)); setExportsList(await listDataExports(token)); } catch {}
      try { setCamsInfo(await aiListCameras(token)); } finally { setCamsLoading(false); }
    })();
  }, [token, nav]);

  // hash scroll suave
  useEffect(() => {
    const map = {
      "#business": refPerfil,
      "#retention": refRetencion,
      "#tables": refTablas,
      "#exports": refExport,
      "#stats": refStats,
      "#ai": refCams,
      "#camaras": refCams,
    };
    if (hash && map[hash]?.current) {
      map[hash].current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  // tabla seleccionada
  useEffect(() => {
    if (!selectedTable) { setTableInfo(null); return; }
    (async () => {
      try { setTableInfo(await getTableInfo(token, selectedTable)); }
      catch { setTableInfo(null); }
    })();
  }, [token, selectedTable]);

  // stats
  useEffect(() => {
    (async () => {
      setStatsLoading(true);
      try {
        const s = await getStatsSummary(token, range);
        const t = await getTopProducts(token, { ...range, limit: 5 });
        const c = await getCategoryLeaders(token, range);
        setSummary(s); setTopProducts(t); setLeaders(c);
      } finally { setStatsLoading(false); }
    })();
  }, [token, range]);

  // serie
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSeriesLoading(true);
      try {
        const res = await getSalesSeries(token, { from: range.from, to: range.to, bucket });
        if (!cancelled) setSeries(res?.data || []);
      } catch {
        if (!cancelled) setSeries([]);
      } finally {
        if (!cancelled) setSeriesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, range, bucket]);

  // polling export
  useEffect(() => {
    if (!pollingId) return;
    const t = setInterval(async () => {
      try {
        const st = await getExportStatus(token, pollingId);
        if (st?.status === "ready" || st?.status === "error") {
          setExportsList(await listDataExports(token));
          setPollingId(null);
          setToast({ open:true, type: st.status === "ready" ? "success" : "error", msg: st.status === "ready" ? "Exportación lista." : "Falló la exportación." });
        }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [pollingId, token]);

  // acciones
  async function saveBiz() {
    try { setBizSaving(true);
      const r = await updateBusinessProfile(token, biz);
      setBiz(r);
      setToast({ open:true, type:"success", msg:"Datos del negocio guardados." });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo guardar." }); }
    finally { setBizSaving(false); }
  }

  async function saveRetention() {
    try { setRetSaving(true);
      const days = Math.min(daysMax, Math.max(1, Number(ret.days||30)));
      const r = await updateRetentionSettings(token, { ...ret, days });
      setRet(r);
      setToast({ open:true, type:"success", msg:"Política de retención actualizada." });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo actualizar." }); }
    finally { setRetSaving(false); }
  }

  async function previewCleanup() {
    try { setBusyPreview(true);
      const r = await runCleanupNow(token, { preview: true });
      const msg = `Se borrarían ${r?.DetalleVenta?.count || 0} DetalleVenta y ${r?.Venta?.count || 0} Venta (y relacionadas).`;
      setToast({ open:true, type:"info", msg });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo obtener el preview." }); }
    finally { setBusyPreview(false); }
  }
  async function runCleanup() {
    if (!confirm("¿Seguro? Se eliminarán definitivamente los datos fuera de retención.")) return;
    try { setBusyCleanup(true);
      const r = await runCleanupNow(token, { preview: false });
      setToast({ open:true, type:"success", msg:`Limpieza completa. Eliminados: ${r?.deleted || 0}` });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "Error durante la limpieza." }); }
    finally { setBusyCleanup(false); }
  }

  async function requestExport(format="pdf") {
    try {
      if (format === "pdf") setBusyExportPdf(true);
      if (format === "csv") setBusyExportCsv(true);
      const job = await createDataExport(token, { format, range: "olderThanRetention" });
      setExportsList(await listDataExports(token));
      setToast({ open:true, type:"success", msg:`Exportación ${format.toUpperCase()} encolada.` });
      setPollingId(job?.id || null);
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo crear la exportación." }); }
    finally {
      if (format === "pdf") setBusyExportPdf(false);
      if (format === "csv") setBusyExportCsv(false);
    }
  }

  // Cámaras IA helpers
  async function reloadCameras() {
    setCamsLoading(true);
    try { setCamsInfo(await aiListCameras(token)); }
    finally { setCamsLoading(false); }
  }
  async function doRequestActivation() {
    try { setBusyActivation(true);
      await aiRequestActivation(token);
      await reloadCameras();
      setToast({ open:true, type:"success", msg:"Solicitud enviada. Te contactaremos para activar el servicio." });
    } catch (e) { setToast({ open:true, type:"error", msg:e?.message || "No se pudo enviar la solicitud." }); }
    finally { setBusyActivation(false); }
  }
  async function addCamera() {
    try {
      setBusyAddCam(true);
      await aiCreateCamera(token, newCam);
      setNewCam({ name:"", rtspUrl:"" });
      await reloadCameras();
      setToast({ open:true, type:"success", msg:"Cámara creada." });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo crear la cámara." }); }
    finally { setBusyAddCam(false); }
  }
  async function toggleCamera(id) {
    try { await aiToggleCamera(token, id); await reloadCameras(); }
    catch { setToast({ open:true, type:"error", msg:"No se pudo cambiar el estado." }); }
  }
  async function testCamera(id) {
    try {
      const r = await aiTestCamera(token, id);
      setToast({ open:true, type: r?.ok ? "success" : "info", msg: r?.message || (r?.ok ? "OK" : "Prueba encolada") });
    } catch { setToast({ open:true, type:"error", msg:"No se pudo probar la cámara." }); }
  }
  async function deleteCamera(id) {
    if (!confirm("¿Eliminar cámara?")) return;
    try { await aiDeleteCamera(token, id); await reloadCameras(); }
    catch { setToast({ open:true, type:"error", msg:"No se pudo eliminar." }); }
  }
  async function loadEvents() {
    setEventsLoading(true);
    try { setEvents(await aiListEvents(token, { ...eventsFilter, limit: eventsFilter.limit })); }
    catch { setEvents([]); }
    finally { setEventsLoading(false); }
  }

  // colores para pie
  const PIE_COLORS = ["#60a5fa","#34d399","#fbbf24","#f472b6","#a78bfa","#f87171","#22d3ee","#c084fc","#fdba74","#93c5fd"];

  return (
    <div style={{maxWidth:1120, margin:"30px auto", padding:"0 16px"}}>
      <header style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <div>
          <h2 style={{margin:0}}>Datos & Retención</h2>
          <div style={{fontSize:13, color:"#6b7280"}}>Perfil del negocio, limpieza automática, exportaciones, estadísticas y Cámaras IA (beta)</div>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <button className="btn" onClick={()=>nav("/dashboard")}>Volver al panel</button>
        </div>
      </header>

      {/* Subnav sticky + estado de exportación */}
      <nav style={subnav}>
        <a href="#business" className="small">Perfil</a>
        <a href="#retention" className="small">Retención</a>
        <a href="#tables" className="small">Tablas</a>
        <a href="#exports" className="small">Exportes</a>
        <a href="#stats" className="small">Estadísticas</a>
        <a href="#ai" className="small">Cámaras IA</a>
        <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center"}}>
          {hasProcessing && <ProcessingPill />}
          <button className="btn" onClick={previewCleanup} disabled={busyPreview}>
            {busyPreview ? "Calculando…" : "Vista previa"}
          </button>
          <button className="btn danger" onClick={runCleanup} disabled={busyCleanup}>
            {busyCleanup ? "Limpiando…" : "Limpiar ahora"}
          </button>
          <button className="btn" onClick={()=>requestExport("pdf")} disabled={busyExportPdf}>
            {busyExportPdf ? "Encolando…" : "Exportar PDF"}
          </button>
          <button className="btn" onClick={()=>requestExport("csv")} disabled={busyExportCsv}>
            {busyExportCsv ? "Encolando…" : "Exportar CSV"}
          </button>
        </div>
      </nav>

      {/* Perfil */}
      <section ref={refPerfil} id="business" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Datos del negocio</h3>
        {bizLoading ? <div className="muted">Cargando…</div> : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10}}>
            <Field label="Nombre" value={biz.name} onChange={v=>setBiz({...biz, name:v})} />
            <Field label="CUIT" value={biz.cuit} onChange={v=>setBiz({...biz, cuit:v})} />
            <Field label="Dirección" value={biz.address} onChange={v=>setBiz({...biz, address:v})} />
            <Field label="Teléfono" value={biz.phone} onChange={v=>setBiz({...biz, phone:v})} />
          </div>
        )}
        <div style={{marginTop:12}}>
          <button className="btn primary" onClick={saveBiz} disabled={bizLoading || bizSaving}>
            {bizSaving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </section>

      {/* Retención */}
      <section ref={refRetencion} id="retention" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Retención de datos</h3>
        {retLoading ? <div className="muted">Cargando…</div> : (
          <>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10}}>
              <NumField label={`Días de retención (máx. ${daysMax})`} min={1} max={daysMax}
                        value={ret.days} onChange={v=>setRet({...ret, days: v})}/>
              <div>
                <label className="label">Frecuencia de limpieza</label>
                <select value={ret.frequency} onChange={e=>setRet({...ret, frequency:e.target.value})}>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <input id="autoexp" type="checkbox" checked={!!ret.autoExportPdf}
                       onChange={(e)=>setRet({...ret, autoExportPdf:e.target.checked})}/>
                <label htmlFor="autoexp">Generar PDF antes de borrar</label>
              </div>
            </div>
            <div style={{display:"flex", gap:8, marginTop:12, flexWrap:"wrap"}}>
              <button className="btn" onClick={saveRetention} disabled={retSaving}>
                {retSaving ? "Guardando…" : "Guardar política"}
              </button>
              <button className="btn" onClick={previewCleanup} disabled={busyPreview}>Vista previa</button>
              <button className="btn danger" onClick={runCleanup} disabled={busyCleanup}>Limpiar ahora</button>
              <button className="btn" onClick={()=>requestExport("pdf")} disabled={busyExportPdf}>
                {busyExportPdf ? "Encolando…" : "Exportar ahora (PDF)"}
              </button>
            </div>
            <p className="muted" style={{marginTop:10}}>
              Regla: no se permite más de {daysMax} días de permanencia; los registros más antiguos se eliminan.
            </p>
          </>
        )}
      </section>

      {/* Tablas */}
      <section ref={refTablas} id="tables" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Tablas</h3>
        {tables?.length ? (
          <>
            <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
              <select value={selectedTable} onChange={(e)=>setSelectedTable(e.target.value)}>
                <option value="">{`Seleccionar tabla…`}</option>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              {selectedTable && (
                <>
                  <button
                    className="btn"
                    onClick={async ()=>{
                      try { setBusyVacuum(true); await vacuumTable(token, selectedTable); setToast({open:true,type:"success",msg:"Optimización ejecutada."}); }
                      catch { setToast({open:true,type:"error",msg:"No se pudo optimizar."}); }
                      finally { setBusyVacuum(false); }
                    }}
                    disabled={busyVacuum}
                  >
                    {busyVacuum ? "Optimizando…" : "Optimizar tabla"}
                  </button>
                  <button
                    className="btn danger"
                    onClick={async ()=>{
                      if (!confirm("¿Vaciar tabla completa? Esta acción no se puede deshacer.")) return;
                      try { setBusyTruncate(true); await truncateTable(token, selectedTable); setToast({open:true,type:"success",msg:"Tabla vaciada."}); setSelectedTable(""); }
                      catch { setToast({open:true,type:"error",msg:"No se pudo vaciar."}); }
                      finally { setBusyTruncate(false); }
                    }}
                    disabled={busyTruncate}
                  >
                    {busyTruncate ? "Vaciando…" : "Vaciar tabla"}
                  </button>
                </>
              )}
            </div>
            {tableInfo ? (
              <div style={{marginTop:12, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10}}>
                <Info label="Filas" value={tableInfo.rows} />
                <Info label="Tamaño" value={tableInfo.sizeHuman || formatBytes(tableInfo.sizeBytes)} />
                <Info label="Último vaciado" value={tableInfo.lastVacuum || "—"} />
                <Info label="Último análisis" value={tableInfo.lastAnalyze || "—"} />
              </div>
            ) : selectedTable ? (
              <div className="muted" style={{marginTop:10}}>Cargando info…</div>
            ) : null}
          </>
        ) : (
          <div className="muted">No hay meta de tablas disponible.</div>
        )}
      </section>

      {/* Exportaciones */}
      <section ref={refExport} id="exports" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Exportaciones</h3>
        {exportsList?.length ? (
          <div className="table">
            <div className="thead">
              <div>Fecha</div><div>Formato</div><div>Estado</div><div>Archivo</div>
            </div>
            {exportsList.map((e)=>(
              <div className="tr" key={e.id}>
                <div>{new Date(e.createdAt).toLocaleString()}</div>
                <div>{(e.format || "pdf").toUpperCase()}</div>
                <div><StatusBadge status={e.status} /></div>
                <div>{e.status === "ready" ? <a className="btn" href={e.downloadUrl}>Descargar</a> : "—"}</div>
              </div>
            ))}
          </div>
        ) : <div className="muted">No hay exportaciones aún.</div>}
      </section>

      {/* Estadísticas con charts */}
      <section ref={refStats} id="stats" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Estadísticas</h3>
        <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
          <div>
            <label className="label">Desde</label>
            <input type="date" value={range.from} onChange={(e)=>setRange(r=>({...r, from:e.target.value}))}/>
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" value={range.to} onChange={(e)=>setRange(r=>({...r, to:e.target.value}))}/>
          </div>
        </div>

        {statsLoading ? (
          <div className="muted" style={{marginTop:10}}>Cargando…</div>
        ) : summary ? (
          <>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10, marginTop:12}}>
              <Info label="Ventas (monto)" value={formatMoney(summary.salesAmount)} />
              <Info label="Tickets" value={summary.salesCount} />
              <Info label="Promedio ticket" value={formatMoney(summary.avgTicket)} />
              <Info label="Productos vendidos" value={summary.itemsCount} />
            </div>

            {/* Selector de bucket */}
            <div style={{display:"flex", gap:10, alignItems:"center", marginTop:12}}>
              <label className="label">Agrupar por</label>
              <select value={bucket} onChange={(e)=>setBucket(e.target.value)}>
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>

            {/* Serie temporal */}
            <div className="card" style={{padding:12, marginTop:12}}>
              <b>Evolución de ventas ({bucket})</b>
              {seriesLoading ? (
                <div className="muted" style={{marginTop:8}}>Cargando…</div>
              ) : series?.length ? (
                <div style={{width:"100%", height:300}}>
                  <ResponsiveContainer>
                    <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ts" tickFormatter={(v)=> new Date(v).toLocaleDateString()} minTickGap={24} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RTooltip labelFormatter={(v)=> new Date(v).toLocaleString()} />
                      <Line yAxisId="left" type="monotone" dataKey="amount" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="tickets" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="muted" style={{marginTop:8}}>Sin datos para el rango/bucket.</div>
              )}
            </div>

            {/* Charts barras y pie */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:12, marginTop:12}}>
              <div className="card" style={{padding:12}}>
                <b>Top productos (unidades)</b>
                {topProducts?.length ? (
                  <div style={{width:"100%", height:260}}>
                    <ResponsiveContainer>
                      <BarChart data={topProducts} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="qty" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="muted" style={{marginTop:8}}>Sin datos en el rango.</div>}
              </div>

              <div className="card" style={{padding:12}}>
                <b>Participación por categoría</b>
                {leaders?.length ? (
                  <div style={{width:"100%", height:260}}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={leaders.map(l => ({ name: l.category, value: l.qty }))}
                             dataKey="value" nameKey="name" outerRadius={90} label>
                          {leaders.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend /><RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="muted" style={{marginTop:8}}>Sin datos en el rango.</div>}
              </div>
            </div>
          </>
        ) : (
          <div className="muted" style={{marginTop:10}}>Sin datos para el rango seleccionado.</div>
        )}
      </section>

      {/* Cámaras IA (beta) */}
      <section ref={refCams} id="ai" className="card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Cámaras IA (beta)</h3>

        {camsLoading ? (
          <div className="muted">Cargando…</div>
        ) : (
          <>
            {!camsInfo.enabled && (
              <div style={{background:"#fff7ed", border:"1px solid #fed7aa", padding:12, borderRadius:10, marginBottom:12}}>
                <b>Servicio no habilitado.</b> Podés solicitar la activación y te contactamos para configurarlo.
                <div style={{marginTop:10}}>
                  <button className="btn" onClick={doRequestActivation} disabled={busyActivation}>
                    {busyActivation ? "Enviando…" : camsInfo.requested ? "Solicitud enviada ✅" : "Solicitar activación"}
                  </button>
                </div>
              </div>
            )}

            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12}}>
              {/* Alta de cámara */}
              <div className="card" style={{padding:12}}>
                <b>Agregar cámara</b>
                <div style={{display:"grid", gap:8, marginTop:10}}>
                  <Field label="Nombre" value={newCam.name} onChange={v=>setNewCam(c=>({ ...c, name:v }))} />
                  <Field label="RTSP URL" value={newCam.rtspUrl} onChange={v=>setNewCam(c=>({ ...c, rtspUrl:v }))} />
                </div>
                <div style={{marginTop:10}}>
                  <button className="btn" onClick={addCamera} disabled={!camsInfo.enabled || busyAddCam || !newCam.name || !newCam.rtspUrl}>
                    {busyAddCam ? "Creando…" : "Crear"}
                  </button>
                </div>
                <p className="muted" style={{marginTop:8}}>Ej. rtsp://usuario:pass@ip:554/stream1</p>
              </div>

              {/* Listado */}
              <div className="card" style={{padding:12}}>
                <b>Mis cámaras</b>
                {camsInfo.items?.length ? (
                  <ul style={{marginTop:8, paddingLeft:18}}>
                    {camsInfo.items.map(cam => (
                      <li key={cam.id} style={{marginBottom:10}}>
                        <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                          <div>
                            <div style={{fontWeight:700}}>{cam.name}</div>
                            <div className="small" style={{maxWidth:420, overflow:"hidden", textOverflow:"ellipsis"}}>{cam.rtspUrl}</div>
                            <div className="small">Estado: <b>{cam.status}</b></div>
                          </div>
                          <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                            <button className="btn" onClick={()=>testCamera(cam.id)} disabled={!camsInfo.enabled}>Probar</button>
                            <button className="btn" onClick={()=>toggleCamera(cam.id)} disabled={!camsInfo.enabled}>
                              {cam.status === "active" ? "Desactivar" : "Activar"}
                            </button>
                            <button className="btn danger" onClick={()=>deleteCamera(cam.id)} disabled={!camsInfo.enabled}>Eliminar</button>
                            <button className="btn" onClick={()=>{ setEventsFilter(f=>({ ...f, cameraId: cam.id })); loadEvents(); }}>
                              Ver eventos
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="muted" style={{marginTop:8}}>No tenés cámaras cargadas.</div>}
              </div>

              {/* Eventos */}
              <div className="card" style={{padding:12}}>
                <b>Eventos recientes</b>
                <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginTop:8}}>
                  <div>
                    <label className="label">Cámara</label>
                    <select value={eventsFilter.cameraId} onChange={(e)=>setEventsFilter(f=>({ ...f, cameraId: e.target.value }))}>
                      <option value="">Todas</option>
                      {camsInfo.items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tipo</label>
                    <select value={eventsFilter.type} onChange={(e)=>setEventsFilter(f=>({ ...f, type: e.target.value }))}>
                      <option value="">Todos</option>
                      <option value="person">Persona</option>
                      <option value="queue">Cola</option>
                      <option value="motion">Movimiento</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Límite</label>
                    <input type="number" min={10} max={1000} value={eventsFilter.limit} onChange={(e)=>setEventsFilter(f=>({ ...f, limit: Number(e.target.value||200) }))}/>
                  </div>
                </div>
                <div style={{marginTop:8, display:"flex", gap:8}}>
                  <button className="btn" onClick={loadEvents} disabled={!camsInfo.enabled || eventsLoading}>
                    {eventsLoading ? "Cargando…" : "Actualizar"}
                  </button>
                </div>
                {eventsLoading ? (
                  <div className="muted" style={{marginTop:8}}>Cargando…</div>
                ) : events?.length ? (
                  <div className="table" style={{marginTop:10}}>
                    <div className="thead">
                      <div>Fecha</div><div>Cámara</div><div>Tipo</div><div>Conf.</div><div>Snapshot</div>
                    </div>
                    {events.map(ev => (
                      <div className="tr" key={ev.id}>
                        <div>{new Date(ev.occurredAt || ev.createdAt).toLocaleString()}</div>
                        <div>{camsInfo.items.find(c=>c.id===ev.cameraId)?.name || ev.cameraId}</div>
                        <div>{ev.type}</div>
                        <div>{ev.confidence ? `${(ev.confidence*100).toFixed(0)}%` : "—"}</div>
                        <div>{ev.snapshotUrl ? <a className="btn" href={ev.snapshotUrl} target="_blank">Ver</a> : "—"}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="muted" style={{marginTop:8}}>Sin eventos.</div>}
              </div>
            </div>
          </>
        )}
      </section>

      <Toast open={toast.open} type={toast.type} message={toast.msg} onClose={()=>setToast({ ...toast, open:false })} />
    </div>
  );
}

/* ---------- helpers UI ---------- */
function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value || ""} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}
function NumField({ label, min=0, max=999, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min={min} max={max} value={value ?? ""} onChange={(e)=>onChange(Number(e.target.value))} />
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

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    ready:   { bg:"#ecfdf5", bd:"#10b981", tx:"#065f46", label:"Listo" },
    processing: { bg:"#eff6ff", bd:"#3b82f6", tx:"#1e40af", label:"Procesando" },
    error:   { bg:"#fef2f2", bd:"#ef4444", tx:"#7f1d1d", label:"Error" },
    default: { bg:"#f3f4f6", bd:"#9ca3af", tx:"#374151", label:s || "—" },
  };
  const m = map[s] || map.default;
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:999,
      background:m.bg, border:`1px solid ${m.bd}`, color:m.tx, fontSize:12, fontWeight:600
    }}>
      {m.label}
    </span>
  );
}
function ProcessingPill(){
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px",
      borderRadius:999, background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1e3a8a", fontSize:12, fontWeight:600
    }}>
      <span className="spinner" style={{
        width:10, height:10, border:"2px solid #93c5fd", borderTopColor:"transparent",
        borderRadius:"50%", display:"inline-block", animation:"spin .8s linear infinite"
      }}/>
      Exportando…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
function formatMoney(v){
  try { return new Intl.NumberFormat('es-AR', { style:'currency', currency: (import.meta.env.VITE_CURRENCY || 'ARS') }).format(Number(v||0)); }
  catch { return `$${v}`; }
}
function formatBytes(b) {
  const n = Number(b||0);
  if (n < 1024) return `${n} B`;
  const u = ["KB","MB","GB","TB"];
  let i = -1, size = n;
  do { size /= 1024; i++; } while (size >= 1024 && i < u.length-1);
  return `${size.toFixed(1)} ${u[i]}`;
}

/* ---------- estilos locales ---------- */
const subnav = {
  position:"sticky",
  top:8,
  zIndex:5,
  display:"flex",
  gap:12,
  alignItems:"center",
  background:"rgba(255,255,255,.6)",
  WebkitBackdropFilter:"saturate(180%) blur(8px)",
  backdropFilter:"saturate(180%) blur(8px)",
  border:"1px solid #e5e7eb",
  borderRadius:10,
  padding:"8px 10px",
  marginBottom:12,
};
