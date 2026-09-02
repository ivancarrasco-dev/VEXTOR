"""
Endpoints para rutas del conductor
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/api/routes", tags=["Driver Routes"])


@router.get("/driver/my-routes")
def get_driver_routes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Obtiene las rutas asignadas al conductor logueado
    Retorna estructura: {conductor, active_route, assigned_routes, history_routes}
    """
    from app.models import Conductor as ConductorModel, AsignacionConductor
    
    # Buscar el conductor del usuario actual
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    
    if not driver:
        return {
            "conductor": None,
            "active_route": None,
            "assigned_routes": [],
            "history_routes": []
        }
    
    # Obtener rutas asignadas a este conductor
    asignaciones = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_conductor == driver.id_conductor
    ).all()
    
    # Separar rutas activas y asignadas
    active_route = None
    assigned_routes = []
    history_routes = []
    
    for asig in asignaciones:
        if asig.ruta:
            try:
                ruta_dict = {
                    "id_ruta": str(asig.ruta.id_ruta),
                    "codigo_ruta": asig.ruta.codigo_ruta,
                    "nombre_ruta": asig.ruta.nombre_ruta,
                    "origen": asig.ruta.origen,
                    "destino": asig.ruta.destino,
                    "fecha_programada": asig.ruta.fecha_programada.isoformat() if asig.ruta.fecha_programada else None,
                    "hora_inicio_real": asig.ruta.hora_inicio_real.isoformat() if asig.ruta.hora_inicio_real else None,
                    "hora_fin_real": asig.ruta.hora_fin_real.isoformat() if asig.ruta.hora_fin_real else None,
                    "estado_ruta": asig.ruta.estado_ruta,
                    "vehiculo": {
                        "id_vehiculo": str(asig.ruta.vehiculo.id_vehiculo),
                        "placa": asig.ruta.vehiculo.placa,
                        "marca": asig.ruta.vehiculo.marca,
                        "modelo": asig.ruta.vehiculo.modelo,
                    } if asig.ruta.vehiculo else None,
                }
                
                if asig.ruta.estado_ruta == "EN_RUTA":
                    active_route = ruta_dict
                elif asig.ruta.estado_ruta == "PROGRAMADA":
                    assigned_routes.append(ruta_dict)
                elif asig.ruta.estado_ruta == "COMPLETADA":
                    history_routes.append(ruta_dict)
            except Exception as e:
                print(f"Error serializing route: {str(e)}")
                continue
    
    # Construir respuesta con estructura esperada por frontend
    response = {
        "conductor": {
            "id_conductor": str(driver.id_conductor),
            "nombre_conductor": driver.nombre_conductor,
            "apellido_conductor": driver.apellido_conductor,
            "cedula": driver.cedula_conductor,
            "licencia": driver.licencia,
            "estado_conductor": driver.estado_conductor
        },
        "active_route": active_route,
        "assigned_routes": assigned_routes,
        "history_routes": history_routes
    }
    
    return response


@router.get("/active-tracking")
def get_active_tracking(db: Session = Depends(get_db)):
    """Endpoint para rastreo activo de rutas en tiempo real"""
    return {"status": "active", "message": "Rastreo en tiempo real disponible"}
