# Proveedores de Contexto Global - `src/context/`

Los contextos de React en VEXTOR gestionan el estado global accesible por cualquier nivel del árbol de componentes.

---

## 1. Contextos Implementados

### 1.1 `AuthContext.jsx`
- **Propósito:** Controla la sesión del usuario, verificación de la cookie HttpOnly, roles y permisos de acceso.
- **Estado Gestionado:**
  - `user`: Objeto con datos del usuario (`id_usuario`, `nombre_usuario`, `correo_electronico`, `rol_nombre`, `foto_perfil`).
  - `isAuthenticated`: Booleano que indica si el usuario tiene sesión activa validada contra el backend.
  - `loading`: Booleano que previene parpadeos durante la carga inicial de `GET /api/auth/me`.
- **Funciones Expuetas:**
  - `login(credentials)`: Inicia sesión vía `POST /api/auth/login`.
  - `logout()`: Revoca la sesión en la BD vía `POST /api/auth/logout`.
  - `updateUserProfile(data)`: Actualiza la información del perfil local y servidor.
- **Dónde se Monta:** `App.jsx` envolviendo el `AppRouter`.
- **Componentes que lo consumen:** `ProtectedRoute.jsx`, `Sidebar.jsx`, `UserMenu.jsx`, `Login.jsx`, `Settings.jsx`, `ActiveRoutePage.jsx`.

---

### 1.2 `ThemeContext.jsx`
- **Propósito:** Controla la preferencia temática de la interfaz (modo claro u oscuro).
- **Estado Gestionado:**
  - `theme`: String (`'light'`, `'dark'`, `'system'`).
  - `isDark`: Booleano computado que indica si la clase `.dark` está aplicada en `document.documentElement`.
- **Efecto:** Añade o remueve la clase `.dark` en `<html>` para reactivar las variables CSS de Tailwind CSS v4.
- **Dónde se Monta:** `App.jsx`.
- **Componentes que lo consumen:** `ThemeToggle.jsx`, `Logo.jsx`, `MapComponent.jsx`.
