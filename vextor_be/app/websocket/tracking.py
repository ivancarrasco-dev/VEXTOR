"""
WebSocket para Tracking en Tiempo Real
Actualiza ubicaciones de vehículos y conductores
"""
from uuid import UUID
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import SeguimientoRuta, HistorialUbicacion, Ruta, Conductor, Vehiculo
from app.websocket.manager import ConnectionManager

# Manager global
manager = ConnectionManager()


async def websocket_tracking_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint para tracking en tiempo real
    Protocolo:
    - Cliente envía: {"type": "location_update", "id_ruta": "uuid", "latitud": float, "longitud": float, "velocidad": float, "heading": float}
    - Server broadcast: {"type": "location_broadcast", "id_ruta": "uuid", ...datos de ubicación}
    - Cliente puede enviar: {"type": "ping"} → Server responde {"type": "pong"}
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "location_update":
                db = SessionLocal()
                try:
                    id_ruta_str = data.get("id_ruta")
                    lat = data.get("latitud")
                    lng = data.get("longitud")
                    speed = data.get("velocidad", 0.0)
                    heading = data.get("heading", 0.0)

                    if id_ruta_str and lat is not None and lng is not None:
                        id_ruta = UUID(id_ruta_str)
                        seg = db.query(SeguimientoRuta).filter(
                            SeguimientoRuta.id_ruta == id_ruta
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
                            route = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
                            conductor = db.query(Conductor).filter(
                                Conductor.id_conductor == seg.id_conductor
                            ).first()
                            vehiculo = db.query(Vehiculo).filter(
                                Vehiculo.id_vehiculo == seg.id_vehiculo
                            ).first()

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
