# Módulo de Mantenimientos (`src/pages/Maintenance/`)

## 1. Visión General
Control y programación de mantenimientos preventivos y correctivos para los vehículos de la flota.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Maintenance.jsx` | Página | Registro de órdenes de mantenimiento, filtro por taller/estado y formato de costos COP. | `AppRouter.jsx` |
| `services/maintenanceService.js` | Servicio | Peticiones HTTP a `/api/maintenance`. | `Maintenance.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/mantenimientos`
- **Ubicación en UI:** Menú lateral -> Opción "Mantenimientos"
- **Elementos Visibles:**
  - Métricas de inversión total en mantenimiento ($ COP).
  - Listado de órdenes de trabajo clasificadas por estado (Programado, En Proceso, Completado).
