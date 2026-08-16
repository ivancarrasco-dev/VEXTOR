# Arquitectura del Sistema - VEXTOR

## 1. Visión General de la Arquitectura

VEXTOR está diseñado como una plataforma monolítica desacoplada tipo **Single Page Application (SPA) + REST API / WebSockets + Relational Database (SaaS)**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE PRESENTACIÓN                             │
│                     React 19 + Vite + Tailwind CSS v4                       │
│      (Single Page Application consumiendo REST API & WebSockets)            │
└──────────────────────┬──────────────────────────────▲───────────────────────┘
                       │                              │
             HTTP REST │ JSON                     WS  │ Location Updates
                       ▼                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE NEGOCIO                                │
│                          FastAPI + Python 3.12                              │
│  Routers ──► Pydantic Schemas ──► ORM (SQLAlchemy) ──► Services / Background│
└──────────────────────┬──────────────────────────────▲───────────────────────┘
                       │                              │
          SQL Queries  │ Connection Pool (psycopg)    │ Real-time state
                       ▼                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CAPA DE PERSISTENCIA                            │
│                        PostgreSQL (Supabase / Native)                       │
│    Tablas de Dominio, Índices, Restricciones UUID, Triggers de Auditoría   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes de la Arquitectura

### 2.1 Frontend (`vextor_fe`)
- **Framework:** React 19 con Vite como bundler.
- **Estilos:** Tailwind CSS v4 con variables CSS dinámicas para modo claro y oscuro (`.dark`).
- **Navegación:** React Router v7 (`AppRouter.jsx`, `ProtectedRoute.jsx`).
- **Gestión de Estado Global:**
  - `AuthContext.jsx`: Manejo centralizado del usuario autenticado, estado de sesión y permisos por rol.
  - `ThemeContext.jsx`: Alternancia dinámica de temas (Light/Dark/System) guardado en `localStorage`.
- **Mapeo y Geolocalización:** Leaflet (`react-leaflet`), OpenStreetMap Nominatim API para geocodificación inversa, OSRM API para enrutamiento vial.
- **UI & Animaciones:** Framer Motion para transiciones suaves y colapso del menú lateral; Lucide React para iconografía.

### 2.2 Backend (`vextor_be`)
- **Framework:** FastAPI en Python 3.12 con Servidor ASGI Uvicorn.
- **Modelado ORM:** SQLAlchemy (Mapeo Objeto-Relacional a PostgreSQL).
- **Validación de Datos:** Pydantic Schemas v2 para parsing, tipado y serialización JSON.
- **Comunicación en Tiempo Real:** WebSockets (`/ws/tracking`) para la transmisión de coordenadas GPS entre el conductor en ruta y la vista del administrador.
- **Autenticación y Sesiones:** JWT (PyJWT) firmado con algoritmo HS256, almacenado en cookies `HttpOnly` (`vextor_auth_token`) y validado dinámicamente contra la tabla `sesion_usuario` en la BD.
- **Criptografía:** `bcrypt` para el hash seguro de contraseñas.

### 2.3 Base de Datos (`vextor_bd`)
- **Motor:** PostgreSQL (alojado en Supabase o servidor nativo).
- **Identificadores:** UUID v4 nativos (`gen_random_uuid()`) para todas las entidades primarias.
- **Integridad Referencial:** Claves foráneas estrictas con reglas `ON DELETE RESTRICT` o `CASCADE` según la criticidad de la entidad.

---

## 3. Diagrama de Flujo de Datos

```text
  [ Usuario / Conductor / Admin ]
               │
               ▼
   ┌───────────────────────┐
   │ React 19 Frontend UI  │
   └───────────┬───────────┘
               │
      ┌────────┴────────┐
      │  Service Layer  │ (vehicleService, routeService, etc.)
      └────────┬────────┘
               │
       Fetch / Axios / WS
               │
               ▼
 ┌──────────────────────────┐
 │  FastAPI CORS / Auth     │
 │  Middleware Verification │
 └─────────────┬────────────┘
               │
               ▼
 ┌──────────────────────────┐
 │  APIRouter Handler       │ (router_vehicles.py, router_routes.py, etc.)
 └─────────────┬────────────┘
               │
               ▼
 ┌──────────────────────────┐
 │ Pydantic Validation &    │
 │ SQLAlchemy Session (DB)  │
 └─────────────┬────────────┘
               │
               ▼
 ┌──────────────────────────┐
 │    PostgreSQL Engine     │
 └──────────────────────────┘
```

---

## 4. Grafo de Dependencias entre Módulos

```text
Dashboard
  ├── AuthContext
  ├── themeContext
  ├── vehicleService ──► /api/dashboard/stats
  ├── reportService ──► /api/reports/data
  └── StatsCard / QuickActionCard

Vehículos (Vehicles)
  ├── vehicleService ──► /api/vehicles
  ├── Select / Input / Checkbox (UI)
  └── SweetAlert2 (Sweetalert.js)

Conductores (Drivers)
  ├── driverService ──► /api/drivers
  ├── Select / Input (UI)
  └── Validaciones colombianas (Cédula, Celular, Licencia)

Rutas (Routes)
  ├── routeService ──► /api/routes
  ├── driverService & vehicleService
  ├── MapComponent (Leaflet)
  ├── NominatimAutocomplete (Geocoding)
  └── WebSocket GPS Listener (/ws/tracking)

Mantenimiento (Maintenance)
  ├── maintenanceService ──► /api/maintenance
  ├── vehicleService (Selección de vehículo)
  └── Formatos COP ($)

Reportes (Reports)
  ├── reportService ──► /api/reports
  ├── useReports hook
  └── reportExport.js (PDF, CSV, XLSX)

Configuración (Settings)
  ├── Sections: Profile, Security, Company, Users, Audit, Notifications, Backup, System, Appearance
  ├── AuthContext
  ├── companyService & userService
  └── SweetAlert2
```
