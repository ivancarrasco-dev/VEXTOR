# Módulo de Configuración (`src/pages/Settings/`)

## 1. Visión General
Módulo altamente modularizado que agrupa los ajustes globales de la plataforma, perfil de usuario, seguridad, gestión administrativa de usuarios, información corporativa, auditoría y personalización de apariencia.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Settings.jsx` | Página | Contenedor principal con menú lateral de secciones y renderizado condicional. | `AppRouter.jsx` |
| `sections/ProfileSection.jsx` | Sección UI | Edición de foto de perfil, teléfono y datos del usuario actual. | `Settings.jsx` |
| `sections/SecuritySection.jsx` | Sección UI | Cambio de contraseña y gestión de sesiones activas (`sesion_usuario`). | `Settings.jsx` |
| `sections/CompanySection.jsx` | Sección UI | Configuración de NIT, razón social y datos corporativos (Exclusivo Admin). | `Settings.jsx` |
| `sections/UsersSection.jsx` | Sección UI | Administración de usuarios, creación y asignación de roles (Exclusivo Admin). | `Settings.jsx` |
| `sections/AuditSection.jsx` | Sección UI | Consulta de bitácora de actividades del sistema (`actividad`) (Exclusivo Admin). | `Settings.jsx` |
| `sections/NotificationsSection.jsx` | Sección UI | Preferencias de alertas del sistema. | `Settings.jsx` |
| `sections/AppearanceSection.jsx` | Sección UI | Selección de tema claro/oscuro/sistema y densidad visual. | `Settings.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/settings`
- **Ubicación en UI:** Menú lateral ➔ Opción "Configuración"
- **Acceso:** Todos los usuarios autenticados (Con secciones administrativas restringidas a Administrador)
