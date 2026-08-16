# Módulo Dashboard (`src/pages/Dashboard`)

Módulo principal del panel de control que resume en tiempo real las métricas operativas de la flota, accesos rápidos y el historial de actividad reciente del sistema.

## Propósito
Proporcionar una vista ejecutiva e interactiva centralizada donde los administradores y gestores pueden monitorear el estado general de vehículos, conductores, rutas y mantenimientos, así como acceder rápidamente a flujos operativos clave y auditar eventos del sistema.

## Estructura del Módulo
```text
src/pages/Dashboard/
├── components/
│   ├── StatsCard.jsx        # Tarjeta de métricas con indicadores y tendencias
│   └── QuickActionCard.jsx  # Botones de acción rápida hacia flujos operativos
├── Dashboard.jsx            # Vista principal del Dashboard y panel lateral de auditoría
└── README.md                # Documentación del módulo
```

## Componentes y Arquitectura
- **`Dashboard.jsx`**: Componente contenedor de la página. Gestiona la carga asíncrona de estadísticas, el feed de actividad reciente, la animación del drawer lateral de auditoría completa y las acciones de navegación.
- **`components/StatsCard.jsx`**: Renderiza tarjetas dinámicas de estadísticas clave (total vehículos, conductores activos, rutas de hoy, mantenimientos activos) mostrando el valor numérico, icono distintivo y varianza de tendencia.
- **`components/QuickActionCard.jsx`**: Renderiza accesos directos visuales con animación de interacción (`framer-motion`) hacia la creación de vehículos, registro de conductores, programación de rutas y solicitudes de mantenimiento.

## Entorno de Layout
- El Dashboard se renderiza dentro del layout global `DashboardLayout` (`src/layouts/DashboardLayout.jsx`), el cual provee la navegación principal (`Sidebar`, `Navbar`, `NotificationButton`, `UserMenu`).

## Dependencias y Hooks Utilizados
- **`useAuth`**: Acceso al contexto de autenticación para personalizar la bienvenida del usuario activo.
- **`useTranslation`**: Soporte de internacionalización (`react-i18next`).
- **`useNavigate`**: Navegación de React Router hacia páginas hijas del sistema.
- **`framer-motion`**: Animaciones suaves para el grid de métricas, tarjetas y el panel lateral de historial de actividad.
- **`lucide-react`**: Iconografía.
- **`axios`**: Comunicación HTTP con FastAPI backend.

## Relación con el Backend
El módulo se conecta directamente a los siguientes endpoints REST del servidor FastAPI:
- **`GET /api/dashboard/stats`**: Obtiene contadores dinámicos calculados matemáticamente contra períodos históricos (vehículos, conductores, rutas del día, mantenimientos).
- **`GET /api/activities`**: Recupera el registro de auditoría (`actividad` table en PostgreSQL) para alimentar el feed reciente y la bitácora cronológica del drawer.

## Cómo Extender el Módulo
1. **Agregar una nueva métrica**: Añadir una propiedad al estado `statsData` en `Dashboard.jsx` y renderizar un nuevo `<StatsCard />` especificando título, icono y delay de animación.
2. **Agregar una nueva acción rápida**: Renderizar una nueva instancia de `<QuickActionCard />` con el handler `onClick` hacia el `path` o modal objetivo.
3. **Filtros de actividad**: El drawer lateral puede extenderse para incorporar filtros dinámicos por módulo o tipo de acción (`CREAR`, `ACTUALIZAR`, `ELIMINAR`).
