"""
Punto de entrada principal de la aplicación VEXTOR
Inicializa FastAPI, configura middlewares y registra routers
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.database import engine, Base

# Importar routers
from app.api.routes import auth, crud, routing, audit, dashboard, driver_routes, reports, backup
from app.websocket import websocket_tracking_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestor de ciclo de vida de la aplicación"""
    scheduler = None
    # Inicialización en startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Table creation note:", e)

    if engine.dialect.name == "postgresql":
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE conductor DROP CONSTRAINT IF EXISTS chk_estado_conductor;"))
                conn.execute(text("ALTER TABLE conductor ADD CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'EN_VIAJE', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'LICENCIA_VENCIDA', 'SUSPENDIDO'));"))
                conn.commit()
        except Exception as e:
            print("Constraint migration note:", e)

    # Sembrar roles base y usuario admin por defecto si no existen
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
                rol = db.query(Rol).filter(Rol.nombre_rol == role_name).first()
                if not rol:
                    rol = Rol(id_rol=uuid4(), nombre_rol=role_name, descripcion_rol=desc)
                    db.add(rol)
                    db.commit()
                    db.refresh(rol)
                roles_dict[role_name] = rol

            # Crear administrador inicial únicamente con credenciales explícitas del entorno.
            # Nunca sembrar una contraseña pública/conocida en una base de datos real.
            admin_email = (os.getenv("VEXTOR_ADMIN_EMAIL") or "").strip().lower()
            admin_password = os.getenv("VEXTOR_ADMIN_PASSWORD") or ""
            if admin_email and admin_password:
                admin_user = db.query(Usuario).filter(
                    Usuario.correo_usuario == admin_email
                ).first()
                if not admin_user:
                    admin_user = Usuario(
                        id_usuario=uuid4(),
                        id_rol=roles_dict["Administrador"].id_rol,
                        nombres_usuario="Administrador",
                        apellidos_usuario="Sistema",
                        correo_usuario=admin_email,
                        contrasenia_usuario=hash_password(admin_password),
                        telefono_usuario="",
                        estado_usuario="ACTIVO",
                    )
                    db.add(admin_user)
                    db.commit()
                    print(f"Usuario administrador inicial creado: {admin_email}")
            else:
                print(
                    "Administrador inicial no creado: define VEXTOR_ADMIN_EMAIL y "
                    "VEXTOR_ADMIN_PASSWORD de forma segura si necesitas sembrar uno."
                )
        finally:
            db.close()
    except Exception as e:
        print("Seed data note:", e)

    # Programación opcional de respaldos: desactivada por defecto.
    # El advisory lock evita duplicados si el backend corre en más de una réplica.
    if settings.BACKUP_AUTO_ENABLED:
        if not settings.BACKUP_STORAGE_CONFIGURED:
            print("Backup scheduler disabled: Supabase Storage credentials are missing.")
        elif engine.dialect.name != "postgresql":
            print("Backup scheduler disabled: PostgreSQL is required.")
        else:
            try:
                from apscheduler.schedulers.background import BackgroundScheduler
                from apscheduler.triggers.cron import CronTrigger
                from app.services.backup_service import generate_database_backup, store_backup_verified
                from app.services.backup_storage import list_backups

                list_backups()  # No iniciar el scheduler si el bucket no existe/no es accesible.

                def run_scheduled_backup():
                    lock_key = 734923847201
                    try:
                        with engine.connect() as lock_connection:
                            # Xact lock también funciona con el pooler de transacciones de Supabase.
                            lock_connection.execute(
                                text("SET LOCAL idle_in_transaction_session_timeout = 0")
                            )
                            acquired = lock_connection.execute(
                                text("SELECT pg_try_advisory_xact_lock(:lock_key)"),
                                {"lock_key": lock_key},
                            ).scalar()
                            if not acquired:
                                lock_connection.rollback()
                                return
                            try:
                                filename, content = generate_database_backup()
                                store_backup_verified(filename, content)
                                print("Scheduled VEXTOR backup completed.")
                            finally:
                                # Libera el lock transaccional al finalizar o fallar el respaldo.
                                lock_connection.rollback()
                    except Exception as backup_error:
                        print(f"Scheduled VEXTOR backup failed: {type(backup_error).__name__}")

                scheduler = BackgroundScheduler(timezone=settings.BACKUP_AUTO_TIMEZONE)
                scheduler.add_job(
                    run_scheduled_backup,
                    CronTrigger(
                        hour=settings.BACKUP_AUTO_HOUR,
                        minute=settings.BACKUP_AUTO_MINUTE,
                        timezone=settings.BACKUP_AUTO_TIMEZONE,
                    ),
                    id="vextor_daily_backup",
                    replace_existing=True,
                    max_instances=1,
                    coalesce=True,
                )
                scheduler.start()
                print(
                    f"VEXTOR daily backup scheduled at "
                    f"{settings.BACKUP_AUTO_HOUR:02d}:{settings.BACKUP_AUTO_MINUTE:02d} "
                    f"({settings.BACKUP_AUTO_TIMEZONE})."
                )
            except Exception as scheduler_error:
                # Una falla del scheduler nunca debe impedir que la API arranque.
                print(f"Backup scheduler could not start: {type(scheduler_error).__name__}")

    yield

    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)


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

# Backup management (admin-only)
app.include_router(backup.router)

# Reports
app.include_router(reports.router, prefix="/api/reports")


# Archivos de imágenes de vehículos
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ========== WEBSOCKET ENDPOINTS ==========

@app.websocket("/ws/tracking")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para tracking en tiempo real"""
    await websocket_tracking_endpoint(websocket)
