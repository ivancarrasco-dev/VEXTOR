# VEXTOR - Plataforma SaaS de Gestión de Flotas Vehiculares y Monitoreo Logístico

[![React 19](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.12)-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791.svg)](https://www.postgresql.org/)
[![Docker OSRM](https://img.shields.io/badge/Routing-OSRM%20Docker-orange.svg)](https://project-osrm.org/)

**VEXTOR** es una solución web SaaS de nivel empresarial para el control, monitoreo, mantenimiento y optimización de flotas vehiculares y logística de transporte. Permite a las empresas rastrear vehículos en tiempo real vía GPS/WebSockets, asignar y monitorear rutas sobre mapas interactivos con enrutamiento vial OSRM local, gestionar conductores con licenciamiento colombiano, controlar órdenes de mantenimiento en Pesos Colombianos (`COP`), consultar bitácoras de auditoría y generar reportes analíticos con exportación binaria en PDF, Excel y CSV.

---

## 1. Visión General y Arquitectura del Sistema

```text
                               ┌──────────────────────────┐
                               │     Usuario / Navegador  │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │  VEXTOR React 19 Frontend│
                               │   (Tailwind CSS v4 SPA)  │
                               └──────┬────────────▲──────┘
                                      │            │
                           HTTP REST  │            │ WebSockets
                          (Cookies)   │            │ (/ws/tracking)
                                      ▼            │
                               ┌──────────────────────────┐
                               │     FastAPI Backend      │
                               │   (Python 3.12 + ORM)    │
                               └──────┬────────────┬──────┘
                                      │            │
                 HTTP Local           │            │ Connection Pool
                 (Port 5000)          ▼            ▼ (psycopg)
                        ┌──────────────────┐  ┌──────────────────────┐
                        │   OSRM Docker    │  │ Supabase PostgreSQL  │
                        │  (Grafo Colombia)│  │ (Base de Datos SaaS) │
                        └──────────────────┘  └──────────────────────┘
```

### Principales Componentes:
- **Frontend (`vextor_fe`):** Single Page Application construida en React 19, Vite, Tailwind CSS v4, Framer Motion y Leaflet.
- **Backend (`vextor_be`):** API REST y servidor WebSocket en FastAPI (Python 3.12) con validaciones Pydantic v2, autenticación JWT con bcrypt y proxy seguro hacia OSRM.
- **Motor OSRM (`infra/osrm`):** Contenedor Docker con el motor Open Source Routing Machine ejecutando el algoritmo MLD sobre los datos geográficos de Colombia.
- **Base de Datos (`vextor_bd`):** PostgreSQL alojado en Supabase con UUID v4 nativos (`gen_random_uuid()`) e integridad referencial estricta.

---

## 2. Módulos y Funcionalidades

- 📊 **Dashboard Consolidado:** Resumen métrico de flota, gráficos con cálculo de varianzas históricas y bitácora de actividad reciente.
- 🚛 **Gestión de Vehículos (`/vehiculos`):** Control del parque automotor, placas colombianas (`AAA-123`), capacidades de carga y validación de borrado seguro.
- 👨‍✈️ **Administración de Conductores (`/conductores`):** Cédulas de ciudadanía, celulares colombianos, categorías de licencia (`A1`-`C3`) y disponibilidad operativa.
- 🗺️ **Rutas y Telemetría GPS en Tiempo Real (`/rutas`, `/driver/active-route`):** Planificación de rutas viales con OSRM, panel del conductor touch-friendly y transmisión GPS en tiempo real por WebSockets (`/ws/tracking`).
- 🔧 **Control de Mantenimiento (`/mantenimientos`):** Registro de intervenciones preventivas y correctivas en Pesos Colombianos (`COP`).
- 📈 **Centro de Reportes (`/reportes`):** Consola de análisis con exportación binaria a PDF, CSV y Excel (`.xlsx`).
- ⚙️ **Configuración Modular (`/configuracion`):** Gestión de perfil, seguridad, usuarios, empresa, auditoría de actividades y revocación remota de sesiones.

---

## 3. Estructura Completa del Repositorio

```text
VEXTOR/
├── docs/                 # Documentación técnica profunda (Arquitectura, API, DB, Flujos, Seguridad, OSRM, Dependencias)
│   ├── API.md            # Especificación de endpoints REST y WebSockets
│   ├── ARCHITECTURE.md   # Diagramas de arquitectura y flujos de routing/tracking
│   ├── DATABASE.md       # Esquema del modelo relacional PostgreSQL
│   ├── DEPENDENCIES.md   # Inventario exhaustivo de librerías e imports reales
│   ├── FLOWS.md          # Diagramas de flujo funcionales end-to-end
│   ├── OSRM.md           # Guía completa de OSRM, Docker y grafos viales
│   ├── SECURITY.md       # Esquema de autenticación JWT, RBAC y sesiones
│   └── README.md         # Índice general de documentación técnica
├── infra/                # Infraestructura de servicios y contenedores
│   └── osrm/             # Docker Compose y datos del mapa de Colombia
│       └── docker-compose.yml
├── vextor_bd/            # DDL SQL y scripts del esquema PostgreSQL
│   ├── Readme.md
│   └── vextor_bd.sql
├── vextor_be/            # Backend FastAPI (Python 3.12)
│   ├── main.py           # Punto de entrada de FastAPI
│   ├── database.py       # Conexión SQLAlchemy a PostgreSQL
│   ├── models.py         # Modelos relacionales ORM
│   ├── schemas.py        # Esquemas de validación Pydantic
│   ├── router_*.py       # Módulos de la API REST y WebSockets
│   ├── services/         # Clientes de servicios (OsrmClient)
│   ├── requirements.txt  # Dependencias Python con versiones fijadas
│   └── README.md         # Documentación detallada del backend
├── vextor_fe/            # Frontend React 19 (Tailwind CSS v4)
│   ├── src/              # Código fuente de componentes, páginas, hooks y servicios
│   ├── package.json      # Dependencias de pnpm / npm
│   └── README.md         # Documentación detallada del frontend
├── .env.example          # Plantilla de variables de entorno
├── .gitignore            # Archivos ignorados por Git
├── GUIA_INSTALACION.md   # Guía paso a paso para instalación desde cero en un PC nuevo
├── README.md             # Este archivo
└── setup-osrm.ps1        # Script PowerShell automatizado para preparación de OSRM
```

---

## 4. Requisitos del Sistema

- **Node.js:** Versión 20+ y `pnpm` (`npm install -g pnpm`).
- **Python:** Versión 3.12+.
- **Docker Desktop:** Habilitado con contenedores Linux para ejecutar OSRM.
- **Git:** Control de versiones.

---

## 5. Instalación Rápida

Para una guía paso a paso ultra detallada pensada para nuevos miembros del equipo, consulta **[GUIA_INSTALACION.md](./GUIA_INSTALACION.md)**.

### Resumen de comandos:

1. **Configurar el motor de mapas OSRM con Docker:**
   ```powershell
   .\setup-osrm.ps1
   ```

2. **Configurar variables de entorno (`vextor_be/.env`):**
   ```powershell
   Copy-Item .env.example vextor_be\.env
   ```

3. **Iniciar Backend FastAPI:**
   ```bash
   cd vextor_be
   python -m venv venv
   .\venv\Scripts\activate   # En Linux/macOS: source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. **Iniciar Frontend React:**
   ```bash
   cd vextor_fe
   pnpm install
   pnpm run dev
   ```

Accede a la aplicación en `http://localhost:5173`.

---

## 6. Variables de Entorno (`vextor_be/.env`)

| Variable | Propósito | Valor por Defecto Local |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Supabase o local). | `postgresql+psycopg://user:pass@localhost:5432/vextor_db` |
| `JWT_SECRET_KEY` | Clave secreta para la firma de tokens JWT. | `reemplaza-esta-clave-por-un-secreto-largo` |
| `OSRM_URL` | Dirección del contenedor OSRM local utilizado por FastAPI. | `http://localhost:5000` |
| `OSRM_TIMEOUT_SECONDS` | Tiempo límite de espera para respuestas de OSRM. | `10` |
| `FRONTEND_URL` | URL del cliente web para enlaces de recuperación. | `http://localhost:5173` |

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

- **Docker no responde / `docker info` falla:**
  Asegúrate de tener **Docker Desktop** abierto y que el motor indique "Docker Desktop is running".
- **El puerto 5000 está ocupado:**
  Averigua qué proceso usa el puerto (`netstat -ano | findstr :5000` en Windows) o cambia el puerto externo en `infra/osrm/docker-compose.yml` y ajusta `OSRM_URL` en `.env`.
- **FastAPI no se conecta a OSRM (`503 Service Unavailable`):**
  Ejecuta `.\setup-osrm.ps1` o verifica el estado del contenedor con `docker compose -f infra/osrm/docker-compose.yml ps`.
- **FastAPI no se conecta a PostgreSQL:**
  Verifica que tu conexión a Internet esté activa si usas Supabase y que la clave en `DATABASE_URL` sea correcta.
- **El frontend no puede comunicarse con el backend:**
  Confirma que FastAPI esté ejecutándose en `http://localhost:8000`.

---

## 8. Documentación Adicional

- 📖 [Guía Paso a Paso de Instalación desde Cero](./GUIA_INSTALACION.md)
- 🏗️ [Arquitectura del Sistema y Flujos](./docs/ARCHITECTURE.md)
- 🗺️ [Guía de OSRM, Docker y Grafos Viales](./docs/OSRM.md)
- 📦 [Inventario de Dependencias e Imports](./docs/DEPENDENCIES.md)
- 🔌 [Especificación de API REST & WebSockets](./docs/API.md)
- 🗄️ [Modelo de Base de Datos PostgreSQL](./docs/DATABASE.md)
- 🔒 [Seguridad, JWT y RBAC](./docs/SECURITY.md)
