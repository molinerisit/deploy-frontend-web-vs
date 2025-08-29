# Venta Simple — Frontend (React + Vite)

## Dev
```bash
npm install
cp .env.example .env  # y ajustá VITE_API_URL si hace falta
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Variables
- `VITE_API_URL` → URL del backend (por defecto http://localhost:4000)
- `VITE_PRICE_SINGLE` / `VITE_PRICE_MULTI` → precios para mostrar en la landing (opcional)
- `VITE_CURRENCY` → moneda para formateo (ARS por defecto)
