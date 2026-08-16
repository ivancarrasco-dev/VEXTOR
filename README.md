# VEXTOR - Plataforma SaaS de Gestión de Flotas Vehiculares

[![React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.12)-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)

**VEXTOR** es una solución web SaaS de nivel empresarial para el control, monitoreo, mantenimiento y optimización de flotas vehiculares y logística de transporte. Permite a las empresas rastrear vehículos en tiempo real vía GPS/WebSockets, asignar y monitorear rutas sobre mapas interactivos, gestionar conductores con licenciamiento colombiano, controlar órdenes de mantenimiento en COP, consultar bitácoras de auditoría y generar reportes analíticos con exportación binaria en PDF, Excel y CSV.

---

## 1. Visión General del Sistema

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
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │   PostgreSQL Database    │
                               │  (Supabase / Native DDL) │
                               └──────────────────────────┘
```

---

## 2. Módulos y Funcionalidades

### 📊 Dashboard Consolidado
- Resumen de métricas de flota (Total vehículos, activos, disponibles, en mantenimiento).
- Gráficos de tendencias con cálculo de varianza respecto a periodos anteriores.
- Registro de actividad reciente en tiempo real.

### 🚛 Gestión de Vehículos (`/vehiculos`)
- Inventario completo del parque automotor (Marca, modelo, año, placa en formato colombiano `AAA-123`, capacidad de carga en kg).
- Transición automática de estados (`DISPONIBLE`, `EN_RUTA`, `EN_MANTENIMIENTO`, `INACTIVO`).
- Validación de borrado seguro (impide eliminar vehículos asociados a rutas o mantenimientos activos).

### 👨‍✈️ Administración de Conductores (`/conductores`)
- Registro de conductores con cédula de ciudadanía, teléfono móvil y licencia de conducción colombiana (`A1`, `A2`, `B1`, `B2`, `B3`, `C1`, `C2`, `C3`).
- Control de fechas de vencimiento de pases y disponibilidad operativa (`DISPONIBLE`, `EN_RUTA`, `NO_DISPONIBLE`).

### 🗺️ Rutas y Telemetría GPS en Tiempo Real (`/rutas`, `/driver/active-route`)
- Asignación de rutas logísticas con autocompletado geográfico vía OpenStreetMap Nominatim.
- Panel exclusivo del conductor touch-friendly para iniciar/completar viajes.
- Telemetría GPS en tiempo real mediante **WebSockets** (`/ws/tracking`) con fallback HTTP.
- Mapa interactivo Leaflet con tema dinámico claro/oscuro y velocímetro.

### 🔧 Control de Mantenimiento (`/mantenimientos`)
- Programación de intervenciones preventivas y correctivas.
- Registro de costos financieros expresados en Pesos Colombianos (`COP`).
- Control de talleres y estados de orden de trabajo.

### 📈 Centro de Reportes (`/reportes`)
- Consola de análisis de datos filtrada por rango de fechas y módulos.
- Exportación binaria de informes en PDF, CSV y Microsoft Excel (`.xlsx`).

### ⚙️ Configuración del Sistema (`/configuracion`)
- Arquitectura altamente modularizada en subsecciones (Perfil, Seguridad, Usuarios, Empresa, Auditoría, Notificaciones, Apariencia, Respaldos).
- Gestión de sesiones activas del usuario (`sesion_usuario`) con revocación remota de dispositivos.
- Modificación de datos corporativos (NIT, Razón Social).

---

## 3. Estructura del Proyecto

```text
vextor/
├── docs/                 # Documentación técnica completa (Arquitectura, API, DB, Flujos, Seguridad)
├── vextor_bd/           # Scripts DDL de PostgreSQL y esquema de base de datos
├── vextor_be/           # Código fuente del Backend FastAPI (Python 3.12)
└── vextor_fe/           # Código fuente del Frontend React 19 (Tailwind CSS v4)
```

---

## 4. Tecnologías Utilizadas

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, Leaflet, Lucide React, SweetAlert2.
- **Backend:** FastAPI, Python 3.12, SQLAlchemy, Pydantic v2, PyJWT, bcrypt, WebSockets, Uvicorn.
- **Base de Datos:** PostgreSQL con UUID v4 nativos.

---

## 5. Instalación y Puesta en Marcha

### 5.1 Requisitos Previos
- Node.js 20+ y `pnpm`
- Python 3.12+
- Servidor PostgreSQL

### 5.2 Configuración del Backend (`vextor_be`)
```bash
cd vextor_be
python -m venv venv
source venv/bin/activate # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5.3 Configuración del Frontend (`vextor_fe`)
```bash
cd vextor_fe
pnpm install
pnpm run dev
```
La aplicación abrirá en `http://localhost:5173`.

---

## 6. Documentación Técnica Detallada

Para consultar la documentación profunda de cada capa:

- 📖 [Documentación Técnica General](./docs/README.md)
- 🏗️ [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- 🔌 [Referencia de API REST & WebSockets](./docs/API.md)
- 🗄️ [Modelo de Base de Datos PostgreSQL](./docs/DATABASE.md)
- 🔄 [Flujos de Trabajo End-to-End](./docs/FLOWS.md)
- 🔒 [Seguridad y Permisos RBAC](./docs/SECURITY.md)
- 💻 [Documentación de Frontend (`vextor_fe`)](./vextor_fe/README.md)
- 🐍 [Documentación de Backend (`vextor_be`)](./vextor_be/README.md)
- 🛢️ [Documentación de BD (`vextor_bd`)](./vextor_bd/Readme.md)
