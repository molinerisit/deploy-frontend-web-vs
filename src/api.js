// src/api.js
const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL.replace(/\/+$/, ""); // sin barra final

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body !== undefined) opts.body = typeof body === "string" ? body : JSON.stringify(body);

  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText || "Request error");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* =========================
   Auth
========================= */
export function loginUser(email, password) {
  return request("/login", { method: "POST", body: { email, password } });
}
export function registerUser(email, password) {
  return request("/register", { method: "POST", body: { email, password } });
}

/* =========================
   Licencias
========================= */
export function getLicense(token) {
  return request("/license", { headers: { Authorization: `Bearer ${token}` } });
}
export function refreshLicense(token) {
  return request("/license/refresh", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function attachDevice(token, deviceId) {
  return request("/license/devices/attach", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { deviceId } });
}
export function detachDevice(token, deviceId) {
  return request("/license/devices/detach", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { deviceId } });
}

/* =========================
   Suscripción (Mercado Pago)
========================= */
export function subscribe(plan, token, mpEmail) {
  return request("/subscribe", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { plan, mpEmail } });
}
export function cancelSubscription(token) {
  return request("/subscription/cancel", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function pauseSubscription(token) {
  return request("/subscription/pause", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function resumeSubscription(token) {
  return request("/subscription/resume", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function changePaymentMethod(token, { mpEmail, plan }) {
  return request("/subscription/change-method", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { mpEmail, plan } });
}

/* =========================
   Negocio / Retención / Tablas / Exportes / Stats (compatibilidad)
   (asumiendo que ya tenés estos endpoints en tu backend)
========================= */
export function getBusinessProfile(token) {
  return request("/business/profile", { headers: { Authorization: `Bearer ${token}` } });
}
export function updateBusinessProfile(token, body) {
  return request("/business/profile", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}

export function getRetentionSettings(token) {
  return request("/retention/settings", { headers: { Authorization: `Bearer ${token}` } });
}
export function updateRetentionSettings(token, body) {
  return request("/retention/settings", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}
export function runCleanupNow(token, body) {
  return request("/retention/run", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}

export function listTables(token) {
  return request("/data/tables", { headers: { Authorization: `Bearer ${token}` } });
}
export function getTableInfo(token, table) {
  return request(`/data/tables/${encodeURIComponent(table)}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function vacuumTable(token, table) {
  return request(`/data/tables/${encodeURIComponent(table)}/vacuum`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function truncateTable(token, table) {
  return request(`/data/tables/${encodeURIComponent(table)}/truncate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function createDataExport(token, body) {
  return request("/data/export", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}
export function listDataExports(token) {
  return request("/data/export", { headers: { Authorization: `Bearer ${token}` } });
}
export function getExportStatus(token, id) {
  return request(`/data/export/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getStatsSummary(token, range) {
  const q = new URLSearchParams(range).toString();
  return request(`/stats/summary?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function getTopProducts(token, params) {
  const q = new URLSearchParams(params).toString();
  return request(`/stats/top-products?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function getCategoryLeaders(token, range) {
  const q = new URLSearchParams(range).toString();
  return request(`/stats/category-leaders?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}

/* =========================
   Serie temporal de ventas
========================= */
export function getSalesSeries(token, { from, to, bucket = "day" }) {
  const q = new URLSearchParams({ from, to, bucket }).toString();
  return request(`/stats/sales-series?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getStatsCompare(token, range){
  const q = new URLSearchParams(range).toString();
  return request(`/stats/compare?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function getSalesHeatmap(token, range){
  const q = new URLSearchParams(range).toString();
  return request(`/stats/hours-heatmap?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}

/* =========================
   Cámaras IA (beta)
========================= */
export function aiRequestActivation(token) {
  return request("/ai/request-activation", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function aiListCameras(token) {
  return request("/ai/cameras", { headers: { Authorization: `Bearer ${token}` } });
}
export function aiCreateCamera(token, { name, rtspUrl }) {
  return request("/ai/cameras", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { name, rtspUrl } });
}
export function aiUpdateCamera(token, id, { name, rtspUrl }) {
  return request(`/ai/cameras/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: { name, rtspUrl } });
}
export function aiToggleCamera(token, id) {
  return request(`/ai/cameras/${id}/toggle`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function aiTestCamera(token, id) {
  return request(`/ai/cameras/${id}/test`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function aiDeleteCamera(token, id) {
  return request(`/ai/cameras/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
export function aiListEvents(token, params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/ai/events?${q}`, { headers: { Authorization: `Bearer ${token}` } });
}

/* =========================
   Export agrupado (compatibilidad)
========================= */
export const api = {
  loginUser, registerUser,
  getLicense, refreshLicense, attachDevice, detachDevice,
  subscribe, cancelSubscription, pauseSubscription, resumeSubscription, changePaymentMethod,

  getBusinessProfile, updateBusinessProfile,
  getRetentionSettings, updateRetentionSettings, runCleanupNow,
  listTables, getTableInfo, vacuumTable, truncateTable,
  createDataExport, listDataExports, getExportStatus,

  getStatsSummary, getTopProducts, getCategoryLeaders, getSalesSeries,

  aiRequestActivation, aiListCameras, aiCreateCamera, aiUpdateCamera, aiToggleCamera, aiTestCamera, aiDeleteCamera, aiListEvents,
};

export default api;
