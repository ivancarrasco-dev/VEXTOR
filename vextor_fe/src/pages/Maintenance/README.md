# Módulo de Mantenimientos (`src/pages/Maintenance/`)

## 1. Visión General
Control y programación de mantenimientos preventivos y correctivos para los vehículos de la flota, control de costos en Pesos Colombianos (`COP`) y cambio automático de estado vehicular.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Maintenance.jsx` | Página | Tabla de órdenes de taller, métricas de costos y formulario modal CRUD. | `AppRouter.jsx` |
| `services/maintenanceService.js` | Servicio | Cliente HTTP con llamadas a `/api/maintenance`. | `Maintenance.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/maintenance`
- **Ubicación en UI:** Menú lateral ➔ Opción "Mantenimientos"
- **Acceso:** Exclusivo Administrador
