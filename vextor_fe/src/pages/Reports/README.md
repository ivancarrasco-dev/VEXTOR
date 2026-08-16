# Módulo de Reportes (`src/pages/Reports/`)

## 1. Visión General
Centro de analítica para generación y exportación de informes consolidados de flota, conductores, rutas, auditoría y costos.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Reports.jsx` | Página | Contenedor principal del centro de reportes. | `AppRouter.jsx` |
| `components/ReportHeader.jsx` | Componente | Encabezado del reporte con título, estado y menú de exportación. | `Reports.jsx` |
| `components/ReportFilters.jsx` | Componente | Controles de filtro por rango de fechas, módulo y estado. | `Reports.jsx` |
| `components/ReportPreviewTable.jsx` | Componente | Tabla dinámicamente adaptada según los datos del módulo consultado. | `Reports.jsx` |
| `components/QuickReportsSection.jsx` | Componente | Accesos directos a reportes comunes. | `Reports.jsx` |
| `components/ModuleCardsSection.jsx` | Componente | Selector visual de módulos a auditar/reportar. | `Reports.jsx` |
| `hooks/useReports.js` | Hook | Manejo de estado de filtros, carga y datos. | `Reports.jsx` |
| `services/reportService.js` | Servicio | Peticiones HTTP a `/api/reports/data` y `/api/reports/export`. | `Reports.jsx`, `useReports.js` |
| `utils/reportExport.js` | Utilidad | Manejo de descargas de archivos binarios (PDF, CSV, XLSX). | `Reports.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/reportes`
- **Ubicación en UI:** Menú lateral -> Opción "Reportes"
