# Documentación del Frontend - VEXTOR (`vextor_fe`)

El cliente web de VEXTOR está construido con **React 19**, **Vite** como empaquetador, **Tailwind CSS v4** para estilos utilitarios responsive y soporte dinamico para temas (modo claro/oscuro), **Framer Motion** para animaciones y transiciones de interfaz, y **Leaflet** para el mapeo interactivo y seguimiento GPS en tiempo real.

---

## 1. Estructura de Directorios

```text
vextor_fe/
├── src/
│   ├── assets/           # Imágenes corporativas (logos, isotipos, SVGs)
│   ├── components/       # Componentes visuales reutilizables (UI y Layout)
│   │   ├── layout/       # Sidebar, Navbar, NavbarSearch, UserMenu, NotificationButton
│   │   └── ui/           # Button, Input, Select, Checkbox, Logo, ThemeToggle
│   ├── context/          # Estados globales (AuthContext, ThemeContext)
│   ├── hooks/            # Hooks personalizados (useTheme, etc.)
│   ├── i18n/             # Configuración de internacionalización y traducciones (es, en)
│   ├── layouts/          # Envoltorios de páginas principales (DashboardLayout)
│   ├── pages/            # Módulos y páginas de la aplicación
│   │   ├── Dashboard/    # Resumen métrico y actividad reciente
│   │   ├── Vehicles/     # Gestión del parque automotor
│   │   ├── Drivers/      # Administración de conductores y licencias
│   │   ├── Routes/       # Programación de rutas y mapa en tiempo real (Admin)
│   │   ├── Driver/       # Vista operativa del conductor (MyRoutes, ActiveRoutePage)
│   │   ├── Maintenance/  # Registro de mantenimientos y taller (COP)
│   │   ├── Reports/      # Centro de reportes y exportación (PDF, CSV, Excel)
│   │   ├── Settings/     # Configuración modular (Perfil, Empresa, Usuarios, Seguridad, Auditoría, etc.)
│   │   ├── Landing/      # Página pública de presentación comercial
│   │   ├── Login/        # Inicio de sesión
│   │   ├── Register/     # Registro de usuarios
│   │   ├── ForgotPassword/ # Solicitud de recuperación de clave
│   │   └── ResetPassword/  # Restablecimiento de clave
│   ├── routes/           # Configuración de React Router (AppRouter, ProtectedRoute)
│   ├── services/         # Clientes HTTP centralizados (vehicleService, routeService, etc.)
│   ├── styles/           # Configuración global de CSS
│   ├── utils/            # Utilidades generales (cn.js, sweetalert.js)
│   ├── App.jsx           # Componente raíz
│   └── main.jsx          # Punto de entrada de React DOM
├── package.json          # Lista de dependencias y scripts de pnpm
└── vite.config.js        # Configuración de Vite y plugins
```

---

## 2. Tecnologías Principales

- **React 19:** Biblioteca principal para la construcción de interfaces mediante componentes funcionales y hooks.
- **Tailwind CSS v4:** Motor de estilos mediante clases utilitarias de alto rendimiento con selector dark mode `.dark`.
- **Framer Motion:** Biblioteca para animaciones fluidas, colapsado de barra lateral y transiciones de páginas.
- **Leaflet & React-Leaflet:** Renderizado de mapas vectoriales con integración OSRM y soporte para capa de tráfico en tiempo real mediante **TomTom Traffic Raster Flow Tiles** (`VITE_TOMTOM_API_KEY`).
- **SweetAlert2 (`sweetalert.js`):** Modales estilizados en tema oscuro/claro para confirmación de acciones destructivas o alertas.

---

## 3. Instalación y Ejecución Local

```bash
cd vextor_fe

# Instalar dependencias con pnpm
pnpm install

# Iniciar servidor de desarrollo (Vite)
pnpm run dev

# Compilar para producción
pnpm run build
```
Servidor local por defecto: `http://localhost:5173`
