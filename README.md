# VEXTOR - Plataforma SaaS de Gestión de Flotas Vehiculares y Monitoreo Logístico

[![React 19](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.12)-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791.svg)](https://www.postgresql.org/)
[![Docker OSRM](https://img.shields.io/badge/Docker-Full%20Stack%20Containerized-orange.svg)](https://www.docker.com/)

**VEXTOR** es una plataforma SaaS de nivel empresarial diseñada para el control, monitoreo, mantenimiento y optimización logística de flotas vehiculares. Permite a las empresas rastrear vehículos en tiempo real mediante telemetría GPS sobre WebSockets, programar y monitorear rutas sobre mapas interactivos con enrutamiento vial local OSRM, gestionar conductores con licencias colombianas, administrar órdenes de mantenimiento preventivo y correctivo en Pesos Colombianos (`COP`), auditar la actividad de usuarios y generar reportes analíticos con exportación binaria en PDF, Excel y CSV.

---

## 🏗️ 1. Arquitectura General del Sistema

```text
                  ┌─────────────────────────────────────────┐
                  │            CLIENTE FRONTEND             │
                  │   React 19 + Vite + Tailwind CSS v4     │
                  │       (Nginx en Puerto 80/5173)         │
                  └────────────────────┬────────────────────┘
                                       │  HTTP / WS
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │             BACKEND FASTAPI             │
                  │       Python 3.12 + SQLAlchemy          │
                  │            (Puerto 8000)                │
                  └──────────┬──────────────────┬───────────┘
                             │                  │
                Proxy HTTP   │                  │  SQLAlchemy
                /api/routing │                  │  Connection
                             ▼                  ▼
                  ┌──────────────────┐   ┌──────────────────┐
                  │    MOTOR OSRM    │   │   POSTGRESQL     │
                  │  MLD (Puerto 5000)│   │(Supabase / Local)│
                  └──────────────────┘   └──────────────────┘
```

### Componentes de la Arquitectura:
- **Frontend (`vextor_fe`):** Single Page Application (SPA) desarrollada en React 19, Vite, Tailwind CSS v4, Framer Motion y Leaflet.
- **Backend (`vextor_be`):** API RESTful y servidor WebSocket en FastAPI (Python 3.12), SQLAlchemy ORM, validaciones Pydantic v2, autenticación JWT con cookies HttpOnly y rate-limiting en memoria.
- **Motor de Enrutamiento OSRM (`infra/osrm`):** Contenedor Docker autónomo (`ghcr.io/project-osrm/osrm-backend:v26.7.3-debian`) ejecutando el algoritmo MLD (Multi-Level Dijkstra) sobre los datos viales de Colombia.
- **Base de Datos (`vextor_bd`):** PostgreSQL (Supabase o instancia local) con identificadores únicos globales UUID v4 nativos (`gen_random_uuid()`) e integridad referencial estricta.

---

## 💻 2. Stack Tecnológico

| Capa | Tecnología / Herramienta | Versión / Detalle |
| :--- | :--- | :--- |
| **Frontend** | React | `v19.x` (Componentes funcionales, Hooks) |
| | Vite | `v6.x` (Build tool & HMR) |
| | Tailwind CSS | `v4.x` (Diseño responsivo y selector dark mode) |
| | Framer Motion | Animations & Layout transitions |
| | Leaflet / React-Leaflet | Visualización de mapas vectoriales e íconos dinámicos |
| | SweetAlert2 | Notificaciones y modales de confirmación con estilo oscuro |
| **Backend** | Python / FastAPI | Python 3.12, FastAPI `v0.141.1` |
| | SQLAlchemy | ORM `v2.0.51` |
| | Pydantic | Validación de esquemas y DTOs `v2.13.4` |
| | PyJWT & bcrypt | Firmado de tokens JWT y hashing criptográfico de claves |
| | WebSockets | Protocolo de telemetría GPS en tiempo real |
| **Infraestructura** | Docker / Docker Compose | Orquestación de contenedores Frontend, Backend y OSRM |
| | OSRM | Open Source Routing Machine (Grafo MLD Colombia) |
| | PostgreSQL | Supabase Cloud DB / PostgreSQL 15+ local |

---

## 🚀 3. Instalación Rápida Automatizada (Recomendado)

La forma más rápida y recomendada de desplegar VEXTOR completamente es utilizando el script automatizado **`setup-vextor.ps1`** en entornos Windows con **Docker Desktop**.

### Requisitos Previos:
- Windows 10/11 con **Docker Desktop** instalado y ejecutándose.
- Git.

### Pasos de Ejecución:

1. **Clonar el repositorio:**
   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd VEXTOR
   ```

2. **Ejecutar el instalador automatizado:**
   ```powershell
   .\setup-vextor.ps1
   ```

### ¿Qué realiza el script `setup-vextor.ps1` automáticamente?
1. **Verificación de Entorno:** Comprueba que Docker Engine y Docker Compose estén en ejecución.
2. **Configuración de Variables de Entorno:** Copia `.env.example` a `.env` si no existe, valida `DATABASE_URL` y autogenera una clave `JWT_SECRET_KEY` criptográfica segura de 32 bytes en Base64.
3. **Procesamiento de Grafo OSRM (Idempotente):** Descarga el archivo geográfico `colombia-latest.osm.pbf` desde Geofabrik si no está presente y ejecuta el pipeline de compilación MLD (`osrm-extract`, `osrm-partition`, `osrm-customize`) mediante el contenedor `osrm-tools`.
4. **Construcción e Inicio de Contenedores:** Levanta los servicios de Frontend (Nginx), Backend (FastAPI) y OSRM con `docker compose up -d --build`.
5. **Verificación de Salud (Healthchecks):** Realiza comprobaciones deterministas a los endpoints `http://localhost:5000`, `http://localhost:8000/`, `http://localhost:8000/api/routing/health` y `http://localhost/`.

---

## 🛠️ 4. Instalación Manual

Si prefieres ejecutar los componentes de manera independiente en desarrollo:

### 4.1 Backend (`vextor_be`)
```bash
cd vextor_be
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Ejecutar backend
uvicorn app.main:app --reload --port 8000
```

### 4.2 Frontend (`vextor_fe`)
```bash
cd vextor_fe
pnpm install
pnpm run dev
```

### 4.3 Contenedor OSRM con Docker Compose
```bash
docker compose up -d osrm
```

---

## 🔑 5. Acceso a los Servicios

- 💻 **Frontend Web App:** `http://localhost` (o `http://localhost:5173` en dev)
- ⚙️ **Backend REST API:** `http://localhost:8000`
- 📖 **Documentación Swagger / OpenAPI:** `http://localhost:8000/docs`
- 🗺️ **Motor OSRM Local:** `http://localhost:5000`

---

## 🔐 6. Autenticación, Sesiones y Control de Acceso (RBAC)

VEXTOR implementa un esquema de seguridad basado en tokens **JWT (JSON Web Tokens)** con almacenamiento en cookies `HttpOnly` (`vextor_auth_token`) y encabezados `Authorization: Bearer`.

### Roles del Sistema:
Existen tres roles predefinidos en la base de datos:

| ID Rol (UUID) | Nombre del Rol | Responsabilidades y Permisos |
| :--- | :--- | :--- |
| `11111111-2222-3333-4444-555555555551` | `Administrador` | Acceso total al sistema. Gestión de vehículos, conductores, rutas, mantenimientos, reportes, auditoría, configuración corporativa y administración de usuarios/roles. |
| `11111111-2222-3333-4444-555555555552` | `Conductor` | Acceso a sus rutas asignadas (`/driver/my-routes`), ejecución de rutas (`/driver/active-route/:id`), navegación HUD y emisión de telemetría GPS vía WebSocket. |
| `11111111-2222-3333-4444-555555555555` | `Usuario` | Rol por defecto asignado a las cuentas creadas mediante el formulario de registro público (`/register`). Acceso restringido a su perfil y configuración personal. |

### Características de Seguridad Clave:
- **Flujo de Registro:** El registro público (`POST /api/auth/register`) asigna estrictamente el rol `Usuario`. Únicamente un `Administrador` puede asignar o cambiar roles de usuarios desde el panel administrativo (`/settings`).
- **Sesiones Dinámicas:** Cada login crea un registro en la tabla `sesion_usuario` e inyecta el claim `sid` en el JWT. Los endpoints `/api/security/sessions` permiten listar sesiones activas y revocarlas individualmente o cerrar todas las demás sesiones.
- **Cambio Obligatorio de Contraseña:** El sistema soporta la bandera `requiere_cambio_clave = TRUE`. Cuando está activa, se fuerza al usuario a definir una nueva clave mediante la modal `ForcedPasswordModal` antes de acceder a la plataforma.
- **Protección Anti-Bruteforce:** Rate limiting configurable (`InMemoryRateLimiter`, 5 peticiones por 15 minutos por IP) en `/api/auth/login`, `/api/auth/register` y `/api/auth/forgot-password`.
- **Recuperación de Clave:** Flujo basado en tokens SHA-256 expirables (30 min) enviados por correo electrónico SMTP. La actualización de clave revoca automáticamente todas las sesiones activas del usuario.

---

## 🗄️ 7. Base de Datos (PostgreSQL)

La base de datos relacional persiste las entidades clave del sistema:
- **`rol` / `usuario` / `sesion_usuario`:** Identidad, roles, sesiones y control de acceso.
- **`vehiculo`:** Parque automotor con kilometraje, capacidad y control de estado.
- **`conductor`:** Datos personales, licencias de conducción colombianas y estado operativo.
- **`ruta` / `asignacion_conductor` / `asignacion_vehiculo`:** Programación logística, estados y asignaciones de flotas.
- **`seguimiento_ruta` / `historial_ubicacion`:** Puntos de telemetría GPS transmitidos por los conductores.
- **`mantenimiento`:** Órdenes de trabajo, tipo (preventivo/correctivo) y costos en COP.
- **`actividad` / `notificacion`:** Bitácora de auditoría detallada y notificaciones del sistema.
- **`empresa`:** Configuración corporativa (NIT, Razón Social, teléfono, dirección).

El script DDL con la estructura de tablas y llaves foráneas está disponible en **[`vextor_bd/vextor_bd.sql`](./vextor_bd/vextor_bd.sql)**.

---

## 🌐 8. Variables de Entorno (`.env`)

Las variables de entorno del sistema se leen centralizadamente desde el archivo **`.env`** ubicado en la raíz del repositorio (`VEXTOR/.env`), creado a partir de **`.env.example`**:

```env
# --- BASE DE DATOS POSTGRESQL (SUPABASE / LOCAL) [OBLIGATORIA] ---
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/vextor_db

# --- SEGURIDAD Y TOKEN JWT [OBLIGATORIA] ---
JWT_SECRET_KEY=clave-secreta-larga-y-aleatoria-generada-vextor-2025

# --- SERVIDOR DE ROUTING OSRM LOCAL ---
OSRM_URL=http://osrm:5000
OSRM_TIMEOUT_SECONDS=10

# --- URL DEL FRONTEND CLIENTE ---
FRONTEND_URL=http://localhost

# --- CONFIGURACIÓN PARA BUILD DEL FRONTEND (VITE) ---
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000

# API Key pública de TomTom Traffic (Opcional, para capa de tráfico en mapa)
VITE_TOMTOM_API_KEY=

# --- CONFIGURACIÓN DE CORREO ELECTRÓNICO (SMTP) ---
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-correo@gmail.com
MAIL_PASSWORD=tu-contrasena-de-aplicacion
MAIL_FROM=VEXTOR Fleet <noreply@vextor.local>
```

---

## 🗺️ 9. Enrutamiento Vial (OSRM) y Capa de Tráfico (TomTom)

### Motor OSRM Local
- VEXTOR utiliza un motor **OSRM (Open Source Routing Machine)** propio ejecutado en Docker (`vextor-osrm` en puerto 5000).
- El backend de FastAPI actúa como proxy mediante los endpoints `/api/routing/health` y `/api/routing/route`, manteniendo aislada la URL del contenedor interno.
- Calcula rutas sobre la malla vial real colombiana, retornando geometrías GeoJSON, distancias en metros y tiempos estimados de viaje en segundos.

### Capa de Tráfico TomTom (Opcional)
- El componente de mapa (`MapComponent.jsx`) soporta la superposición de capas de tráfico en tiempo real mediante **TomTom Traffic Raster Flow Tiles**.
- Se activa al configurar `VITE_TOMTOM_API_KEY` en el `.env` y alterna automáticamente entre estilos claro (`relative0`) y oscuro (`relative0-dark`) según el tema seleccionado en la aplicación.

---

## 🚗 10. Estados Operativos de Vehículos y Conductores

Para garantizar coherencia operativa, VEXTOR administra estados con reglas estricta de backend:

### Estados de Vehículos (`estado_vehiculo`):
- **`DISPONIBLE`:** El vehículo está apto para ser asignado a nuevas rutas.
- **`EN_RUTA`:** El vehículo está actualmente asignado a una ruta programada o en proceso.
- **`MANTENIMIENTO`:** El vehículo se encuentra en taller o bajo revisión técnica.
- **`INACTIVO`:** El vehículo está fuera de servicio o suspendido.

*Regla de Negocio:* Cuando un vehículo es asignado a una ruta activa o mantenimiento, su estado cambia automáticamente a `EN_RUTA` o `MANTENIMIENTO`. El backend bloquea intentos manuales de cambiar el estado a `DISPONIBLE` mientras existan asignaciones activas (retornando HTTP 400).

### Estados de Conductores (`estado_conductor`):
- Validados en la base de datos bajo la restricción `CheckConstraint`: `'DISPONIBLE'`, `'EN_RUTA'`, `'NO_DISPONIBLE'`, `'ACTIVO'`, `'INACTIVO'`, `'SUSPENDIDO'`.

### Estados de Rutas (`estado_ruta`):
- Transición estricta: `'PROGRAMADA'` ➔ `'EN_PROCESO'` ➔ `'COMPLETADA'`, `'SUSPENDIDA'` o `'CANCELADA'`.

---

## 📡 11. Tracking GPS en Tiempo Real (WebSockets)

- **Endpoint WebSocket:** `ws://localhost:8000/ws/tracking`
- **Autenticación:** Requiere token JWT mediante el parámetro de consulta `?token=...` o encabezado `Authorization`.
- **Validación de Telemetría:** Cada paquete GPS enviado por los conductores es validado con Pydantic (`LocationUpdateSchema`):
  - `lat`: Latitud (-90.0 a 90.0)
  - `lng`: Longitud (-180.0 a 180.0)
  - `speed`: Velocidad en km/h (>= 0)
  - `heading`: Ángulo de dirección (0.0° a 360.0°)
- **Persistencia y Retransmisión:** Las coordenadas se registran en `seguimiento_ruta` y `historial_ubicacion` en PostgreSQL y se retransmiten en tiempo real a la vista de monitoreo administrativo ("Conductores en Ruta").

---

## 🔌 12. Catálogo de Endpoints de la API REST

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registro de nuevo usuario (Asigna rol `Usuario`) | Pública | Cualquier rol |
| `POST` | `/api/auth/login` | Inicio de sesión, genera cookie JWT y sesión en BD | Pública | Cualquier rol |
| `POST` | `/api/auth/logout` | Cierre de sesión y revocación en BD | Requerida | Cualquier rol |
| `GET` | `/api/auth/me` | Obtener información del usuario autenticado | Requerida | Cualquier rol |
| `PUT` | `/api/auth/profile` | Actualizar nombre, teléfono o foto de perfil (Base64) | Requerida | Cualquier rol |
| `POST` | `/api/auth/forgot-password` | Solicitar enlace de recuperación por correo | Pública | Cualquier rol |
| `POST` | `/api/auth/verify-reset-token`| Verificar validez de token de recuperación | Pública | Cualquier rol |
| `POST` | `/api/auth/reset-password` | Establecer nueva contraseña con token | Pública | Cualquier rol |

### Vehículos (`/api/vehicles`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/vehicles` | Listar flota de vehículos | Requerida | Administrador |
| `POST` | `/api/vehicles` | Registrar nuevo vehículo | Requerida | Administrador |
| `PUT` | `/api/vehicles/{id}` | Actualizar vehículo | Requerida | Administrador |
| `DELETE` | `/api/vehicles/{id}` | Eliminar vehículo (con verificación de integridad) | Requerida | Administrador |

### Conductores (`/api/drivers`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/drivers` | Listar conductores registrados | Requerida | Administrador |
| `POST` | `/api/drivers` | Registrar nuevo conductor | Requerida | Administrador |
| `PUT` | `/api/drivers/{id}` | Actualizar datos de conductor o licencia | Requerida | Administrador |
| `DELETE` | `/api/drivers/{id}` | Eliminar registro de conductor | Requerida | Administrador |

### Rutas (`/api/routes`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/routes` | Listar rutas (Administrador ve todas, Conductor ve asignadas) | Requerida | Administrador / Conductor |
| `POST` | `/api/routes` | Programar nueva ruta y asignación | Requerida | Administrador |
| `PUT` | `/api/routes/{id}` | Actualizar estado o datos de ruta | Requerida | Administrador / Conductor |
| `DELETE` | `/api/routes/{id}` | Cancelar o eliminar ruta | Requerida | Administrador |

### Mantenimiento (`/api/maintenance`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | Listar órdenes de mantenimiento | Requerida | Administrador |
| `POST` | `/api/maintenance` | Registrar nueva intervención en taller | Requerida | Administrador |
| `PUT` | `/api/maintenance/{id}` | Actualizar estado o costos en COP | Requerida | Administrador |
| `DELETE` | `/api/maintenance/{id}` | Eliminar registro de mantenimiento | Requerida | Administrador |

### Usuarios y Empresa (`/api/users`, `/api/company`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Listar usuarios del sistema | Requerida | Administrador |
| `DELETE` | `/api/users/{id}` | Eliminar usuario | Requerida | Administrador |
| `GET` | `/api/company` | Consultar datos corporativos de la empresa | Requerida | Administrador |
| `PUT` | `/api/company/{id}` | Actualizar datos corporativos | Requerida | Administrador |

### Routing y Enrutamiento OSRM (`/api/routing`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/routing/health` | Estado de salud del motor OSRM interno | Requerida | Cualquier rol |
| `POST` | `/api/routing/route` | Solicitud de cálculo de ruta vial GeoJSON | Requerida | Cualquier rol |

### Auditoría y Seguridad (`/api/audit`, `/api/security`)
| Método | Endpoint | Descripción | Auth | Rol |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit/activity` | Consultar bitácora de actividades del sistema | Requerida | Administrador |
| `GET` | `/api/notifications` | Listar notificaciones del usuario autenticado | Requerida | Cualquier rol |
| `GET` | `/api/security/sessions` | Listar sesiones activas del usuario autenticado | Requerida | Cualquier rol |
| `DELETE` | `/api/security/sessions/{id}` | Revocar una sesión específica | Requerida | Cualquier rol |
| `POST` | `/api/security/change-password` | Cambiar contraseña del usuario autenticado | Requerida | Cualquier rol |

---

## 📁 13. Estructura del Repositorio

```text
VEXTOR/
├── docs/                 # Documentación técnica (Arquitectura, API, DB, Flujos, Seguridad, OSRM)
│   ├── API.md            # Especificación de endpoints REST y WebSockets
│   ├── ARCHITECTURE.md   # Diagramas de arquitectura y capas
│   ├── DATABASE.md       # Esquema del modelo relacional PostgreSQL
│   ├── DEPENDENCIES.md   # Inventario de librerías
│   ├── FLOWS.md          # Diagramas de flujo funcionales end-to-end
│   ├── OSRM.md           # Guía de OSRM, Docker y grafos viales
│   ├── SECURITY.md       # Esquema de seguridad JWT y RBAC
│   ├── README.md         # Índice técnico de documentación
│   └── backlog/          # Requisitos funcionales, no funcionales e historias de usuario
├── infra/                # Datos de mapas y volumen OSRM
│   └── osrm/data/        # Grafo MLD procesado (.osm.pbf, .osrm)
├── vextor_bd/            # DDL SQL y scripts de base de datos
│   ├── Readme.md         # Documentación de base de datos
│   └── vextor_bd.sql     # Script SQL con esquema y roles predefinidos
├── vextor_be/            # Backend FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/routes/   # Endpoints API (auth, crud, routing, audit)
│   │   ├── core/         # Configuración, seguridad, rate limiter, excepciones
│   │   ├── database/     # Conexión SQLAlchemy y generador de sesión DB
│   │   ├── models/       # Modelos relacionales ORM
│   │   ├── schemas/      # Validaciones y DTOs Pydantic
│   │   ├── services/     # Lógica de negocio (auth, crud, audit, osrm, email)
│   │   ├── websocket/    # Administrador y endpoint de WebSockets para GPS
│   │   └── main.py       # Punto de entrada de FastAPI
│   ├── tests/            # Suite de pruebas automatizadas con pytest
│   ├── Dockerfile        # Dockerfile backend
│   └── requirements.txt  # Dependencias de Python
├── vextor_fe/            # Frontend React 19 (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/   # Componentes reutilizables UI y Layout
│   │   ├── config/       # Configuración global de API y WebSockets (api.js)
│   │   ├── context/      # Contextos globales (AuthContext, ThemeContext)
│   │   ├── hooks/        # Custom React Hooks
│   │   ├── layouts/      # DashboardLayout wrapper
│   │   ├── pages/        # Vistas de la aplicación (Dashboard, Vehicles, Drivers, Routes, etc.)
│   │   ├── routes/       # React Router SPA (AppRouter, ProtectedRoute)
│   │   └── services/     # Clientes HTTP por módulo
│   ├── Dockerfile        # Dockerfile multi-stage con Nginx
│   ├── nginx.conf        # Configuración Nginx con fallback SPA
│   └── package.json      # Dependencias frontend
├── .env.example          # Plantilla oficial de variables de entorno
├── .gitignore            # Exclusión de credenciales y binarios pesados de OSRM
├── docker-compose.yml    # Orquestador Docker Compose (Frontend + Backend + OSRM)
├── GUIA_INSTALACION.md   # Guía paso a paso para instalación y despliegue
├── README.md             # Documentación principal de VEXTOR
└── setup-vextor.ps1      # Script automatizado de despliegue completo
```

---

## 👤 14. Flujos de Usuario Principales

### Flujo de Usuario Estándar:
```text
  Registro Público (/register)
           │
           ▼ (Asigna rol 'Usuario')
  Inicio de Sesión (/login)
           │
           ▼
  Ajustes de Cuenta (/settings) ──► Modificar Perfil / Cambiar Contraseña
```

### Flujo de Conductor:
```text
  Inicio de Sesión (/login)
           │
           ▼
  Mis Rutas Asignadas (/driver/my-routes)
           │
           ▼
  Selección de Ruta Activa (/driver/active-route/:id)
           │
           ▼
  Inicio de Navegación ──► Emisión de Telemetría GPS en tiempo real (/ws/tracking)
```

### Flujo de Administrador:
```text
  Inicio de Sesión (/login)
           │
           ▼
  Dashboard Principal (/dashboard)
           │
 ┌─────────┼───────────────┬─────────────────┬────────────────┐
 ▼         ▼               ▼                 ▼                ▼
Vehículos  Conductores     Rutas             Mantenimiento    Reportes & Configuración
(/vehicles)(/drivers)      (/routes)         (/maintenance)   (/reports, /settings)
                           (Monitoreo GPS                     (Gestión de Usuarios,
                            en tiempo real)                    Empresa y Auditoría)
```

---

## 🧪 15. Pruebas y Verificación

### Backend (Pytest)
```bash
PYTHONPATH=vextor_be DATABASE_URL="sqlite:///:memory:" JWT_SECRET_KEY="testsecretkey" pytest vextor_be/tests
```

### Frontend (Build & Verification)
```bash
cd vextor_fe
pnpm run build
```

---

## 🚨 16. Solución de Problemas Frecuentes (Troubleshooting)

- **Error "Docker Desktop is not running":** Abre Docker Desktop en Windows y espera a que el icono se ponga en verde.
- **Conflicto de Puertos (`80`, `8000`, `5000`):** Asegúrate de que no haya otros servicios ejecutándose en dichos puertos antes de iniciar Docker Compose.
- **Error en la base de datos Supabase:** Confirma que la variable `DATABASE_URL` en `.env` contenga la clave y host correctos y que tu red tenga acceso saliente al puerto PostgreSQL (5432 o 6543).
- **El mapa no genera rutas viales:** Verifica el estado de OSRM accediendo a `http://localhost:8000/api/routing/health`. Si la respuesta es `offline`, revisa los logs del contenedor con `docker compose logs osrm`.
