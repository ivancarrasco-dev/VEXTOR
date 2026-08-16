# Módulo de Utilidades - `src/utils/`

Funciones auxiliares y utilidades reutilizables en el frontend.

---

## 1. Inventario de Archivos

### `cn.js`
- **Propósito:** Fusionar dinámicamente clases CSS de Tailwind combinando `clsx` y `tailwind-merge`.
- **Ejemplo:** `cn("px-4 py-2", isError && "bg-red-500", className)`

### `sweetalert.js`
- **Propósito:** Centralizar la configuración de alertas, diálogos de confirmación y modales SweetAlert2 adaptados al tema corporativo oscuro/claro de VEXTOR.
- **Utilizado por:** `Sidebar.jsx`, `UserMenu.jsx`, `Vehicles.jsx`, `Drivers.jsx`, `Settings.jsx`.
