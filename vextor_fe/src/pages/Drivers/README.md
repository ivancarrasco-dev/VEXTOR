# Módulo de Conductores (`src/pages/Drivers/`)

## 1. Visión General
Módulo para la administración de personal de conducción, licencias de conducir colombianas y vinculación con cuentas de usuario.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Drivers.jsx` | Página | Tabla de conductores, filtros por estado y formulario modal de creación/edición. | `AppRouter.jsx` |
| `services/driverService.js` | Servicio | Cliente HTTP con llamadas a `/api/drivers`. | `Drivers.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/drivers`
- **Ubicación en UI:** Menú lateral ➔ Opción "Conductores"
- **Acceso:** Exclusivo Administrador
