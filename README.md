# PasantíaMap

Tracker de prácticas profesionales e internships para Chile y LATAM.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Subir a GitHub + Vercel (paso a paso)

### 1. Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `pasantiamap`
3. Privado o público (tu elección)
4. **No** marques "Add README" — ya tienes uno
5. Clic en "Create repository"

### 2. Subir el código
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pasantiamap.git
git push -u origin main
```

### 3. Desplegar en Vercel
1. Ve a https://vercel.com y crea cuenta (gratis, con tu GitHub)
2. Clic en "Add New Project"
3. Selecciona el repo `pasantiamap`
4. Vercel detecta Vite automáticamente — no cambies nada
5. Clic en "Deploy"
6. En ~1 minuto tienes tu URL: `https://pasantiamap.vercel.app`

### 4. Dominio personalizado (opcional)
En el dashboard de Vercel → Settings → Domains → agrega tu dominio.

## Agregar datos desde Google Sheets

En `src/App.jsx`, busca `SHEET_URLS` al inicio del archivo y agrega:

```js
const SHEET_URLS = {
  "finanzas_verano":      "URL_DE_TU_SHEET_CSV",
  "finanzas_tradicional": "URL_DE_TU_SHEET_CSV",
  "finanzas_eventos":     "URL_DE_TU_SHEET_CSV",
  // más áreas...
};
```

El Sheet debe tener estas columnas:
`id, company, role, region, remote, duration, posted, deadline, link, notes`

## Stack
- React 18 + Vite
- Google Sheets como base de datos (CSV público)
- localStorage para progreso de usuarios
- Sin backend — 100% frontend estático
