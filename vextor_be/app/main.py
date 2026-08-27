"""
Punto de entrada principal de la aplicación VEXTOR
Inicializa FastAPI, configura middlewares y registra routers
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database import engine, Base

# Importar routers
from app.api.routes import auth, crud, routing, audit
from app.websocket import websocket_tracking_endpoint

# Crear app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== STARTUP EVENT ==========

@app.on_event("startup")
def startup_event():
    """Inicializa la base de datos al iniciar la aplicación"""
    # Crear tablas
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Table creation note:", e)

    # Actualizar constraints de Conductor
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE conductor DROP CONSTRAINT IF EXISTS chk_estado_conductor;"))
            conn.execute(text("ALTER TABLE conductor ADD CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'));"))
            conn.commit()
    except Exception as e:
        print("Constraint migration note:", e)


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

# CRUD Operations
app.include_router(crud.vehicles_router)
app.include_router(crud.drivers_router)
app.include_router(crud.routes_router)
app.include_router(crud.maintenance_router)
app.include_router(crud.users_router)
app.include_router(crud.company_router)

# Routing / OSRM
app.include_router(routing.router)

# Audit & Security
app.include_router(audit.router)


# ========== WEBSOCKET ENDPOINTS ==========

@app.websocket("/ws/tracking")
async def websocket_endpoint(websocket):
    """WebSocket para tracking en tiempo real"""
    await websocket_tracking_endpoint(websocket)
