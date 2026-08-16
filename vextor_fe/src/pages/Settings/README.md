# Módulo de Configuración (`src/pages/Settings/`)

## 1. Visión General
Módulo altamente modularizado que agrupa los ajustes globales de la plataforma, perfil de usuario, seguridad, gestión administrativa de usuarios, información corporativa, auditoría y personalización de apariencia.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Settings.jsx` | Página | Contenedor principal con menú lateral de secciones y renderizado condicional. | `AppRouter.jsx` |
| `sections/ProfileSection.jsx` | Sección UI | Edición de foto de perfil, teléfono, cédula y datos del usuario actual. | `Settings.jsx` |
| `sections/SecuritySection.jsx` | Sección UI | Cambio de contraseña y gestión de sesiones activas (`sesion_usuario`). | `Settings.jsx` |
| `sections/CompanySection.jsx` | Sección UI | Configuración de NIT, razón social y datos corporativos (Exclusivo Admin). | `Settings.jsx` |
| `sections/UsersSection.jsx` | Sección UI | Administración de usuarios, creación y asignación de roles (Exclusivo Admin). | `Settings.jsx` |
| `sections/AuditSection.jsx` | Sección UI | Consulta de bitácora de actividades del sistema (`actividad`). | `Settings.jsx` |
| `sections/NotificationsSection.jsx` | Sección UI | Preferencias de alertas del sistema. | `Settings.jsx` |
| `sections/AppearanceSection.jsx` | Sección UI | Selección de tema claro/oscuro/sistema y densidad visual. | `Settings.jsx` |
| `sections/BackupSection.jsx` | Sección UI | Estado y solicitudes de respaldos de base de datos. | `Settings.jsx` |
| `sections/SystemSection.jsx` | Sección UI | Parámetros del sistema y versiones. | `Settings.jsx` |
| `sections/VehiclesSection.jsx` | Sección UI | Parámetros predeterminados de la flota. | `Settings.jsx` |
| `sections/RoutesSection.jsx` | Sección UI | Reglas globales de tolerancia de velocidad y GPS. | `Settings.jsx` |
| `sections/MaintenanceSection.jsx` | Sección UI | Tolerancias de kilometraje y tiempos de taller. | `Settings.jsx` |
| `sections/DocumentsSection.jsx` | Sección UI | Políticas y plantillas documentales. | `Settings.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/configuracion`
- **Ubicación en UI:** Menú lateral -> Opción "Configuración"
