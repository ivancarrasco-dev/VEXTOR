"""
Punto de entrada principal de la aplicación VEXTOR
Inicializa FastAPI, configura middlewares y registra routers
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.database import engine, Base

# Importar routers
from app.api.routes import auth, crud, routing, audit, dashboard, driver_routes, reports
from app.websocket import websocket_tracking_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestor de ciclo de vida de la aplicación"""
    # 1. Comprobación obligatoria de conectividad a la base de datos
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print("Base de datos conectada y operativa.")
    except Exception as e:
        print(f"ALERTA: Error de conexion inicial a la base de datos: {e}")

    # 2. Creación no destructiva de tablas faltantes si aplica
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Nota de inicializacion de tablas:", e)

    if engine.dialect.name == "postgresql":
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE conductor DROP CONSTRAINT IF EXISTS chk_estado_conductor;"))
                conn.execute(text("ALTER TABLE conductor ADD CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'EN_VIAJE', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'LICENCIA_VENCIDA', 'SUSPENDIDO'));"))
                conn.commit()
        except Exception as e:
            print("Nota de verificacion de restricciones:", e)

    # 3. Sembrar roles base y usuario admin inicial seguro si no existen
    try:
        from app.database import SessionLocal
        from app.models import Rol, Usuario
        from app.core.security import hash_password
        from uuid import uuid4

        db = SessionLocal()
        try:
            roles_data = [
                ("Administrador", "Control total del sistema y gestión corporativa"),
                ("Conductor", "Operación de vehículos y consulta de rutas asignadas"),
                ("Usuario", "Usuario estándar del sistema"),
            ]
            roles_dict = {}
            for role_name, desc in roles_data:
                rol = db.query(Rol).filter(Rol.nombre_rol.ilike(role_name)).first()
                if not rol:
                    rol = Rol(id_rol=uuid4(), nombre_rol=role_name, descripcion_rol=desc)
                    db.add(rol)
                    db.commit()
                    db.refresh(rol)
                roles_dict[role_name] = rol

            # Sembrar admin inicial solo si no existe usuario con ese correo
            admin_email = settings.ADMIN_EMAIL
            admin_user = db.query(Usuario).filter(Usuario.correo_usuario == admin_email).first()
            if not admin_user:
                admin_user = Usuario(
                    id_usuario=uuid4(),
                    id_rol=roles_dict["Administrador"].id_rol,
                    nombres_usuario="Administrador",
                    apellidos_usuario="Sistema",
                    correo_usuario=admin_email,
                    contrasenia_usuario=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                    telefono_usuario="3000000000",
                    estado_usuario="ACTIVO",
                )
                db.add(admin_user)
                db.commit()
                print(f"Usuario inicial admin verificado/creado para: {admin_email}")
        finally:
            db.close()
    except Exception as e:
        print("Nota de datos semilla:", e)

    yield

    # Limpieza en shutdown if required


# Crear app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

# Configurar excepciones globales
setup_exception_handlers(app)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== ROOT ENDPOINT ==========

@app.get("/")
def root():
    """Health check del API"""
    return {
        "message": "Vextor API funcionando correctamente",
        "status": "online",
        "version": "2.0.0"
    }


# ========== REGISTRAR ROUTERS ==========

# Authentication
app.include_router(auth.router)

# Executive Dashboard & Metrics
app.include_router(dashboard.router)

# CRUD Operations
app.include_router(crud.vehicles_router)
app.include_router(crud.drivers_router)
app.include_router(crud.routes_router)
app.include_router(crud.maintenance_router)
app.include_router(crud.users_router)
app.include_router(crud.roles_router)
app.include_router(crud.company_router)

# Driver Routes (my-routes endpoint)
app.include_router(driver_routes.router)

# Routing / OSRM
app.include_router(routing.router)

# Audit & Security
app.include_router(audit.router)

# Reports
app.include_router(reports.router, prefix="/api/reports")


# ========== WEBSOCKET ENDPOINTS ==========

@app.websocket("/ws/tracking")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para tracking en tiempo real"""
    await websocket_tracking_endpoint(websocket)
