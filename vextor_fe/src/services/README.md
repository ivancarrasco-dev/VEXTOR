# Servicios del Frontend - `src/services/` y Módulos

Los servicios del frontend aíslan la lógica de comunicación HTTP REST y WebSockets entre los componentes de React y FastAPI.

---

## 1. Inventario de Servicios

| Servicio | Ubicación | Responsabilidad / Endpoints | Utilizado por |
| :--- | :--- | :--- | :--- |
| `vehicleService.js` | `src/pages/Vehicles/services/` | Operaciones CRUD en `/api/vehicles`. | `Vehicles.jsx`, `Routes.jsx`, `Maintenance.jsx` |
| `driverService.js` | `src/pages/Drivers/services/` | Operaciones CRUD en `/api/drivers`. | `Drivers.jsx`, `Routes.jsx` |
| `routeService.js` | `src/pages/Routes/services/` | Peticiones a `/api/routes` y acciones de estado. | `Routes.jsx`, `MyRoutes.jsx`, `ActiveRoutePage.jsx` |
| `maintenanceService.js` | `src/pages/Maintenance/services/` | Gestión de órdenes en `/api/maintenance`. | `Maintenance.jsx` |
| `reportService.js` | `src/pages/Reports/services/` | Peticiones a `/api/reports/data` y `/export`. | `Reports.jsx`, `useReports.js` |

---

## 2. Flujo Típico de Comunicación

```text
[ React Component ] ──► [ Service Function ] ──► [ Fetch / Cookie JWT ] ──► [ FastAPI Endpoint ]
```
