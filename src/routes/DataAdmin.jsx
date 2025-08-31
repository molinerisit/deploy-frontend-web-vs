// src/routes/DataAdmin.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getBusinessProfile, updateBusinessProfile,
  getRetentionSettings, updateRetentionSettings, runCleanupNow,
  createDataExport, listDataExports, getExportStatus,
  listTables, getTableInfo, vacuumTable, truncateTable,
  getStatsSummary, getTopProducts, getCategoryLeaders, getSalesSeries,
  getStatsCompare, getSalesHeatmap,
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

  // ✅ token efectivo robusto
  const effToken = useMemo(() => token || (typeof window !== "undefined" ? localStorage.getItem("token") : null), [token]);

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

  // Comparativa & heatmap
  const [compare, setCompare] = useState(null);
  const [heat, setHeat] = useState([]);

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
    if (!effToken) { nav("/auth"); return; }
    (async () => {
      try { setLic(await getLicense(effToken)); } catch {}
      try { setBiz(await getBusinessProfile(effToken)); } finally { setBizLoading(false); }
      try { setRet(await getRetentionSettings(effToken)); } finally { setRetLoading(false); }
      try {
        setTables(await listTables(effToken));
        setExportsList(await listDataExports(effToken));
      } catch {}
      try { setCamsInfo(await aiListCameras(effToken)); } finally { setCamsLoading(false); }
    })();
  }, [effToken, nav]);

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
      try { setTableInfo(await getTableInfo(effToken, selectedTable)); }
      catch { setTableInfo(null); }
    })();
  }, [effToken, selectedTable]);

  // stats (KPIs + top + categorias + comparativa + heatmap)
  useEffect(() => {
    (async () => {
      setStatsLoading(true);
      try {
        const s = await getStatsSummary(effToken, range);
        const t = await getTopProducts(effToken, { ...range, limit: 5 });
        const c = await getCategoryLeaders(effToken, range);
        setSummary(s); setTopProducts(t); setLeaders(c);
      } finally { setStatsLoading(false); }
    })();

    (async () => {
      try {
        const cmp = await getStatsCompare(effToken, range);
        setCompare(cmp);
      } catch { setCompare(null); }
    })();

    (async () => {
      try {
        const hm = await getSalesHeatmap(effToken, range);
        setHeat(Array.isArray(hm?.data) ? hm.data : []);
      } catch { setHeat([]); }
    })();
  }, [effToken, range]);

  // serie
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSeriesLoading(true);
      try {
        const res = await getSalesSeries(effToken, { from: range.from, to: range.to, bucket });
        if (!cancelled) setSeries(res?.data || []);
      } catch {
        if (!cancelled) setSeries([]);
      } finally {
        if (!cancelled) setSeriesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effToken, range, bucket]);

  // polling export
  useEffect(() => {
    if (!pollingId) return;
    const t = setInterval(async () => {
      try {
        const st = await getExportStatus(effToken, pollingId);
        if (st?.status === "ready" || st?.status === "error") {
          setExportsList(await listDataExports(effToken));
          setPollingId(null);
          setToast({
            open:true,
            type: st.status === "ready" ? "success" : "error",
            msg: st.status === "ready" ? "Exportación lista." : "Falló la exportación."
          });
        }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [pollingId, effToken]);

  // acciones
  async function saveBiz() {
    try {
      setBizSaving(true);
      const r = await updateBusinessProfile(effToken, biz);
      setBiz(r);
      setToast({ open:true, type:"success", msg:"Datos del negocio guardados." });
    } catch (e) {
      setToast({ open:true, type:"error", msg: e?.message || "No se pudo guardar." });
    } finally { setBizSaving(false); }
  }

  async function saveRetention() {
    try {
      setRetSaving(true);
      const days = Math.min(daysMax, Math.max(1, Number(ret.days||30)));
      const r = await updateRetentionSettings(effToken, { ...ret, days });
      setRet(r);
      setToast({ open:true, type:"success", msg:"Política de retención actualizada." });
    } catch (e) {
      setToast({ open:true, type:"error", msg: e?.message || "No se pudo actualizar." });
    } finally { setRetSaving(false); }
  }

  async function previewCleanup() {
    try { setBusyPreview(true);
      const r = await runCleanupNow(effToken, { preview: true });
      const msg = `Se borrarían ${r?.DetalleVenta?.count || 0} DetalleVenta y ${r?.Venta?.count || 0} Venta (y relacionadas).`;
      setToast({ open:true, type:"info", msg });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo obtener el preview." }); }
    finally { setBusyPreview(false); }
  }
  async function runCleanup() {
    if (!confirm("¿Seguro? Se eliminarán definitivamente los datos fuera de retención.")) return;
    try { setBusyCleanup(true);
      const r = await runCleanupNow(effToken, { preview: false });
      setToast({ open:true, type:"success", msg:`Limpieza completa. Eliminados: ${r?.deleted || 0}` });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "Error durante la limpieza." }); }
    finally { setBusyCleanup(false); }
  }

  async function requestExport(format="pdf") {
    try {
      if (format === "pdf") setBusyExportPdf(true);
      if (format === "csv") setBusyExportCsv(true);
      const job = await createDataExport(effToken, { format, range: "olderThanRetention" });
      setExportsList(await listDataExports(effToken));
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
    try { setCamsInfo(await aiListCameras(effToken)); }
    finally { setCamsLoading(false); }
  }
  async function doRequestActivation() {
    try { setBusyActivation(true);
      await aiRequestActivation(effToken);
      await reloadCameras();
      setToast({ open:true, type:"success", msg:"Solicitud enviada. Te contactaremos para activar el servicio." });
    } catch (e) { setToast({ open:true, type:"error", msg:e?.message || "No se pudo enviar la solicitud." }); }
    finally { setBusyActivation(false); }
  }
  async function addCamera() {
    try {
      setBusyAddCam(true);
      await aiCreateCamera(effToken, newCam);
      setNewCam({ name:"", rtspUrl:"" });
      await reloadCameras();
      setToast({ open:true, type:"success", msg:"Cámara creada." });
    } catch (e) { setToast({ open:true, type:"error", msg: e?.message || "No se pudo crear la cámara." }); }
    finally { setBusyAddCam(false); }
  }
  async function toggleCamera(id) {
    try { await aiToggleCamera(effToken, id); await reloadCameras(); }
    catch { setToast({ open:true, type:"error", msg:"No se pudo cambiar el estado." }); }
  }
  async function testCamera(id) {
    try {
      const r = await aiTestCamera(effToken, id);
      setToast({ open:true, type: r?.ok ? "success" : "info", msg: r?.message || (r?.ok ? "OK" : "Prueba encolada") });
    } catch { setToast({ open:true, type:"error", msg:"No se pudo probar la cámara." }); }
  }
  async function deleteCamera(id) {
    if (!confirm("¿Eliminar cámara?")) return;
    try { await aiDeleteCamera(effToken, id); await reloadCameras(); }
    catch { setToast({ open:true, type:"error", msg:"No se pudo eliminar." }); }
  }
  async function loadEvents() {
    setEventsLoading(true);
    try { setEvents(await aiListEvents(effToken, { ...eventsFilter, limit: eventsFilter.limit })); }
    catch { setEvents([]); }
    finally { setEventsLoading(false); }
  }

  // colores para pie
  const PIE_COLORS = ["#60a5fa","#34d399","#fbbf24","#f472b6","#a78bfa","#f87171","#22d3ee","#c084fc","#fdba74","#93c5fd"];

  return (
    <div style={pageWrap}>
      <header style={headerWrap}>
        <div>
          <h2 style={{margin:0, color:"#e5e7eb"}}>Datos & Retención</h2>
          <div style={{fontSize:13, color:"#94a3b8"}}>Perfil del negocio, limpieza automática, exportes, estadísticas y Cámaras IA (beta)</div>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <button className="btn" onClick={()=>nav("/dashboard")}>Volver al panel</button>
        </div>
      </header>

      {/* Subnav sticky + estado de exportación */}
      <nav style={subnavDark}>
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
      <section ref={refPerfil} id="business" style={cardDark}>
        <h3 style={h3Dark}>Datos del negocio</h3>
        {bizLoading ? <div className="muted">Cargando…</div> : (
          <div style={gridAuto}>
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
      <section ref={refRetencion} id="retention" style={cardDark}>
        <h3 style={h3Dark}>Retención de datos</h3>
        {retLoading ? <div className="muted">Cargando…</div> : (
          <>
            <div style={gridAuto}>
              <NumField label={`Días de retención (máx. ${daysMax})`} min={1} max={daysMax}
                        value={ret.days} onChange={v=>setRet({...ret, days: v})}/>
              <div>
                <label className="label" style={labelDark}>Frecuencia de limpieza</label>
                <select value={ret.frequency} onChange={e=>setRet({...ret, frequency:e.target.value})} style={inputDark}>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <input id="autoexp" type="checkbox" checked={!!ret.autoExportPdf}
                       onChange={(e)=>setRet({...ret, autoExportPdf:e.target.checked})}/>
                <label htmlFor="autoexp" className="label" style={labelDark}>Generar PDF antes de borrar</label>
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
      <section ref={refTablas} id="tables" style={cardDark}>
        <h3 style={h3Dark}>Tablas</h3>
        {tables?.length ? (
          <>
            <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
              <select value={selectedTable} onChange={(e)=>setSelectedTable(e.target.value)} style={inputDark}>
                <option value="">{`Seleccionar tabla…`}</option>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              {selectedTable && (
                <>
                  <button
                    className="btn"
                    onClick={async ()=>{
                      try { setBusyVacuum(true); await vacuumTable(effToken, selectedTable); setToast({open:true,type:"success",msg:"Optimización ejecutada."}); }
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
                      try { setBusyTruncate(true); await truncateTable(effToken, selectedTable); setToast({open:true,type:"success",msg:"Tabla vaciada."}); setSelectedTable(""); }
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
              <div style={gridAuto}>
                <InfoDark label="Filas" value={tableInfo.rows} />
                <InfoDark label="Tamaño" value={tableInfo.sizeHuman || formatBytes(tableInfo.sizeBytes)} />
                <InfoDark label="Último vaciado" value={tableInfo.lastVacuum || "—"} />
                <InfoDark label="Último análisis" value={tableInfo.lastAnalyze || "—"} />
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
      <section ref={refExport} id="exports" style={cardDark}>
        <h3 style={h3Dark}>Exportaciones</h3>
        {exportsList?.length ? (
          <div style={tableWrapDark}>
            <div style={theadDark}>
              <div>Fecha</div><div>Formato</div><div>Estado</div><div>Archivo</div>
            </div>
            {exportsList.map((e)=>(
              <div style={trDark} key={e.id}>
                <div>{new Date(e.createdAt).toLocaleString()}</div>
                <div>{(e.format || "pdf").toUpperCase()}</div>
                <div><StatusBadge status={e.status} /></div>
                <div>{e.status === "ready" ? <a className="btn" href={e.downloadUrl} target="_blank" rel="noreferrer">Descargar</a> : "—"}</div>
              </div>
            ))}
          </div>
        ) : <div className="muted">No hay exportaciones aún.</div>}
      </section>

      {/* Estadísticas con charts */}
      <section ref={refStats} id="stats" style={cardDark}>
        <h3 style={h3Dark}>Estadísticas</h3>
        <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
          <div>
            <label className="label" style={labelDark}>Desde</label>
            <input type="date" value={range.from} onChange={(e)=>setRange(r=>({...r, from:e.target.value}))} style={inputDark}/>
          </div>
          <div>
            <label className="label" style={labelDark}>Hasta</label>
            <input type="date" value={range.to} onChange={(e)=>setRange(r=>({...r, to:e.target.value}))} style={inputDark}/>
          </div>
        </div>

        {statsLoading ? (
          <div className="muted" style={{marginTop:10}}>Cargando…</div>
        ) : summary ? (
          <>
            <div style={gridAuto}>
              <InfoDark label="Ventas (monto)" value={formatMoney(summary.salesAmount)} />
              <InfoDark label="Tickets" value={summary.salesCount} />
              <InfoDark label="Promedio ticket" value={formatMoney(summary.avgTicket)} />
              <InfoDark label="Productos vendidos" value={summary.itemsCount} />
            </div>

            {/* Comparativa vs periodo anterior */}
            {compare && (
              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Comparativa vs período anterior</b>
                <div className="small" style={{marginTop:4, color:"#94a3b8"}}>
                  Anterior: {compare.prevRange.from} → {compare.prevRange.to}
                </div>
                <div style={gridDelta}>
                  <Delta label="Monto"         now={compare.current.amount}  pct={compare.deltas.amountPct}  money />
                  <Delta label="Tickets"       now={compare.current.count}   pct={compare.deltas.countPct} />
                  <Delta label="Ticket prom."  now={compare.current.avg}     pct={compare.deltas.avgPct}     money />
                  <Delta label="Ítems"         now={compare.current.items}   pct={compare.deltas.itemsPct} />
                </div>
              </div>
            )}

            {/* Selector de bucket */}
            <div style={{display:"flex", gap:10, alignItems:"center", marginTop:12}}>
              <label className="label" style={labelDark}>Agrupar por</label>
              <select value={bucket} onChange={(e)=>setBucket(e.target.value)} style={inputDark}>
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>

            {/* Serie temporal */}
            <div style={cardSoftDark}>
              <b style={{color:"#e5e7eb"}}>Evolución de ventas ({bucket})</b>
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

            {/* Barras y pie */}
            <div style={gridCharts}>
              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Top productos (unidades)</b>
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

              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Participación por categoría</b>
                {leaders?.length ? (
                  <div style={{width:"100%", height:260}}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={leaders.map(l => ({ name: l.category, value: l.qty }))} dataKey="value" nameKey="name" outerRadius={90} label>
                          {leaders.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend /><RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="muted" style={{marginTop:8}}>Sin datos en el rango.</div>}
              </div>
            </div>

            {/* Heatmap */}
            <div style={cardSoftDark}>
              <b style={{color:"#e5e7eb"}}>Mapa de calor por hora y día</b>
              <div className="small" style={{marginTop:4, color:"#94a3b8"}}>Dom=0 … Sáb=6</div>
              <Heatmap data={heat} metric="amount" />
            </div>
          </>
        ) : (
          <div className="muted" style={{marginTop:10}}>Sin datos para el rango seleccionado.</div>
        )}
      </section>

      {/* Cámaras IA (beta) */}
      <section ref={refCams} id="ai" style={cardDark}>
        <h3 style={h3Dark}>Cámaras IA (beta)</h3>

        {camsLoading ? (
          <div className="muted">Cargando…</div>
        ) : (
          <>
            {!camsInfo.enabled && (
              <div style={alertWarn}>
                <b>Servicio no habilitado.</b> Podés solicitar la activación y te contactamos para configurarlo.
                <div style={{marginTop:10}}>
                  <button className="btn" onClick={doRequestActivation} disabled={busyActivation}>
                    {busyActivation ? "Enviando…" : camsInfo.requested ? "Solicitud enviada ✅" : "Solicitar activación"}
                  </button>
                </div>
              </div>
            )}

            <div style={grid3}>
              {/* Alta de cámara */}
              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Agregar cámara</b>
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
              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Mis cámaras</b>
                {camsInfo.items?.length ? (
                  <ul style={{marginTop:8, paddingLeft:18}}>
                    {camsInfo.items.map(cam => (
                      <li key={cam.id} style={{marginBottom:10}}>
                        <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                          <div>
                            <div style={{fontWeight:700, color:"#e5e7eb"}}>{cam.name}</div>
                            <div className="small" style={{maxWidth:420, overflow:"hidden", textOverflow:"ellipsis", color:"#94a3b8"}}>{cam.rtspUrl}</div>
                            <div className="small" style={{color:"#cbd5e1"}}>Estado: <b>{cam.status}</b></div>
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
              <div style={cardSoftDark}>
                <b style={{color:"#e5e7eb"}}>Eventos recientes</b>
                <div style={gridEventsFilters}>
                  <div>
                    <label className="label" style={labelDark}>Cámara</label>
                    <select value={eventsFilter.cameraId} onChange={(e)=>setEventsFilter(f=>({ ...f, cameraId: e.target.value }))} style={inputDark}>
                      <option value="">Todas</option>
                      {camsInfo.items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={labelDark}>Tipo</label>
                    <select value={eventsFilter.type} onChange={(e)=>setEventsFilter(f=>({ ...f, type: e.target.value }))} style={inputDark}>
                      <option value="">Todos</option>
                      <option value="person">Persona</option>
                      <option value="queue">Cola</option>
                      <option value="motion">Movimiento</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" style={labelDark}>Límite</label>
                    <input type="number" min={10} max={1000} value={eventsFilter.limit} onChange={(e)=>setEventsFilter(f=>({ ...f, limit: Number(e.target.value||200) }))} style={inputDark}/>
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
                  <div style={tableWrapDark}>
                    <div style={theadDark}>
                      <div>Fecha</div><div>Cámara</div><div>Tipo</div><div>Conf.</div><div>Snapshot</div>
                    </div>
                    {events.map(ev => (
                      <div style={trDark} key={ev.id}>
                        <div>{new Date(ev.occurredAt || ev.createdAt).toLocaleString()}</div>
                        <div>{camsInfo.items.find(c=>c.id===ev.cameraId)?.name || ev.cameraId}</div>
                        <div>{ev.type}</div>
                        <div>{ev.confidence ? `${(ev.confidence*100).toFixed(0)}%` : "—"}</div>
                        <div>{ev.snapshotUrl ? <a className="btn" href={ev.snapshotUrl} target="_blank" rel="noreferrer">Ver</a> : "—"}</div>
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
      <label className="label" style={labelDark}>{label}</label>
      <input value={value || ""} onChange={(e)=>onChange(e.target.value)} style={inputDark} />
    </div>
  );
}
function NumField({ label, min=0, max=999, value, onChange }) {
  return (
    <div>
      <label className="label" style={labelDark}>{label}</label>
      <input type="number" min={min} max={max} value={value ?? ""} onChange={(e)=>onChange(Number(e.target.value))} style={inputDark}/>
    </div>
  );
}
function InfoDark({ label, value }) {
  return (
    <div style={infoTileDark}>
      <div style={{fontSize:12, color:"#94a3b8"}}>{label}</div>
      <div style={{fontSize:18, fontWeight:800, color:"#e5e7eb"}}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    ready:   { bg:"#0f3b2d", bd:"#10b981", tx:"#a7f3d0", label:"Listo" },
    processing: { bg:"#0b2547", bd:"#3b82f6", tx:"#bfdbfe", label:"Procesando" },
    error:   { bg:"#3b0a0a", bd:"#ef4444", tx:"#fecaca", label:"Error" },
    default: { bg:"#111827", bd:"#9ca3af", tx:"#e5e7eb", label:s || "—" },
  };
  const m = map[s] || map.default;
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:999,
      background:m.bg, border:`1px solid ${m.bd}`, color:m.tx, fontSize:12, fontWeight:700
    }}>
      {m.label}
    </span>
  );
}
function ProcessingPill(){
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px",
      borderRadius:999, background:"#0b2547", border:"1px solid #3b82f6", color:"#bfdbfe", fontSize:12, fontWeight:700
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

/* Delta KPI (dark-friendly) */
function Delta({ label, now, pct, money=false }) {
  const up = pct > 0, down = pct < 0;
  const fmt = v => money ? formatMoney(v) : (Number(v||0)).toLocaleString("es-AR");
  const chipStyle = {
    display:"inline-flex", alignItems:"center", gap:6, padding:"2px 8px",
    borderRadius:999, fontSize:12, fontWeight:800,
    background: up ? "#0f3b2d" : down ? "#3b0a0a" : "#111827",
    border: `1px solid ${up ? "#10b981" : down ? "#ef4444" : "#9ca3af"}`,
    color: up ? "#a7f3d0" : down ? "#fecaca" : "#e5e7eb"
  };
  return (
    <div style={infoTileDark}>
      <div style={{fontSize:12, color:"#94a3b8"}}>{label}</div>
      <div style={{fontSize:18, fontWeight:800, color:"#e5e7eb"}}>{fmt(now)}</div>
      <div style={{marginTop:4}}>
        <span style={chipStyle}>
          {pct>0 ? "▲" : pct<0 ? "▼" : "•"} {Number(pct||0).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

/* Heatmap día x hora (dark) */
function Heatmap({ data=[], metric="amount" }) {
  // arma matriz 7x24 (dow x hour)
  const grid = Array.from({length:7}, ()=> Array.from({length:24}, ()=>0));
  let max = 0;
  for (const r of data) {
    const v = Number(r?.[metric]||0);
    if (r.dow>=0 && r.dow<7 && r.hour>=0 && r.hour<24) {
      grid[r.dow][r.hour] = v;
      if (v>max) max=v;
    }
  }
  const scale = v => max===0 ? 0 : v/max; // 0..1
  const hours = Array.from({length:24}, (_,h)=>h);

  return (
    <div style={{overflowX:"auto", marginTop:10}}>
      <table style={heatTable}>
        <thead>
          <tr>
            <th style={{position:"sticky", left:0, background:"#0b1220"}}></th>
            {hours.map(h=>(
              <th key={h} style={{textAlign:"center", color:"#94a3b8"}}>{h.toString().padStart(2,"0")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, dow)=>(
            <tr key={dow}>
              <td style={{position:"sticky", left:0, background:"#0b1220", color:"#94a3b8", paddingRight:6}}>
                {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][dow]}
              </td>
              {row.map((v, h)=> {
                const t = scale(v);
                const bg = `rgba(59,130,246,${0.12 + t*0.88})`;
                return (
                  <td key={h} title={`${metric==="amount" ? formatMoney(v) : v.toLocaleString("es-AR")}`}
                      style={{ width:18, height:18, background:bg, borderRadius:4 }} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- estilos locales ---------- */
const pageWrap = {
  maxWidth: 1120,
  margin: "30px auto",
  padding: "0 16px",
};
const headerWrap = { display: "flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 };

const cardDark = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 24px rgba(0,0,0,.25)",
  color: "#e5e7eb",
  marginBottom: 16,
};
const cardSoftDark = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
  marginTop: 12
};
const h3Dark = { marginTop: 0, color:"#e5e7eb" };
const labelDark = { color:"#cbd5e1", fontWeight:600, fontSize:14, display:"block", marginBottom:6 };
const inputDark = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #334155",
  borderRadius: 8,
  background: "#0b1220",
  color: "#e5e7eb",
  outline: "none",
};

const gridAuto = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10, marginTop: 6 };
const gridCharts = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:12, marginTop:12 };
const grid3 = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12 };
const gridDelta = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginTop:10 };
const gridEventsFilters = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginTop:8 };

const infoTileDark = {
  background:"#0b1220", border:"1px solid #1f2937", borderRadius:10, padding:"10px 12px"
};

const subnavDark = {
  position:"sticky",
  top:8,
  zIndex:5,
  display:"flex",
  gap:12,
  alignItems:"center",
  background:"rgba(2,6,23,.7)",
  WebkitBackdropFilter:"saturate(160%) blur(8px)",
  backdropFilter:"saturate(160%) blur(8px)",
  border:"1px solid #1f2937",
  borderRadius:10,
  padding:"8px 10px",
  marginBottom:12,
};

const tableWrapDark = {
  display:"grid",
  border: "1px solid #1f2937",
  borderRadius: 10,
  overflow: "hidden",
  background:"#0b1220"
};
const theadDark = {
  display: "grid",
  gridTemplateColumns:"repeat(4, minmax(0,1fr))",
  background: "#0e1837",
  color: "#cbd5e1",
  fontWeight: 700,
  fontSize: 14,
  borderBottom: "1px solid #1f2937",
  paddingInline: 0,
};
const trDark = {
  display:"grid",
  gridTemplateColumns:"repeat(4, minmax(0,1fr))",
  borderBottom: "1px solid #1f2937",
  background: "rgba(255,255,255,.02)"
};
// padding para celdas
theadDark["--pad"] = "10px 12px";
trDark["--pad"] = "10px 12px";
// Añadimos padding por child
Object.assign(theadDark, { });
Object.assign(trDark, { });
const heatTable = {
  borderCollapse:"separate",
  borderSpacing: 2,
  fontSize: 12,
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 8,
  padding: 6,
};

const alertWarn = {
  background:"#3b2a07",
  border:"1px solid #fbbf24",
  color:"#fde68a",
  padding:12,
  borderRadius:10,
  marginBottom:12
};
