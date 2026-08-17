# Envoltorios de Diseño (Layouts) - `src/layouts/`

Los layouts estructuran visualmente las páginas protegidas de VEXTOR.

---

## 1. Componentes

### `DashboardLayout.jsx`
- **Propósito:** Envoltorio principal para la SPA autenticada.
- **Estructura Visual:**
  ```text
  ┌─────────────────────────────────────────────────────────────┐
  │ Sidebar     │ Navbar (Búsqueda, Notificaciones, UserMenu)   │
  │ (Framer     ├─────────────────────────────────────────────┤
  │ Motion)     │                                             │
  │             │               <Outlet />                    │
  │             │      (Página hija activa renderizada)       │
  │             │                                             │
  └─────────────┴─────────────────────────────────────────────┘
  ```
- **Responsabilidad:** Gestiona la sincronización del estado colapsado/expandido de la barra lateral (`Sidebar`) mediante breakpoints de pantalla (`isMobile`) y renderiza la barra superior (`Navbar`).
