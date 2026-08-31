# Módulos de Páginas (`src/pages/`)

Esta carpeta contiene todas las vistas y módulos principales de VEXTOR.

## Listado de Módulos y Enrutamiento SPA

| Módulo | Ruta URL (`AppRouter.jsx`) | Roles con Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| **Landing** | `/` | Público | Página comercial de presentación de VEXTOR. |
| **Login** | `/login` | Público | Formulario de inicio de sesión de usuario. |
| **Register** | `/register` | Público | Formulario de registro público (Asigna rol `Usuario`). |
| **ForgotPassword** | `/forgot-password` | Público | Solicitud de enlace para recuperación de clave por correo. |
| **ResetPassword** | `/reset-password` | Público | Formulario para ingresar nueva contraseña con token. |
| **Dashboard** | `/dashboard` | Administrador | Resumen ejecutivo con métricas de flota, gráficos y actividad reciente. |
| **Vehicles** | `/vehicles` | Administrador | Gestión integral de parque automotor y modales CRUD. |
| **Drivers** | `/drivers` | Administrador | Gestión de perfil de conductores y licencias de conducción. |
| **Routes** | `/routes` | Administrador | Programación de rutas y mapa con tracking GPS en tiempo real. |
| **Driver** | `/driver/my-routes`, `/driver/active-route/:idRuta?` | Conductor | Panel táctil para conductores, navegación HUD y emisión de GPS vía WebSocket. |
| **Maintenance** | `/maintenance` | Administrador | Registro de órdenes de taller, tipo (preventivo/correctivo) y costos en COP. |
| **Reports** | `/reports` | Administrador | Centro de analítica con vista previa tabular y exportación binaria (PDF/CSV/Excel). |
| **Settings** | `/settings` | Todos (Secciones restringidas a Administrador) | Panel modular de ajustes (Perfil, Seguridad, Usuarios, Empresa, Auditoría, Apariencia). |
