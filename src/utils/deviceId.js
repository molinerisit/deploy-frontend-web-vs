// src/utils/deviceId.js
export function getOrCreateDeviceId() {
  const key = "vs_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    const rand = Math.random().toString(36).slice(2, 10);
    const agent = (navigator.userAgent || "").slice(0, 12).replace(/\s+/g, "");
    id = `dev-${agent}-${rand}`;
    localStorage.setItem(key, id);
  }
  return id;
}
