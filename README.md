# VEXTOR - Plataforma SaaS de Gestión de Flotas Vehiculares y Monitoreo Logístico

[![React 19](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.12)-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791.svg)](https://www.postgresql.org/)
[![Docker OSRM](https://img.shields.io/badge/Docker-Full%20Stack%20Containerized-orange.svg)](https://www.docker.com/)

**VEXTOR** es una solución web SaaS de nivel empresarial para el control, monitoreo, mantenimiento y optimización de flotas vehiculares y logística de transporte. Permite a las empresas rastrear vehículos en tiempo real vía GPS/WebSockets, asignar y monitorear rutas sobre mapas interactivos con enrutamiento vial OSRM local, gestionar conductores con licenciamiento colombiano, controlar órdenes de mantenimiento en Pesos Colombianos (`COP`), consultar bitácoras de auditoría y generar reportes analíticos con exportación binaria en PDF, Excel y CSV.

---

## 1. Visión General y Arquitectura del Sistema

```text
                  ┌───────────────┐
                  │   FRONTEND    │ (React 19 + Nginx en Puerto 80)
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    BACKEND    │ (FastAPI en Puerto 8000)
                  │    FASTAPI    │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │     OSRM      │ (Motor OSRM Colombia MLD en Puerto 5000)
                  └───────────────┘

                  BACKEND
                     │
                     ▼
                  SUPABASE (PostgreSQL Persistente en la Nube)
```

### Principales Componentes:
- **Frontend (`vextor_fe`):** Single Page Application construida en React 19, Vite, Tailwind CSS v4, Framer Motion y Leaflet, servida mediante Nginx en contenedor Docker.
- **Backend (`vextor_be`):** API REST y servidor WebSocket en FastAPI (Python 3.12) con validaciones Pydantic v2, autenticación JWT con bcrypt y proxy seguro hacia OSRM.
- **Motor OSRM (`infra/osrm`):** Contenedor Docker con el motor Open Source Routing Machine ejecutando el algoritmo MLD sobre los datos geográficos de Colombia.
- **Base de Datos (`vextor_bd`):** PostgreSQL alojado en Supabase con UUID v4 nativos (`gen_random_uuid()`) e integridad referencial estricta.

---

## 2. Instalación Ultra Rápida en un Comando

Para poner a funcionar toda la plataforma VEXTOR en un computador nuevo con **Docker Desktop** instalado:

1. **Clonar el repositorio:**
   ```powershell
   git clone <URL_REPOSITORIO_VEXTOR>
   cd VEXTOR
   ```

2. **Ejecutar el script preparador e instalador:**
   ```powershell
   .\setup-vextor.ps1
   ```

El script verificará Docker, creará `.env` desde `.env.example`, descargará el mapa de Colombia, procesará el grafo vial OSRM MLD (si no existe), construirá los contenedores de Frontend, Backend y OSRM, los iniciará con Docker Compose y ejecutará pruebas de salud automáticas.

Para una guía detallada paso a paso, consulta **[GUIA_INSTALACION.md](./GUIA_INSTALACION.md)**.

---

## 3. Acceso a los Servicios

- 💻 **Frontend Web App:** `http://localhost` (o `http://localhost:5173`)
- ⚙️ **Backend REST API:** `http://localhost:8000`
- 📖 **Documentación Swagger:** `http://localhost:8000/docs`
- 🗺️ **Motor OSRM Local:** `http://localhost:5000`

---

## 4. Estructura Completa del Repositorio

```text
VEXTOR/
├── docs/                 # Documentación técnica profunda (Arquitectura, API, DB, Flujos, Seguridad, OSRM)
│   ├── API.md            # Especificación de endpoints REST y WebSockets
│   ├── ARCHITECTURE.md   # Diagramas de arquitectura y flujos
│   ├── DATABASE.md       # Esquema del modelo relacional PostgreSQL
│   ├── DEPENDENCIES.md   # Inventario de librerías
│   ├── FLOWS.md          # Diagramas de flujo funcionales end-to-end
│   ├── OSRM.md           # Guía completa de OSRM, Docker y grafos viales
│   ├── SECURITY.md       # Esquema de autenticación JWT y RBAC
│   └── README.md         # Índice general de documentación
├── infra/                # Infraestructura Docker y datos de mapas OSRM
│   └── osrm/             # Volumen y datos de mapa de Colombia
├── vextor_bd/            # DDL SQL y scripts del esquema PostgreSQL
│   ├── Readme.md
│   └── vextor_bd.sql
├── vextor_be/            # Backend FastAPI (Python 3.12)
│   ├── Dockerfile        # Dockerfile del backend
│   ├── main.py           # Punto de entrada de FastAPI
│   ├── database.py       # Conexión SQLAlchemy a PostgreSQL
│   └── requirements.txt  # Dependencias Python
├── vextor_fe/            # Frontend React 19 (Tailwind CSS v4)
│   ├── Dockerfile        # Dockerfile multi-stage con Nginx
│   ├── nginx.conf        # Configuración de Nginx y React Router SPA
│   ├── src/              # Código fuente de React
│   └── package.json      # Dependencias frontend
├── .env.example          # Plantilla oficial de variables de entorno
├── .gitignore            # Exclusión de credenciales y datos pesados de OSRM
├── docker-compose.yml    # Orquestador principal Docker Compose (Frontend + Backend + OSRM)
├── GUIA_INSTALACION.md   # Guía paso a paso para instalación y despliegue
├── README.md             # Documentación general de VEXTOR
└── setup-vextor.ps1      # Script automatizado de despliegue completo de VEXTOR
```

---

## 5. Variables de Entorno (`.env`)

| Variable | Propósito | Valor por Defecto Docker |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL de Supabase. | `postgresql+psycopg://user:pass@host:5432/postgres` |
| `JWT_SECRET_KEY` | Clave secreta para la firma de tokens JWT. | `clave-secreta-larga-vextor-2025` |
| `OSRM_URL` | Dirección del contenedor OSRM interno utilizado por FastAPI. | `http://osrm:5000` |
| `OSRM_TIMEOUT_SECONDS` | Tiempo límite de espera para respuestas de OSRM. | `10` |
| `FRONTEND_URL` | URL del cliente web. | `http://localhost` |

---

## 6. Comandos Útiles de Docker

- **Ver estado de los contenedores:** `docker compose ps`
- **Ver logs en tiempo real:** `docker compose logs -f`
- **Detener la aplicación:** `docker compose down`
- **Reiniciar la aplicación:** `docker compose restart`
- **Reconstruir contenedores:** `docker compose up -d --build`

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

- **Docker no responde (`docker info` falla):** Abre **Docker Desktop** desde el menú Inicio y espera a que indique "Docker Desktop is running".
- **Conflicto de puertos (80, 8000 o 5000):** Cierra otras aplicaciones que ocupen dichos puertos o edita los mapeos en `docker-compose.yml`.
- **FastAPI no conecta a Supabase:** Revisa que `.env` contenga la contraseña y host correctos en `DATABASE_URL` y que tengas acceso a internet.
- **OSRM no responde o da timeout:** Revisa los logs con `docker compose logs osrm` o borra los datos binarios de `infra/osrm/data/` (dejando `.gitignore`) y vuelve a ejecutar `.\setup-vextor.ps1`.
