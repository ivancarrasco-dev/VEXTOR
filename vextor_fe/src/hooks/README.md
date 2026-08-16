# Hooks Personalizados - `src/hooks/`

Los hooks personalizados de VEXTOR encapsulan lógica reutilizable de interfaz, suscripción a temas y consumo de servicios.

---

## 1. Inventario de Hooks

### `useTheme()`
- **Ubicación:** `src/context/ThemeContext.jsx` (expuesto mediante hook).
- **Propósito:** Proporcionar acceso al tema visual activo (`light`, `dark`, `system`) y a la función `setTheme`.
- **Qué devuelve:** `{ theme, setTheme, isDark }`.
- **Componentes que lo consumen:** `ThemeToggle.jsx`, `Logo.jsx`, `MapComponent.jsx`, `Settings.jsx`.

### `useReports()`
- **Ubicación:** `src/pages/Reports/hooks/useReports.js`.
- **Propósito:** Gestionar el estado de los filtros del centro de reportes, paginación, carga y ejecución de consultas a la API.
- **Qué devuelve:** `{ reportsData, loading, filters, setFilters, applyFilters, exportReport }`.
- **Componentes que lo consumen:** `Reports.jsx`.
