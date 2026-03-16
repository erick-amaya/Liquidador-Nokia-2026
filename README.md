# 📋 Liquidador Nokia 2026

Aplicación web progresiva (PWA) para la liquidación y gestión de sitios Nokia, desarrollada para **Ingetel SAS**. Permite liquidar sitios TI y TSS, registrar gastos, calcular márgenes y sincronizar datos en tiempo real con Google Sheets.

---

## 🚀 Acceso rápido

🌐 **Web:** `https://erick-amaya.github.io/Liquidador-Nokia-2026/`  
📱 **iPhone / Android:** Instalar desde Safari → Compartir → *Añadir a pantalla de inicio*

---

## ✨ Funcionalidades

### 📊 Dashboard
- Resumen general: total de sitios, venta Nokia, costo SubC, margen promedio
- Tabla de todos los sitios con venta, costo, utilidad y % margen
- Buscador por nombre de sitio o LC

### 📄 Liquidador
- Liquidación de sitios **TI** (Nokia vs Subcontratista) y **TSS**
- Catálogo completo de actividades BASE, ADJ y CR con precios por zona
- Secciones: MODERNIZACIÓN, 5G, MIMO, ADJ, CR, CW
- Card **Nokia** (venta) y **Subcontratista** (costo) con totales dinámicos
- Gestión de **CW - Obra Civil** (Individual / Conjunto)
- **BackOffice**: ingreso de costo de gestión y administración
- **Costos Operativos**: Materiales TI/CW, Logística, Adicionales (desde Gastos)
- **Utilidad & Margen** con barra visual y colores dinámicos
- 4 zonas de precio: Ciudad Principal, Ciudad Secundaria, Ciudad Intermedia, Difícil Acceso

### 🗂️ Sitios / Consolidado
- Tabla consolidada con todas las columnas: TI, ADJ, CW, CR, SubC, Materiales, etc.
- Exportar a Excel completo (Consolidado + Gastos + hoja por cada sitio)

### 💰 Gastos
- Registro de gastos por sitio: Materiales TI, Materiales CW, Logística, Adicionales
- Tabla global de todos los gastos

### 📈 Reportes
- Filtro por mes y año
- Tablas de producción mensual con detalle por sitio
- Gráficas de Venta vs Costo y Margen % por mes
- Exportar reporte a Excel o PDF (imprimir)

### 📉 Analítica Gerencial
- KPIs: mejor margen, mayor venta, menor margen, SubCs activos
- **Panel de desempeño por LC/Cuadrilla**: selecciona un subcontratista y ve sus métricas individuales
- Gráficas: venta acumulada en el tiempo, producción por LC, margen por sitio, utilidad por mes, dispersión Venta vs Costo, distribución TI/ADJ/CW/CR

### 📚 Catálogo de Precios 2026
- Precios Nokia y SubC (Cat A, AA, AAA) para todas las actividades
- Secciones: BASE, ADJ_NB2B/B2B, CR Skytool, Subcontratistas
- **Edición en modo Administrador**: precios editables directamente en la tabla
- Agregar nuevas actividades por categoría (solo Admin)

---

## 👥 Perfiles de acceso

| Perfil | PIN | Permisos |
|--------|-----|----------|
| **Administrador** | `N0ki@` | Acceso completo + edición de catálogo |
| **Operador** | `1234` | Liquidación y consulta |

---

## ☁️ Sincronización con Google Sheets

Los datos se sincronizan automáticamente con una hoja de Google Sheets cada vez que se realiza un cambio. Cualquier usuario que abra la app carga los datos más recientes.

La hoja de Google Sheets genera automáticamente:
- **Data**: JSON completo de la aplicación
- **Consolidado**: tabla legible con todos los sitios
- **Gastos**: registro de todos los gastos

> Ver sección de instalación para configurar la sincronización.

---

## 🛠️ Instalación y configuración

### Requisitos
- Cuenta de **GitHub** (gratis)
- Cuenta de **Google** (para Sheets + Apps Script)

---

### Paso 1 — Crear la hoja de Google Sheets

1. Ve a [sheets.google.com](https://sheets.google.com)
2. Crea una hoja nueva con el nombre que quieras (ej: `Ingetel Liquidador 2026`)
3. Copia el **ID** de la URL — es el string largo entre `/d/` y `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/► ESTE_ES_EL_ID ◄/edit
   ```

---

### Paso 2 — Configurar Google Apps Script (backend)

1. Ve a [script.google.com](https://script.google.com)
2. Clic en **Nuevo proyecto**
3. Borra el código existente y pega el contenido del archivo `Code.gs`
4. En la primera línea del código, reemplaza:
   ```javascript
   const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';
   ```
   con el ID copiado en el paso anterior
5. Clic en **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Autoriza los permisos solicitados
7. **Copia la URL** de la implementación (termina en `/exec`)

---

### Paso 3 — Conectar la app con Sheets

1. Abre el archivo `index.html` con cualquier editor de texto
2. Busca la línea:
   ```javascript
   const GAS_URL = 'TU_APPS_SCRIPT_URL_AQUI';
   ```
3. Reemplaza `TU_APPS_SCRIPT_URL_AQUI` con la URL copiada en el paso anterior
4. Guarda el archivo

---

### Paso 4 — Publicar en GitHub Pages

1. Crea un repositorio nuevo en [github.com](https://github.com)
   - Nombre: el que quieras (ej: `ingetel-liquidador`)
   - Visibilidad: **Public**
2. Sube los 3 archivos:
   - `index.html`
   - `manifest.json`
   - `Code.gs` *(solo referencia, no se ejecuta en GitHub)*
3. Ve a **Settings → Pages**
4. En **Source** selecciona: `Deploy from a branch` → rama `main` → carpeta `/root`
5. Clic en **Save**
6. En unos minutos tu app estará disponible en:
   ```
   https://TU_USUARIO.github.io/NOMBRE_REPOSITORIO/
   ```

---

### Paso 5 — Instalar en iPhone

1. Abre **Safari** en el iPhone (debe ser Safari, no Chrome)
2. Ve a la URL de GitHub Pages
3. Toca el botón **Compartir** (cuadrado con flecha hacia arriba)
4. Selecciona **"Añadir a pantalla de inicio"**
5. Dale un nombre y toca **Agregar**

La app aparece como ícono nativo en tu pantalla de inicio, se abre en pantalla completa sin barra del navegador y funciona offline gracias al Service Worker.

---

## 📁 Estructura del repositorio

```
/
├── index.html       # Aplicación completa (single-file PWA)
├── manifest.json    # Configuración PWA para instalación en dispositivos
├── Code.gs          # Google Apps Script (backend Sheets)
└── README.md        # Este archivo
```

---

## 🔧 Tecnologías

| Tecnología | Uso |
|-----------|-----|
| HTML5 / CSS3 / JavaScript | App completa en un solo archivo |
| PWA (Service Worker + Manifest) | Instalación nativa y uso offline |
| Chart.js | Gráficas de analítica |
| SheetJS (xlsx.js) | Exportación a Excel |
| Google Apps Script | Backend sincronización con Sheets |
| Google Sheets | Base de datos en la nube |
| GitHub Pages | Hosting gratuito |

---

## 📞 Soporte

**SCYTEL NETWORKS SAS** — Integrated Telecommunication Services  
Comprehensive Solutions Connectivity without Limits...
