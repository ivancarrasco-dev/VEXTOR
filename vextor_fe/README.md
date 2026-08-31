# Documentación del Frontend - VEXTOR (`vextor_fe`)

El cliente web de VEXTOR está construido con **React 19**, **Vite** como empaquetador de alto rendimiento, **Tailwind CSS v4** para estilos utilitarios responsivos y temas dinámicos (modo claro y oscuro), **Framer Motion** para transiciones y animaciones fluidas, y **Leaflet** para el renderizado de mapas interactivos, enrutamiento vial OSRM y telemetría GPS en tiempo real.

---

## 1. Estructura de Directorios

```text
vextor_fe/
├── src/
│   ├── assets/           # Imágenes corporativas (logotipos, isotipos, marcas de agua, SVGs)
│   ├── components/       # Componentes visuales reutilizables
│   │   ├── layout/       # Sidebar, Navbar, NavbarSearch, UserMenu, NotificationButton
│   │   └── ui/           # Button, Input, Select, Checkbox, Logo, ThemeToggle, ForcedPasswordModal
│   ├── config/           # Configuración dinámica de entorno y URLs de backend (api.js)
│   ├── context/          # Estado global de React (AuthContext, ThemeContext)
│   ├── hooks/            # Custom Hooks (useTheme, useWindowResize, useReports)
│   ├── i18n/             # Internacionalización y archivos de traducción (es, en)
│   ├── layouts/          # Envoltorios de páginas con estructura de Dashboard (DashboardLayout)
│   ├── pages/            # Módulos y vistas principales de la aplicación
│   │   ├── Dashboard/    # Métricas de rendimiento, KPIs y actividad reciente
│   │   ├── Vehicles/     # Gestión integral de la flota vehicular y modal CRUD
│   │   ├── Drivers/      # Gestión de perfil de conductores y licencias
│   │   ├── Routes/       # Programación de rutas y mapa con tracking GPS en tiempo real (Admin)
│   │   ├── Driver/       # Vista táctil para el conductor (MyRoutes, ActiveRoutePage con HUD)
│   │   ├── Maintenance/  # Gestión de órdenes de taller y costos en COP
│   │   ├── Reports/      # Centro de analítica y exportación (PDF, CSV, Excel)
│   │   ├── Settings/     # Configuración modular (Perfil, Seguridad, Usuarios, Empresa, Auditoría)
│   │   ├── Landing/      # Página pública de presentación comercial de VEXTOR
│   │   ├── Login/        # Formulario de inicio de sesión
│   │   ├── Register/     # Formulario de registro público (Rol Usuario)
│   │   ├── ForgotPassword/ # Solicitud de recuperación de clave
│   │   └── ResetPassword/  # Restablecimiento de clave con token
│   ├── routes/           # Configuración de React Router SPA (AppRouter, ProtectedRoute)
│   ├── services/         # Servicios de integración HTTP colocados por módulo y globales
│   ├── styles/           # Configuración global de CSS y Tailwind
│   ├── utils/            # Utilidades generales (cn.js, sweetalert.js)
│   ├── App.jsx           # Componente raíz
│   └── main.jsx          # Punto de entrada de React DOM
├── Dockerfile            # Dockerfile multi-stage servido por Nginx en puerto 80
├── nginx.conf            # Configuración de Nginx con fallback de rutas SPA React Router
├── package.json          # Dependencias y scripts de pnpm
└── vite.config.js        # Configuración de Vite empaquetador
```

---

## 2. Configuración de API y Servicios (`src/config/api.js`)

El archivo `src/config/api.js` resuelve dinámicamente los endpoints backend y credenciales de mapas a partir de las variables de entorno de Vite:

- **`API_BASE_URL`:** `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'`
- **`WS_BASE_URL`:** `import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'`
- **`TOMTOM_API_KEY`:** `(import.meta.env.VITE_TOMTOM_API_KEY || '').trim()`

---

## 3. Tecnologías y Librerías Principales

- **React 19:** Componentes funcionales, Hooks avanzados y renderizado declarativo.
- **Tailwind CSS v4:** Motor utilitario CSS con selector dark mode `.dark` y variables CSS de diseño.
- **Framer Motion:** Animaciones para colapso de la barra lateral (Sidebar), modales y animaciones entre rutas.
- **Leaflet & React-Leaflet:** Mapa vectorial interactivo con marcadores dinámicos orientados por ángulo GPS, polylinea de recorrido y capa de tráfico en tiempo real mediante **TomTom Traffic Raster Flow Tiles**.
- **SweetAlert2 (`sweetalert.js`):** Modales de alerta y confirmación estilizados en tema oscuro.

---

## 4. Instalación y Ejecución Local

```bash
cd vextor_fe

# Instalar dependencias con pnpm
pnpm install

# Iniciar servidor de desarrollo (Vite)
pnpm run dev

# Compilar para producción
pnpm run build
```
Servidor local de desarrollo: `http://localhost:5173`
