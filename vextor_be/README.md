# Documentación Técnica del Backend - VEXTOR (`vextor_be`)

El backend de VEXTOR está desarrollado en **Python 3.12** utilizando **FastAPI** como framework web de alto rendimiento, **SQLAlchemy** como ORM para la interacción relacional con PostgreSQL y **Pydantic v2** para la validación y serialización de esquemas de datos.

---

## 1. Estructura de Archivos del Backend

```text
vextor_be/
├── app/
│   ├── api/                # Enrutadores HTTP REST
│   │   ├── routes/
│   │   │   ├── audit.py    # Bitácora de actividades, notificaciones, cambio de clave y sesiones
│   │   │   ├── auth.py     # Endpoints de autenticación, login, logout, registro, perfil y password reset
│   │   │   ├── crud.py     # Operaciones CRUD para vehículos, conductores, rutas, mantenimiento, usuarios y empresa
│   │   │   └── routing.py  # Endpoints de proxy para health y enrutamiento vial OSRM
│   ├── core/               # Configuración centralizada y utilidades de seguridad
│   │   ├── config.py       # Lectura de variables de entorno desde el archivo raíz .env
│   │   ├── exceptions.py   # Manejadores de excepciones globales
│   │   ├── rate_limiter.py # Limitador de tasa en memoria (InMemoryRateLimiter)
│   │   └── security.py     # Hashing bcrypt y generación/decodificación de tokens JWT
│   ├── database/           # Configuración del ORM SQLAlchemy
│   │   ├── connection.py   # Declaración de Base y creación del motor (engine)
│   │   └── session.py      # Generador de sesión get_db y SessionLocal
│   ├── external/           # Clientes HTTP hacia servicios externos
│   │   └── osrm_client.py  # Cliente aislado para el motor OSRM
│   ├── models/             # Modelos de base de datos relacional (SQLAlchemy)
│   │   ├── audit.py        # Modelos Actividad y Notificación
│   │   ├── company.py      # Modelo Empresa
│   │   ├── driver.py       # Modelo Conductor
│   │   ├── maintenance.py  # Modelo Mantenimiento
│   │   ├── report.py       # Modelo Reporte
│   │   ├── route.py        # Modelos Ruta, AsignacionConductor, AsignacionVehiculo y Novedad
│   │   ├── tracking.py     # Modelos SeguimientoRuta e HistorialUbicacion
│   │   ├── user.py         # Modelos Rol, Usuario y SesionUsuario
│   │   └── vehicle.py      # Modelo Vehiculo
│   ├── schemas/            # Esquemas de validación Pydantic v2 (DTOs)
│   ├── services/           # Capa de lógica de negocio y servicios
│   │   ├── audit_service.py # Registro automático de auditoría
│   │   ├── auth_service.py  # Autenticación, JWT, sesiones y reseteo de clave
│   │   ├── crud_services.py # Lógica de negocio y sincronización automática de estados
│   │   ├── email_service.py # Envío de correos por SMTP (Gmail / SMTP custom)
│   │   └── osrm_service.py  # Procesamiento de respuestas de routing
│   ├── utils/              # Funciones auxiliares (parseo IP, user-agent, iniciales avatar)
│   ├── websocket/          # Canales WebSocket para telemetría en tiempo real
│   │   ├── manager.py      # Administrador de conexiones activas WebSocket
│   │   └── tracking.py     # Endpoint /ws/tracking y validación Pydantic GPS
│   └── main.py             # Punto de entrada de FastAPI, CORS, middlewares y montaje de routers
├── tests/                  # Suite de pruebas automatizadas unitarias e integración con pytest
├── Dockerfile              # Dockerfile del backend
└── requirements.txt        # Dependencias de Python con versiones fijadas
```

---

## 2. Descripción de Componentes Clave

| Componente | Propósito / Responsabilidad | Archivos Relacionados |
| :--- | :--- | :--- |
| `app/main.py` | Configura FastAPI, habilita CORS, ejecuta migraciones de constraints al iniciar e incluye APIRouters. | `app/api/routes/` |
| `app/database/` | Maneja la conexión con PostgreSQL (`DATABASE_URL`) y expone el generador de sesión `get_db`. | `connection.py`, `session.py` |
| `app/models/` | Define el mapeo objeto-relacional para todas las tablas relacionales. | `app/database/connection.py` |
| `app/schemas/` | Define esquemas Pydantic con validadores colombianos (placas, celulares, cédulas). | `app/api/routes/` |
| `app/api/routes/auth.py` | Controla autenticación JWT, registro (asigna rol `Usuario`), login, logout y perfil. | `app/services/auth_service.py` |
| `app/api/routes/crud.py` | Aloja operaciones CRUD con RBAC (`require_admin`), paginación y auditoría automática. | `app/services/crud_services.py` |
| `app/websocket/tracking.py` | Endpoint WebSocket `/ws/tracking` para recepción de GPS y retransmisión en tiempo real. | `app/websocket/manager.py` |
| `app/core/rate_limiter.py` | Limita peticiones por IP en endpoints de autenticación para mitigar ataques por fuerza bruta. | `app/api/routes/auth.py` |

---

## 3. Configuración y Ejecución Local

### Requisitos Previos
- Python 3.12+
- Instancia de PostgreSQL (Supabase o Local)

### Instalación de Dependencias
```bash
cd vextor_be
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de Entorno (`.env`)
Las variables de entorno se leen centralizadamente desde el archivo `.env` ubicado en la raíz del repositorio (`VEXTOR/.env`):
```env
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/vextor_db
JWT_SECRET_KEY=tu_clave_secreta_super_segura
OSRM_URL=http://osrm:5000
OSRM_TIMEOUT_SECONDS=10
FRONTEND_URL=http://localhost

# Configuración de Correo (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_correo@gmail.com
MAIL_PASSWORD=tu_password_de_aplicacion
MAIL_FROM=VEXTOR Fleet <noreply@vextor.local>
```

### Ejecutar Servidor Backend
```bash
uvicorn app.main:app --reload --port 8000
```
La documentación interactiva OpenAPI (Swagger) estará disponible en: `http://localhost:8000/docs`

---

## 🧪 4. Ejecución de Pruebas

Para ejecutar la suite de pruebas unitarias e integración con pytest en memoria:

```bash
PYTHONPATH=vextor_be DATABASE_URL="sqlite:///:memory:" JWT_SECRET_KEY="testsecretkey" pytest vextor_be/tests
```
