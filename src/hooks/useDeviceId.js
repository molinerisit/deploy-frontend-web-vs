// hooks/useDeviceId.js
export function useDeviceId(){
  const key = "device_id";
  let id = localStorage.getItem(key);
  if(!id){
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
