"""
Endpoints para rutas del conductor
"""
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.routes.auth import get_current_user
from app.models import (
    Ruta,
    Conductor as ConductorModel,
    Vehiculo,
    AsignacionConductor,
    AsignacionVehiculo,
    SeguimientoRuta,
    HistorialUbicacion,
)
from app.services.crud_services import sync_driver_status, sync_vehicle_status
from app.services.audit_service import AuditService

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
    # Buscar el conductor del usuario actual
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    
    if not driver:
        return {
            "conductor": None,
            "active_route": None,
            "assigned_routes": [],
            "history_routes": []
        }
    
    # Sincronizar estado del conductor antes de retornar
    sync_driver_status(driver.id_conductor, db)
    db.refresh(driver)

    # Obtener rutas asignadas a este conductor
    asignaciones = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_conductor == driver.id_conductor
    ).all()
    
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
                        "id_vehiculo": str(asig.ruta.asignaciones_vehiculo[0].vehiculo.id_vehiculo) if asig.ruta.asignaciones_vehiculo and asig.ruta.asignaciones_vehiculo[0].vehiculo else None,
                        "placa": asig.ruta.asignaciones_vehiculo[0].vehiculo.placa if asig.ruta.asignaciones_vehiculo and asig.ruta.asignaciones_vehiculo[0].vehiculo else "N/A",
                        "marca": asig.ruta.asignaciones_vehiculo[0].vehiculo.marca if asig.ruta.asignaciones_vehiculo and asig.ruta.asignaciones_vehiculo[0].vehiculo else "",
                        "modelo": asig.ruta.asignaciones_vehiculo[0].vehiculo.modelo if asig.ruta.asignaciones_vehiculo and asig.ruta.asignaciones_vehiculo[0].vehiculo else "",
                    } if asig.ruta.asignaciones_vehiculo else None,
                }
                
                # Sincronizar ruta activa (EN_PROCESO, EN_RUTA o SUSPENDIDA)
                if asig.ruta.estado_ruta in ("EN_PROCESO", "EN_RUTA", "SUSPENDIDA"):
                    active_route = ruta_dict
                elif asig.ruta.estado_ruta == "PROGRAMADA":
                    assigned_routes.append(ruta_dict)
                elif asig.ruta.estado_ruta in ("COMPLETADA", "CANCELADA"):
                    history_routes.append(ruta_dict)
            except Exception as e:
                print(f"Error serializing route: {str(e)}")
                continue
    
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


@router.post("/{id_ruta}/start")
def start_route(
    id_ruta: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Inicia una ruta asignada y sincroniza estado de conductor y vehículo a 'EN_RUTA'"""
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    if not driver:
        raise HTTPException(status_code=403, detail="El usuario actual no es un conductor registrado.")

    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    asig = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_ruta == id_ruta,
        AsignacionConductor.id_conductor == driver.id_conductor
    ).first()
    if not asig and getattr(getattr(current_user, 'rol', None), 'nombre_rol', None) != "Administrador":
        raise HTTPException(status_code=403, detail="No estás asignado a esta ruta.")

    if ruta.estado_ruta == "COMPLETADA":
        raise HTTPException(status_code=400, detail="Esta ruta ya ha sido completada.")

    # Cambiar estado de la ruta a EN_PROCESO
    ruta.estado_ruta = "EN_PROCESO"
    if not ruta.hora_inicio_real:
        ruta.hora_inicio_real = datetime.now()

    # Sincronizar estado del conductor
    driver.estado_conductor = "EN_RUTA"

    # Sincronizar estado del vehículo asignado
    asig_veh = db.query(AsignacionVehiculo).filter(AsignacionVehiculo.id_ruta == id_ruta).first()
    vehiculo_id = None
    if asig_veh:
        vehiculo_id = asig_veh.id_vehiculo
        vehiculo = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehiculo_id).first()
        if vehiculo:
            vehiculo.estado_vehiculo = "EN_RUTA"

    # Crear o activar seguimiento de ruta
    if vehiculo_id:
        seg = db.query(SeguimientoRuta).filter(SeguimientoRuta.id_ruta == id_ruta).first()
        if not seg:
            lat, lng = 4.7110, -74.0721
            if ruta.origen:
                parts = ruta.origen.split(",")
                if len(parts) == 2:
                    try:
                        lat, lng = float(parts[0].strip()), float(parts[1].strip())
                    except ValueError:
                        pass
            seg = SeguimientoRuta(
                id_ruta=id_ruta,
                id_conductor=driver.id_conductor,
                id_vehiculo=vehiculo_id,
                latitud=lat,
                longitud=lng,
                velocidad=0.0,
                heading=0.0,
                estado_seguimiento="ACTIVO"
            )
            db.add(seg)
        else:
            seg.estado_seguimiento = "ACTIVO"

    db.commit()
    db.refresh(ruta)
    db.refresh(driver)

    try:
        AuditService.record_activity(
            db=db,
            id_usuario=current_user.id_usuario,
            nombres_usuario=f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
            tipo_accion="INICIAR_RUTA",
            modulo="RUTAS",
            descripcion=f"Inició la ruta {ruta.codigo_ruta} ({ruta.nombre_ruta})"
        )
    except Exception as e:
        print(f"Error logging audit: {e}")

    return {
        "message": "Ruta iniciada con éxito.",
        "estado_ruta": ruta.estado_ruta,
        "estado_conductor": driver.estado_conductor
    }


@router.post("/{id_ruta}/pause")
def pause_route(
    id_ruta: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Pausa una ruta en curso y actualiza estados"""
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    if not driver:
        raise HTTPException(status_code=403, detail="El usuario actual no es un conductor registrado.")

    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    asig = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_ruta == id_ruta,
        AsignacionConductor.id_conductor == driver.id_conductor
    ).first()
    if not asig and getattr(getattr(current_user, 'rol', None), 'nombre_rol', None) != "Administrador":
        raise HTTPException(status_code=403, detail="No estás asignado a esta ruta.")

    if ruta.estado_ruta not in ("EN_PROCESO", "EN_RUTA"):
        raise HTTPException(status_code=400, detail="Solo se pueden pausar rutas en proceso o en ruta.")

    ruta.estado_ruta = "SUSPENDIDA"
    driver.estado_conductor = "NO_DISPONIBLE"

    asig_veh = db.query(AsignacionVehiculo).filter(AsignacionVehiculo.id_ruta == id_ruta).first()
    if asig_veh and asig_veh.id_vehiculo:
        vehiculo = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == asig_veh.id_vehiculo).first()
        if vehiculo:
            vehiculo.estado_vehiculo = "DISPONIBLE"

    db.commit()
    db.refresh(ruta)
    db.refresh(driver)

    try:
        AuditService.record_activity(
            db=db,
            id_usuario=current_user.id_usuario,
            nombres_usuario=f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
            tipo_accion="PAUSAR_RUTA",
            modulo="RUTAS",
            descripcion=f"Pausó la ruta {ruta.codigo_ruta} ({ruta.nombre_ruta})"
        )
    except Exception as e:
        print(f"Error logging audit: {e}")

    return {
        "message": "Ruta pausada con éxito.",
        "estado_ruta": ruta.estado_ruta,
        "estado_conductor": driver.estado_conductor
    }


@router.post("/{id_ruta}/finish")
def finish_route(
    id_ruta: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Finaliza una ruta y resincroniza conductor y vehículo a 'DISPONIBLE'"""
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    if not driver:
        raise HTTPException(status_code=403, detail="El usuario actual no es un conductor registrado.")

    ruta = db.query(Ruta).filter(Ruta.id_ruta == id_ruta).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    asig = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_ruta == id_ruta,
        AsignacionConductor.id_conductor == driver.id_conductor
    ).first()
    if not asig and getattr(getattr(current_user, 'rol', None), 'nombre_rol', None) != "Administrador":
        raise HTTPException(status_code=403, detail="No estás asignado a esta ruta.")

    ruta.estado_ruta = "COMPLETADA"
    ruta.hora_fin_real = datetime.now()

    seg = db.query(SeguimientoRuta).filter(SeguimientoRuta.id_ruta == id_ruta).first()
    if seg:
        seg.estado_seguimiento = "FINALIZADO"

    db.commit()

    # Sincronizar estados
    sync_driver_status(driver.id_conductor, db)
    asig_veh = db.query(AsignacionVehiculo).filter(AsignacionVehiculo.id_ruta == id_ruta).first()
    if asig_veh and asig_veh.id_vehiculo:
        sync_vehicle_status(asig_veh.id_vehiculo, db)

    db.refresh(ruta)
    db.refresh(driver)

    try:
        AuditService.record_activity(
            db=db,
            id_usuario=current_user.id_usuario,
            nombres_usuario=f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
            tipo_accion="FINALIZAR_RUTA",
            modulo="RUTAS",
            descripcion=f"Finalizó la ruta {ruta.codigo_ruta} ({ruta.nombre_ruta})"
        )
    except Exception as e:
        print(f"Error logging audit: {e}")

    return {
        "message": "Ruta finalizada con éxito.",
        "estado_ruta": ruta.estado_ruta,
        "estado_conductor": driver.estado_conductor
    }


@router.post("/{id_ruta}/location")
def update_route_location(
    id_ruta: UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Fallback HTTP para actualización de coordenadas GPS de la ruta"""
    lat = payload.get("latitud")
    lng = payload.get("longitud")
    speed = payload.get("velocidad", 0.0)
    heading = payload.get("heading", 0.0)

    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Latitud y longitud son requeridas.")

    seg = db.query(SeguimientoRuta).filter(SeguimientoRuta.id_ruta == id_ruta).first()
    now = datetime.now()

    if seg:
        seg.latitud = lat
        seg.longitud = lng
        seg.velocidad = speed
        seg.heading = heading
        seg.ultima_actualizacion = now
        seg.estado_seguimiento = "ACTIVO"
        db.commit()

        hist = HistorialUbicacion(
            id_seguimiento=seg.id_seguimiento,
            id_ruta=id_ruta,
            latitud=lat,
            longitud=lng,
            velocidad=speed,
            fecha_hora=now
        )
        db.add(hist)
        db.commit()

    return {"status": "ok", "timestamp": now.isoformat()}


@router.get("/active-tracking")
def get_active_tracking(db: Session = Depends(get_db)):
    """Endpoint para rastreo activo de rutas en tiempo real"""
    return {"status": "active", "message": "Rastreo en tiempo real disponible"}
