# Módulos de Páginas (`src/pages/`)

Esta carpeta contiene todas las vistas y módulos principales de VEXTOR.

## Listado de Módulos

| Módulo | Ruta URL | Roles con Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| **Landing** | `/` | Público | Página comercial de presentación de VEXTOR. |
| **Login** | `/login` | Público | Formulario de inicio de sesión de usuario. |
| **Register** | `/register` | Público | Formulario de registro de nuevos usuarios. |
| **ForgotPassword** | `/forgot-password` | Público | Solicitud de enlace para recuperación de clave. |
| **ResetPassword** | `/reset-password` | Público | Formulario para ingresar nueva contraseña con token. |
| **Dashboard** | `/dashboard` | Administrador, Auditor, Mantenimiento | Métricas clave de rendimiento de flota y actividad reciente. |
| **Vehicles** | `/vehiculos` | Administrador | Gestión integral de flota, registro, edición y suspensión. |
| **Drivers** | `/conductores` | Administrador | Gestión de perfil de conductores, licenciamiento y cédulas. |
| **Routes** | `/rutas` | Administrador | Programación de rutas y mapa con tracking GPS en tiempo real. |
| **Driver** | `/driver/my-routes`, `/driver/active-route/:id` | Conductor | Panel táctil para conductores, ejecución de rutas y emisión GPS. |
| **Maintenance** | `/mantenimientos` | Administrador, Mantenimiento | Control de ordenes de taller, costos en COP y estados. |
| **Reports** | `/reportes` | Administrador, Auditor | Centro de analítica con vista previa y descarga PDF/CSV/Excel. |
| **Settings** | `/configuracion` | Administrador (Secciones restringidas), Todos (Perfil) | Panel de ajustes del sistema (Perfil, Seguridad, Usuarios, Empresa, etc.). |
