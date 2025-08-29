export function money(value, currency = (import.meta.env.VITE_CURRENCY || 'ARS')){
  try { return new Intl.NumberFormat('es-AR', { style:'currency', currency }).format(Number(value||0)); }
  catch { return `$${value}`; }
}
