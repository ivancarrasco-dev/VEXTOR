import random
import uuid
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

# Carga la configuración local antes de inicializar la base de datos y los servicios.
# Las variables ya definidas por el entorno tienen prioridad sobre el archivo .env.
# Se busca el archivo .env en la raíz del repositorio VEXTOR.
load_dotenv(Path(__file__).parent.parent / ".env")

from database import engine, SessionLocal
import models
from router_vehicles import router as vehicles_router
from router_drivers import router as drivers_router
from router_routes import router as routes_router
from router_maintenance import router as maintenance_router
from router_auth import router as auth_router
from router_company import router as company_router
from router_users import router as users_router
from router_activities import router as activities_router
from router_security import router as security_router
from router_reports import router as reports_router
from router_routing import router as routing_router

app = FastAPI(title="Vextor API", description="Backend para la gestión de flota y transporte de Vextor")

# Real-time WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

@app.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "location_update":
                id_ruta_str = data.get("id_ruta")
                lat = data.get("latitud")
                lng = data.get("longitud")
                speed = data.get("velocidad", 0.0)
                heading = data.get("heading", 0.0)

                if id_ruta_str and lat is not None and lng is not None:
                    db = SessionLocal()
                    try:
                        id_ruta = uuid.UUID(id_ruta_str)
                        seg = db.query(models.SeguimientoRuta).filter(models.SeguimientoRuta.id_ruta == id_ruta).first()
                        now = datetime.now()
                        if seg:
                            seg.latitud = lat
                            seg.longitud = lng
                            seg.velocidad = speed
                            seg.heading = heading
                            seg.ultima_actualizacion = now
                            seg.estado_seguimiento = "ACTIVO"
                            db.commit()

                            hist = models.HistorialUbicacion(
                                id_seguimiento=seg.id_seguimiento,
                                id_ruta=id_ruta,
                                latitud=lat,
                                longitud=lng,
                                velocidad=speed,
                                fecha_hora=now
                            )
                            db.add(hist)
                            db.commit()

                            route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
                            conductor = db.query(models.Conductor).filter(models.Conductor.id_conductor == seg.id_conductor).first()
                            vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == seg.id_vehiculo).first()

                            broadcast_payload = {
                                "type": "location_broadcast",
                                "id_ruta": id_ruta_str,
                                "codigo_ruta": route.codigo_ruta if route else "",
                                "nombre_ruta": route.nombre_ruta if route else "",
                                "latitud": float(lat),
                                "longitud": float(lng),
                                "velocidad": float(speed),
                                "heading": float(heading),
                                "ultima_actualizacion": now.isoformat(),
                                "conductor": {
                                    "id_conductor": str(conductor.id_conductor) if conductor else None,
                                    "nombre": f"{conductor.nombre_conductor} {conductor.apellido_conductor}" if conductor else "Conductor"
                                },
                                "vehiculo": {
                                    "id_vehiculo": str(vehiculo.id_vehiculo) if vehiculo else None,
                                    "placa": vehiculo.placa if vehiculo else "N/A"
                                }
                            }
                            await ws_manager.broadcast(broadcast_payload)
                    except Exception as e:
                        print(f"Error updating location via WS: {e}")
                    finally:
                        db.close()
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket exception: {e}")
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "message": "Vextor API funcionando correctamente",
        "status": "online"
    }

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(company_router)
app.include_router(users_router)
app.include_router(vehicles_router)
app.include_router(activities_router)
app.include_router(security_router)
app.include_router(drivers_router)
app.include_router(routes_router)
app.include_router(routing_router)
app.include_router(maintenance_router)
app.include_router(reports_router)


# Database Initialization on startup
@app.on_event("startup")
def startup_populate():
    # Automatically create missing database tables in PostgreSQL
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Table creation note:", e)

    # Update DB Constraints for Conductor table if necessary
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE conductor DROP CONSTRAINT IF EXISTS chk_estado_conductor;"))
            conn.execute(text("ALTER TABLE conductor ADD CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'));"))
            conn.commit()
    except Exception as e:
        print("Constraint migration note:", e)
