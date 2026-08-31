# Módulo de Vehículos (`src/pages/Vehicles/`)

## 1. Visión General
Módulo para el control, registro, edición y gestión operativa del parque automotor de la empresa.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Vehicles.jsx` | Página | Vista principal de flota, filtros por estado y formulario modal CRUD. | `AppRouter.jsx` |
| `services/vehicleService.js` | Servicio | Cliente HTTP con llamadas a `/api/vehicles`. | `Vehicles.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/vehicles`
- **Ubicación en UI:** Menú lateral ➔ Opción "Vehículos"
- **Acceso:** Exclusivo Administrador
