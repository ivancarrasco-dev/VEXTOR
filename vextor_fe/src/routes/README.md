# Enrutamiento de la Aplicación - `src/routes/`

Configuración del sistema de navegación SPA mediante **React Router v7**.

---

## 1. Tabla de Rutas de la Aplicación

| Ruta | Componente / Página | Acceso | Roles Permitidos | Layout Utilizado |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Landing.jsx` | Público | Todos | Ninguno |
| `/login` | `Login.jsx` | Público | No autenticados | Ninguno |
| `/register` | `Register.jsx` | Público | No autenticados | Ninguno |
| `/forgot-password` | `ForgotPassword.jsx` | Público | No autenticados | Ninguno |
| `/reset-password` | `ResetPassword.jsx` | Público | No autenticados | Ninguno |
| `/dashboard` | `Dashboard.jsx` | Protegido | Administrador, Auditor, Mantenimiento | `DashboardLayout` |
| `/vehiculos` | `Vehicles.jsx` | Protegido | Administrador | `DashboardLayout` |
| `/conductores` | `Drivers.jsx` | Protegido | Administrador | `DashboardLayout` |
| `/rutas` | `Routes.jsx` | Protegido | Administrador | `DashboardLayout` |
| `/driver/my-routes` | `MyRoutes.jsx` | Protegido | Conductor | `DashboardLayout` |
| `/driver/active-route/:idRuta` | `ActiveRoutePage.jsx` | Protegido | Conductor | `DashboardLayout` |
| `/mantenimientos` | `Maintenance.jsx` | Protegido | Administrador, Mantenimiento | `DashboardLayout` |
| `/reportes` | `Reports.jsx` | Protegido | Administrador, Auditor | `DashboardLayout` |
| `/configuracion` | `Settings.jsx` | Protegido | Todos (Secciones filtradas por rol) | `DashboardLayout` |

---

## 2. Componentes de Enrutamiento

### `ProtectedRoute.jsx`
- **Propósito:** Componente guardián que verifica `isAuthenticated` desde `AuthContext`.
- **Comportamiento:**
  - Si el usuario no está autenticado -> Redirige a `/login`.
  - Si el usuario intenta acceder a una ruta restringida por rol -> Redirige al panel por defecto de su rol (ej: Conductor es redirigido a `/driver/my-routes`).
