# Módulo de Reportes (`src/pages/Reports/`)

## 1. Visión General
Centro de analítica para generación y exportación de informes consolidados de flota, conductores, rutas, auditoría y costos en formatos binarios (PDF, Excel, CSV).

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Reports.jsx` | Página | Contenedor principal del centro de reportes. | `AppRouter.jsx` |
| `components/ReportHeader.jsx` | Componente | Encabezado del módulo con título y acciones rápidas. | `Reports.jsx` |
| `components/QuickReportsSection.jsx` | Componente | Accesos directos a reportes comunes. | `Reports.jsx` |
| `components/ModuleCardsSection.jsx` | Componente | Selector de módulo para generación de reportes. | `Reports.jsx` |
| `components/ReportFilters.jsx` | Componente | Filtros por fecha, usuario, módulo y tipo de reporte. | `Reports.jsx` |
| `components/ReportPreviewTable.jsx` | Componente | Tabla de vista previa con paginación y dropdown de exportación. | `Reports.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/reports`
- **Ubicación en UI:** Menú lateral ➔ Opción "Reportes"
- **Acceso:** Exclusivo Administrador
