"""
WebSocket para Tracking en Tiempo Real
Actualiza ubicaciones de vehículos y conductores
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import SeguimientoRuta, HistorialUbicacion, Ruta, Conductor, Vehiculo, AsignacionConductor, Rol
from app.websocket.manager import ConnectionManager

# Manager global
manager = ConnectionManager()


class LocationUpdateSchema(BaseModel):
    id_ruta: UUID
    latitud: float = Field(..., ge=-90.0, le=90.0)
    longitud: float = Field(..., ge=-180.0, le=180.0)
    velocidad: float = Field(default=0.0, ge=0.0)
    heading: float = Field(default=0.0, ge=0.0, le=360.0)


async def websocket_tracking_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint para tracking en tiempo real con autenticación previa.
    Protocolo:
    - Cliente envía token en query string `?token=XYZ`, cabecera `Authorization: Bearer XYZ` o Cookie `vextor_auth_token`
    - Cliente envía: {"type": "location_update", "id_ruta": "uuid", "latitud": float, "longitud": float, "velocidad": float, "heading": float}
    - Server broadcast: {"type": "location_broadcast", "id_ruta": "uuid", ...datos de ubicación}
    - Cliente puede enviar: {"type": "ping"} → Server responde {"type": "pong"}
    """
    # Accept handshake first to prevent HTTP 403 upgrade rejection
    await websocket.accept()

    # Extraer token de query string, headers o cookies
    token = websocket.query_params.get("token")
    if not token:
        auth_header = websocket.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        token = websocket.cookies.get("vextor_auth_token")

    if not token:
        # Enviar un mensaje antes de cerrar fuerza a completar el upgrade del
        # WebSocket; cerrar inmediatamente hace que Uvicorn responda HTTP 403.
        await websocket.send_json({
            "type": "error",
            "message": "Token de autenticación requerido",
        })
        await websocket.close(code=4001, reason="Token de autenticación requerido")
        return

    # Validar token y usuario
    db_auth = SessionLocal()
    try:
        from app.services.auth_service import AuthService
        current_user = AuthService.get_current_user(token, db_auth)
    except Exception:
        # La conexión ya fue aceptada arriba. Notificar antes de cerrar evita
        # que el navegador lo interprete como un error de handshake (403).
        await websocket.send_json({
            "type": "error",
            "message": "Sesión no válida o expirada",
        })
        await websocket.close(code=4003, reason="Autenticación fallida o token inválido")
        return
    finally:
        db_auth.close()

    # Solo conductores pueden publicar telemetría; los administradores mantienen
    # su consumo de tracking desde la API protegida del panel web.
    db_role = SessionLocal()
    try:
        role = db_role.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
        if not role or role.nombre_rol.strip().lower() != "conductor":
            await websocket.send_json({"type": "error", "message": "El canal GPS está reservado a conductores."})
            await websocket.close(code=4003, reason="Rol no autorizado para publicar GPS")
            return
        driver = db_role.query(Conductor).filter(
            Conductor.id_usuario == current_user.id_usuario
        ).first()
        if not driver:
            await websocket.send_json({"type": "error", "message": "No existe un perfil de conductor asociado."})
            await websocket.close(code=4003, reason="Perfil de conductor requerido")
            return
        driver_id = driver.id_conductor
    finally:
        db_role.close()

    if websocket not in manager.active_connections:
        manager.active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "location_update":
                try:
                    loc_payload = LocationUpdateSchema(
                        id_ruta=data.get("id_ruta"),
                        latitud=data.get("latitud"),
                        longitud=data.get("longitud"),
                        velocidad=data.get("velocidad", 0.0),
                        heading=data.get("heading", 0.0),
                    )
                except ValidationError as ve:
                    await manager.send_personal(
                        websocket,
                        {"type": "error", "message": "Payload de ubicación inválido o fuera de rango."}
                    )
                    continue

                db = SessionLocal()
                try:
                    id_ruta = loc_payload.id_ruta
                    lat = loc_payload.latitud
                    lng = loc_payload.longitud
                    speed = loc_payload.velocidad
                    heading = loc_payload.heading

                    assignment = db.query(AsignacionConductor).filter(
                        AsignacionConductor.id_ruta == id_ruta,
                        AsignacionConductor.id_conductor == driver_id,
                        AsignacionConductor.estado_asignacion == "ACTIVA",
                    ).first()
                    route = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
                    if not assignment or not route or route.estado_ruta not in ("EN_PROCESO", "EN_RUTA"):
                        await manager.send_personal(websocket, {
                            "type": "error",
                            "message": "No tienes una asignación activa para publicar GPS en esta ruta."
                        })
                        continue

                    seg = db.query(SeguimientoRuta).filter(
                        SeguimientoRuta.id_ruta == id_ruta,
                        SeguimientoRuta.id_conductor == driver_id,
                    ).first()

                    now = datetime.now()

                    if seg:
                        seg.latitud = lat
                        seg.longitud = lng
                        seg.velocidad = speed
                        seg.heading = heading
                        seg.ultima_actualizacion = now
                        seg.estado_seguimiento = "ACTIVO"
                        db.commit()

                        # Guardar en historial
                        hist = HistorialUbicacion(
                            id_seguimiento=seg.id_seguimiento,
                            id_ruta=id_ruta,
                            latitud=lat,
                            longitud=lng,
                            velocidad=speed,
                            fecha_hora=now,
                        )
                        db.add(hist)
                        db.commit()

                        # Preparar broadcast
                        conductor = db.query(Conductor).filter(
                            Conductor.id_conductor == seg.id_conductor
                        ).first()
                        vehiculo = db.query(Vehiculo).filter(
                            Vehiculo.id_vehiculo == seg.id_vehiculo
                        ).first()

                        broadcast_payload = {
                            "type": "location_broadcast",
                            "id_ruta": str(id_ruta),
                            "codigo_ruta": route.codigo_ruta if route else "",
                            "nombre_ruta": route.nombre_ruta if route else "",
                            "latitud": float(lat),
                            "longitud": float(lng),
                            "velocidad": float(speed),
                            "heading": float(heading),
                            "ultima_actualizacion": now.isoformat(),
                            "conductor": {
                                "id_conductor": str(conductor.id_conductor) if conductor else None,
                                "nombre": f"{conductor.nombre_conductor} {conductor.apellido_conductor}"
                                if conductor
                                else "Conductor",
                            },
                            "vehiculo": {
                                "id_vehiculo": str(vehiculo.id_vehiculo) if vehiculo else None,
                                "placa": vehiculo.placa if vehiculo else "N/A",
                            },
                        }
                        await manager.broadcast(broadcast_payload)
                except Exception as e:
                    print(f"Error updating location via WS: {e}")
                finally:
                    db.close()
                    
            elif data.get("type") == "ping":
                await manager.send_personal(websocket, {"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket exception: {e}")
        manager.disconnect(websocket)
