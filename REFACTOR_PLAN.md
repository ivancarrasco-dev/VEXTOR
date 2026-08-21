# PLAN DETALLADO DE REESTRUCTURACIÓN - VEXTOR BACKEND

## FASE 1: PREPARACIÓN (Sin cambios funcionales)

### 1.1 Crear estructura de directorios
```
vextor_be/
├── app/
│   ├── __init__.py
│   ├── main.py (pequeño, solo registra routers)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py (configuración centralizada)
│   │   ├── security.py (JWT, hashing, utils)
│   │   └── exceptions.py (excepciones personalizadas)
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py (engine)
│   │   └── session.py (SessionLocal, get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py (Usuario, Rol, SesionUsuario)
│   │   ├── vehicle.py (Vehiculo)
│   │   ├── driver.py (Conductor)
│   │   ├── route.py (Ruta, AsignacionConductor, AsignacionVehiculo, Novedad)
│   │   ├── maintenance.py (Mantenimiento)
│   │   ├── report.py (Reporte)
│   │   ├── tracking.py (SeguimientoRuta, HistorialUbicacion)
│   │   ├── audit.py (Actividad, Notificacion)
│   │   └── company.py (Empresa)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py (Login, Register, etc.)
│   │   ├── user.py (Usuario, UsuarioCreate, etc.)
│   │   ├── vehicle.py (Vehiculo, VehiculoCreate, etc.)
│   │   ├── driver.py (Conductor, ConductorCreate, etc.)
│   │   ├── route.py (Ruta, RutaCreate, etc.)
│   │   ├── maintenance.py (Mantenimiento schemas)
│   │   ├── report.py (Report schemas)
│   │   ├── tracking.py (Ubicacion, SeguimientoRuta schemas)
│   │   ├── audit.py (Actividad, Notificacion schemas)
│   │   ├── company.py (Empresa schemas)
│   │   └── common.py (Rol, Empresa extras)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py (lógica registro/login)
│   │   ├── user_service.py (lógica de usuarios)
│   │   ├── vehicle_service.py (lógica de vehículos)
│   │   ├── driver_service.py (lógica de conductores)
│   │   ├── route_service.py (lógica de rutas - START, FINISH, TRACK)
│   │   ├── maintenance_service.py (lógica de mantenimiento)
│   │   ├── report_service.py (lógica de reportes, PDF, Excel)
│   │   ├── audit_service.py (record_activity, logs)
│   │   ├── notification_service.py (create_notification)
│   │   ├── email_service.py (send_email, send_password_reset, send_alert)
│   │   ├── osrm_service.py (orquesta osrm_client.py, ñade lógica negocio)
│   │   └── company_service.py (lógica de empresa)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py (agregador de routers)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py (endpoint login/register/logout)
│   │       ├── users.py (endpoint crud usuarios)
│   │       ├── vehicles.py (endpoint crud vehículos)
│   │       ├── drivers.py (endpoint crud conductores)
│   │       ├── routes.py (endpoint crud rutas)
│   │       ├── maintenance.py (endpoint mantenimiento)
│   │       ├── reports.py (endpoint reportes)
│   │       ├── audit.py (endpoint auditoría/seguridad)
│   │       ├── company.py (endpoint empresa)
│   │       └── routing.py (endpoint OSRM)
│   ├── websocket/
│   │   ├── __init__.py
│   │   ├── manager.py (ConnectionManager)
│   │   └── tracking.py (WebSocket /ws/tracking)
│   ├── utils/
│   │   ├── __init__.py
│   │   └── helpers.py (parse_user_agent, get_client_ip, etc.)
│   └── external/
│       ├── __init__.py
│       └── osrm_client.py (copiar del services/osrm_client.py actual)
│
├── requirements.txt
├── Dockerfile (cambiar CMD)
└── .dockerignore (si existe)
```

### 1.2 Pasos incrementales

1. **Crear app/__init__.py** vacío
2. **Crear app/core/config.py** con todas las variables de entorno
3. **Crear app/core/security.py** con JWT y hash
4. **Crear app/core/exceptions.py** con excepciones personalizadas
5. **Crear app/database/*.py** con engine y session
6. **Crear app/external/osrm_client.py** (copia del actual)
7. **Crear app/models/*.py** dividiendo models.py actual
8. **Crear app/schemas/*.py** dividiendo schemas.py actual
9. **Crear app/utils/helpers.py** con utilidades
10. **Crear app/services/*.py** con lógica de negocio
11. **Crear app/api/routes/*.py** con endpoints SOLO HTTP
12. **Crear app/websocket/*.py** con WebSocket
13. **Crear app/main.py** simplificado
14. **Actualizar Dockerfile** CMD de uvicorn
15. **Actualizar vextor_be/main.py** (temporalmente, o eliminarlo después)

## FASE 2: MIGRACIÓN INCREMENTAL

### 2.1 Orden de creación (de menor a mayor riesgo)

1. ✅ **core/config.py** - Sin dependencias
2. ✅ **core/exceptions.py** - Sin dependencias
3. ✅ **utils/helpers.py** - Sin dependencias
4. ✅ **database/connection.py** - Depende solo de config
5. ✅ **database/session.py** - Depende solo de connection
6. ✅ **external/osrm_client.py** - Depende solo de config
7. ✅ **models/*.py** - Depende solo de database.connection
8. ✅ **schemas/*.py** - Sin dependencias de BD
9. ✅ **core/security.py** - Depende solo de config
10. ⚠️ **services/*.py** - Depende de modelos, schemas, config, excepciones
11. ⚠️ **api/routes/*.py** - Depende de services, schemas
12. ⚠️ **websocket/*.py** - Depende de modelos, database
13. ⚠️ **app/main.py** - Depende de routers, websocket
14. 🔄 **Actualizar Dockerfile**

## FASE 3: VALIDACIÓN

### 3.1 Verificar después de cada grupo:
- [ ] No hay imports circulares
- [ ] `python -m py_compile app/*/*.py` - compilación sin errores
- [ ] Backend inicia: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Swagger accesible: `http://localhost:8000/docs`

### 3.2 Verificar después de completar:
- [ ] Login funciona
- [ ] Register funciona
- [ ] JWT válido
- [ ] Cookies HttpOnly funcionan
- [ ] GET /api/vehicles funciona
- [ ] POST /api/vehicles funciona
- [ ] PUT /api/vehicles/{id} funciona
- [ ] DELETE /api/vehicles/{id} funciona
- [ ] GET /api/drivers funciona
- [ ] GET /api/routes funciona
- [ ] POST /api/routes/{id}/start funciona
- [ ] POST /api/routes/{id}/finish funciona
- [ ] WebSocket /ws/tracking funciona
- [ ] GET /api/routing/health funciona
- [ ] GET /api/audit/activity funciona
- [ ] POST /api/reports funciona
- [ ] Docker build vextor_be OK
- [ ] docker-compose up vextor OK
- [ ] Backend conecta con Supabase PostgreSQL ✅
- [ ] Backend conecta con OSRM (http://osrm:5000) ✅

## FASE 4: LIMPIEZA

### 4.1 Eliminar archivos obsoletos:
- vextor_be/router_*.py (todos)
- vextor_be/models.py
- vextor_be/schemas.py
- vextor_be/email_utils.py (duplicado)
- vextor_be/services/osrm_client.py (copiado a app/external/)
- vextor_be/database.py (copiado a app/database/)

### 4.2 Actualizar:
- Dockerfile CMD
- requirements.txt (si es necesario)
- import statements en todo el proyecto

### 4.3 Crear documentación:
- ARCHITECTURE.md - explicar estructura
- DEVELOPMENT.md - cómo agregar nuevos endpoints
- API.md - documentación de endpoints (o usar Swagger)

## FASE 5: VALIDACIÓN FINAL

### 5.1 Tests manuales (sin framework de testing)
```bash
# Terminal 1: Iniciar backend
cd vextor_be
docker build -t vextor-be .
docker run -it --env-file=../.env vextor-be

# Terminal 2: Probar endpoints
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"TestPass123", "fullName":"Test User"}'

curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"TestPass123"}'

curl -X GET http://localhost:8000/api/vehicles \
  -H "Authorization: Bearer <token>"

# WebSocket
# Usar cliente WebSocket: ws://localhost:8000/ws/tracking
```

### 5.2 Tests de Docker Compose
```bash
cd .. # Volver a raíz VEXTOR-1
.\setup-vextor.ps1
```

Debería:
1. ✅ Crear .env si no existe
2. ✅ Auto-generar JWT_SECRET_KEY
3. ✅ Configurar SMTP dummy
4. ✅ Descargar mapa OSRM (si no existe)
5. ✅ Procesar OSRM (si es necesario)
6. ✅ Hacer `docker compose up --build`
7. ✅ Healthchecks: OSRM, Backend, Frontend, OSRM→Backend routing
8. ✅ Mostrar URLs funcionando

## NOTAS CRÍTICAS

### Imports absolutos vs relativos
```python
# ❌ VIEJO (relativo confuso)
from database import engine
from models import Usuario
from router_auth import get_current_user

# ✅ NUEVO (absoluto desde app/)
from app.database.connection import engine
from app.models.user import Usuario
from app.api.routes.auth import get_current_user  # NO - eso es circular
# ✅ MEJOR
from app.core.security import get_current_user  # dependencia
```

### Webpack en Dockerfile
Cambiar:
```dockerfile
# ❌ VIEJO
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# ✅ NUEVO
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### WebSocket ConnectionManager
- `main.py` tiene `ConnectionManager` directamente
- Debe moverse a `websocket/manager.py`
- `main.py` solo los importa y los usa

### Email duplicado
- `email_service.py` vs `email_utils.py`
- `email_service.py` es más completo
- Consolidar en `services/email_service.py`
- Eliminar `email_utils.py`

### No cambiar DB
- Modelos ORM deben produc el mismo SQL
- Constraints deben mantenerse idénticos
- Relaciones igual

