# Servicios (`src/services`)

En esta arquitectura por características (*feature-based architecture*), los servicios específicos de cada módulo se encuentran ubicados directamente dentro del directorio de su respectiva funcionalidad en `src/pages/<Modulo>/services/`.

## Servicios Colocados por Módulo

- **Vehículos**: `src/pages/Vehicles/services/vehicleService.js` (CRUD de vehículos en FastAPI / Supabase).
- **Conductores**: `src/pages/Drivers/services/driverService.js` (CRUD y estados operativos de conductores).
- **Rutas**: `src/pages/Routes/services/routeService.js` (Gestión de rutas y geolocalización en tiempo real via WebSockets).
- **Mantenimientos**: `src/pages/Maintenance/services/maintenanceService.js` (Gestión y programación de mantenimientos preventivos y correctivos).
- **Reportes**: `src/pages/Reports/services/reportService.js` (Descarga de reportes PDF, CSV, XLSX y registro de bitácora).

## Servicios Globales
Si en el futuro se requiere un servicio transversal a toda la aplicación no ligado a un dominio de negocio específico (p. ej. cliente HTTP global o websocket client), se ubicará en esta carpeta.
