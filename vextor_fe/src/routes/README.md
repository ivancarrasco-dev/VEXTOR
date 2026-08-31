# Enrutamiento de la Aplicación - `src/routes/`

Configuración del sistema de navegación SPA mediante **React Router**.

---

## 1. Tabla de Rutas de la Aplicación

| Ruta | Componente / Página | Acceso | Roles Permitidos | Layout Utilizado |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Landing.jsx` | Público | Todos | Ninguno |
| `/login` | `Login.jsx` | Público | No autenticados | Ninguno |
| `/register` | `Register.jsx` | Público | No autenticados (Asigna rol `Usuario`) | Ninguno |
| `/forgot-password` | `ForgotPassword.jsx` | Público | No autenticados | Ninguno |
| `/reset-password` | `ResetPassword.jsx` | Público | No autenticados | Ninguno |
| `/dashboard` | `Dashboard.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/vehicles` | `Vehicles.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/drivers` | `Drivers.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/routes` | `Routes.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/maintenance` | `Maintenance.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/reports` | `Reports.jsx` | Protegido Admin | Administrador | `DashboardLayout` |
| `/settings` | `Settings.jsx` | Protegido | Todos (Secciones restringidas a Admin) | `DashboardLayout` |
| `/driver/my-routes` | `MyRoutes.jsx` | Protegido | Conductor | `DashboardLayout` |
| `/driver/active-route/:idRuta?` | `ActiveRoutePage.jsx` | Protegido | Conductor | `DashboardLayout` |

---

## 2. Componentes de Enrutamiento

### `ProtectedRoute.jsx`
- **Propósito:** Componente guardián que verifica `isAuthenticated` desde `AuthContext`.
- **Comportamiento:**
  - Muestra la pantalla de carga (Splash Screen) mientras `isLoading` es `true`.
  - Si el usuario no está autenticado (`!isAuthenticated`) ➔ Redirige a `/login`.
  - Si la ruta requiere privilegios administrativos (`adminOnly={true}`) y el usuario es un `Conductor` ➔ Redirige automáticamente a `/driver/my-routes`.
