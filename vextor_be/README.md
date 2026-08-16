# Documentación Técnica del Backend - VEXTOR (`vextor_be`)

El backend de VEXTOR está desarrollado en **Python 3.12** utilizando **FastAPI** como framework web de alto rendimiento, **SQLAlchemy** como ORM para la interacción con PostgreSQL y **Pydantic v2** para la validación y serialización de esquemas de datos.

---

## 1. Estructura de Archivos del Backend

```text
vextor_be/
├── main.py                 # Punto de entrada de FastAPI, configuración de CORS, middlewares y montaje de routers
├── database.py             # Configuración del motor SQLAlchemy (Engine, SessionLocal) y conexión a PostgreSQL
├── models.py               # Modelos de base de datos relacional ORM (SQLAlchemy)
├── schemas.py              # Esquemas de datos Pydantic para Request/Response y validaciones
├── router_auth.py          # Endpoints de autenticación, login, logout, registro, perfil y recuperación de contraseña
├── router_vehicles.py      # CRUD de vehículos, filtrado y validación de borrado seguro
├── router_drivers.py       # CRUD de conductores, licencias y estados operativos
├── router_routes.py        # Gestión de rutas, asignación, estados y servidor WebSocket para GPS (/ws/tracking)
├── router_maintenance.py   # Registro de mantenimientos preventivos/correctivos en COP
├── router_reports.py       # Generación de reportes tabulares y exportación binaria (PDF, CSV, Excel)
├── router_company.py       # Configuración y consulta de información corporativa
├── router_users.py         # Administración de usuarios del sistema y asignación de roles (Exclusivo Administrador)
├── router_activities.py    # Bitácora de auditoría y registros de actividad del sistema
├── router_security.py      # Gestión de sesiones activas del usuario y revocación de dispositivos
├── email_utils.py          # Utilidad para envío de correos SMTP y generación de tokens de recuperación
├── email_service.py        # Servicio complementario de correo electrónico
└── requirements.txt        # Dependencias de Python con versiones fijadas
```

---

## 2. Descripción de Archivos Clave

| Archivo | Tipo | Propósito / Responsabilidad | Archivos / Componentes Relacionados |
| :--- | :--- | :--- | :--- |
| `main.py` | Entrada | Configura FastAPI, habilita CORS, maneja errores globales e incluye todos los APIRouters. | Todos los `router_*.py` |
| `database.py` | Config / DB | Maneja el SessionLocal de SQLAlchemy, conecta con `DATABASE_URL` y provee el generador `get_db`. | `models.py`, `router_*.py` |
| `models.py` | Modelos | Define los mapeos objeto-relacional para `Usuario`, `Rol`, `Vehiculo`, `Conductor`, `Ruta`, `SeguimientoRuta`, etc. | `database.py`, `schemas.py` |
| `schemas.py` | Schemas | Validaciones Pydantic de entrada/salida para la API, incluyendo validadores de placas, celulares y cédulas. | `models.py`, `router_*.py` |
| `router_auth.py` | Router | Controla la autenticación JWT, hashing bcrypt y gestión de cookies HttpOnly. | `schemas.py`, `models.py` |
| `router_routes.py` | Router & WS | Administra la lógica de rutas y aloja el endpoint WebSocket `/ws/tracking` para recepción y retransmisión de GPS. | `models.py`, `vextor_fe/src/pages/Routes/` |
| `email_utils.py` | Utilidad | Maneja la configuración SMTP para el envío de enlaces de recuperación de contraseña. | `router_auth.py` |

---

## 3. Configuración y Ejecución Local

### Requisitos Previos
- Python 3.12+
- PostgreSQL (Local o Supabase)

### Instalación de Dependencias
```bash
cd vextor_be
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de Entorno (`.env`)
Crear un archivo `.env` en la raíz de `vextor_be/`:
```env
DATABASE_URL=postgresql+psycopg://postgres:tu_password@localhost:5432/vextor_db
SECRET_KEY=tu_clave_secreta_super_segura
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Configuración de Correo (Opcional en dev)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=tu_password_de_aplicacion
```

### Ejecutar Servidor Backend
```bash
uvicorn main:app --reload --port 8000
```
La documentación interactiva de Swagger estará disponible en: `http://localhost:8000/docs`
