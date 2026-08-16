from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from database import get_db
import models, schemas
from router_auth import get_current_user, require_admin
from router_activities import record_activity, create_notification
from datetime import datetime

router = APIRouter(prefix="/api/routes", tags=["Routes"])

# --- DRIVER SPECIFIC ENDPOINTS ---

@router.get("/driver/my-routes")
def get_driver_my_routes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    conductor = db.query(models.Conductor).filter(models.Conductor.id_usuario == current_user.id_usuario).first()
    if not conductor:
        user_full_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
        return {
            "conductor": {
                "id_conductor": None,
                "nombre_conductor": user_full_name,
                "estado_conductor": "DISPONIBLE",
                "cedula": "",
                "licencia": ""
            },
            "active_route": None,
            "assigned_routes": [],
            "history_routes": []
        }

    # Query driver's assigned routes
    asigs = db.query(models.AsignacionConductor).filter(
        models.AsignacionConductor.id_conductor == conductor.id_conductor
    ).all()

    assigned_route_ids = [a.id_ruta for a in asigs]
    routes = db.query(models.Ruta).filter(models.Ruta.id_ruta.in_(assigned_route_ids)).all() if assigned_route_ids else []

    active_route = None
    assigned_routes = []
    history_routes = []

    for r in routes:
        # Find assigned vehicle
        asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == r.id_ruta).first()
        vehiculo_info = None
        if asig_v:
            v = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == asig_v.id_vehiculo).first()
            if v:
                vehiculo_info = {
                    "id_vehiculo": str(v.id_vehiculo),
                    "placa": v.placa,
                    "marca": v.marca,
                    "modelo": v.modelo,
                    "tipo": v.tipo_vehiculo
                }

        route_dict = {
            "id_ruta": str(r.id_ruta),
            "codigo_ruta": r.codigo_ruta,
            "nombre_ruta": r.nombre_ruta,
            "origen": r.origen,
            "destino": r.destino,
            "fecha_programada": r.fecha_programada.isoformat() if r.fecha_programada else None,
            "hora_inicio_real": r.hora_inicio_real.isoformat() if r.hora_inicio_real else None,
            "hora_fin_real": r.hora_fin_real.isoformat() if r.hora_fin_real else None,
            "estado_ruta": r.estado_ruta,
            "motivo_suspension": r.motivo_suspension,
            "vehiculo": vehiculo_info,
            "id_conductor": str(conductor.id_conductor)
        }

        if r.estado_ruta in ("EN_PROCESO", "EN_CURSO"):
            active_route = route_dict
        elif r.estado_ruta == "PROGRAMADA":
            assigned_routes.append(route_dict)
        else:
            history_routes.append(route_dict)

    # Sort upcoming by date
    assigned_routes.sort(key=lambda x: x["fecha_programada"] or "")
    # Sort history descending
    history_routes.sort(key=lambda x: x["hora_fin_real"] or x["fecha_programada"] or "", reverse=True)

    return {
        "conductor": {
            "id_conductor": str(conductor.id_conductor),
            "nombre_conductor": f"{conductor.nombre_conductor} {conductor.apellido_conductor}",
            "estado_conductor": conductor.estado_conductor or "DISPONIBLE",
            "cedula": conductor.cedula_conductor,
            "licencia": conductor.licencia
        },
        "active_route": active_route,
        "assigned_routes": assigned_routes,
        "history_routes": history_routes
    }


@router.post("/{id_ruta}/start")
def start_route(id_ruta: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    conductor = db.query(models.Conductor).filter(models.Conductor.id_usuario == current_user.id_usuario).first()
    if not conductor:
        raise HTTPException(status_code=400, detail="No se encontró un perfil de conductor asociado a esta cuenta.")

    route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not route:
        raise HTTPException(status_code=404, detail="La ruta solicitada no existe.")

    # Validation 1: Assignment check
    asig_c = db.query(models.AsignacionConductor).filter(
        models.AsignacionConductor.id_ruta == id_ruta,
        models.AsignacionConductor.id_conductor == conductor.id_conductor
    ).first()
    if not asig_c:
        raise HTTPException(status_code=403, detail="No tienes asignada esta ruta.")

    # Validation 2: Driver single active route check
    if conductor.estado_conductor == "EN_RUTA":
        raise HTTPException(status_code=400, detail="Ya tienes una ruta activa en curso. Finaliza la ruta actual antes de iniciar otra.")

    # Validation 3: Route state check
    if route.estado_ruta in ("EN_PROCESO", "EN_CURSO"):
        raise HTTPException(status_code=400, detail="Esta ruta ya se encuentra en curso.")
    if route.estado_ruta in ("COMPLETADA", "CANCELADA"):
        raise HTTPException(status_code=400, detail="No se puede iniciar una ruta que ya ha sido completada o cancelada.")

    # Validation 4: Assigned vehicle availability check
    asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first()
    if not asig_v:
        raise HTTPException(status_code=400, detail="Esta ruta no tiene un vehículo asignado. Contacte a un administrador.")

    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == asig_v.id_vehiculo).first()
    if vehiculo and vehiculo.estado_vehiculo == "EN_RUTA":
        # Check if vehicle is actually on another active route
        other_active_v = db.query(models.Ruta).join(models.AsignacionVehiculo).filter(
            models.AsignacionVehiculo.id_vehiculo == vehiculo.id_vehiculo,
            models.Ruta.id_ruta != id_ruta,
            models.Ruta.estado_ruta == "EN_PROCESO"
        ).first()
        if other_active_v:
            raise HTTPException(status_code=400, detail=f"El vehículo con placa {vehiculo.placa} ya está siendo utilizado en otra ruta activa.")

    # Update states
    now = datetime.now()
    route.estado_ruta = "EN_PROCESO"
    route.hora_inicio_real = now
    conductor.estado_conductor = "EN_RUTA"
    if vehiculo:
        vehiculo.estado_vehiculo = "EN_RUTA"

    # Parse initial coordinates from route origin e.g. "4.7554, -74.0463"
    init_lat, init_lng = 4.7110, -74.0721 # Default Bogotá
    if route.origen and "," in route.origen:
        try:
            parts = route.origen.split(",")
            init_lat = float(parts[0].strip())
            init_lng = float(parts[1].strip())
        except ValueError:
            pass

    # Create or update SeguimientoRuta record
    seg = db.query(models.SeguimientoRuta).filter(models.SeguimientoRuta.id_ruta == id_ruta).first()
    if not seg:
        seg = models.SeguimientoRuta(
            id_ruta=id_ruta,
            id_conductor=conductor.id_conductor,
            id_vehiculo=vehiculo.id_vehiculo if vehiculo else conductor.id_conductor,
            latitud=init_lat,
            longitud=init_lng,
            velocidad=0.0,
            heading=0.0,
            ultima_actualizacion=now,
            estado_seguimiento="ACTIVO"
        )
        db.add(seg)
    else:
        seg.id_conductor = conductor.id_conductor
        if vehiculo:
            seg.id_vehiculo = vehiculo.id_vehiculo
        seg.latitud = init_lat
        seg.longitud = init_lng
        seg.ultima_actualizacion = now
        seg.estado_seguimiento = "ACTIVO"

    db.commit()

    # Log initial position in history
    hist = models.HistorialUbicacion(
        id_seguimiento=seg.id_seguimiento,
        id_ruta=id_ruta,
        latitud=init_lat,
        longitud=init_lng,
        velocidad=0.0,
        fecha_hora=now
    )
    db.add(hist)
    db.commit()

    # Record activity & notification
    cond_name = f"{conductor.nombre_conductor} {conductor.apellido_conductor}"
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "INICIAR_RUTA", "Rutas", f"El conductor {cond_name} inició la ruta {route.nombre_ruta} ({route.codigo_ruta}).", str(id_ruta))
    create_notification(db, "Ruta en curso", f"El conductor {cond_name} ha iniciado el recorrido de la ruta {route.nombre_ruta}.", "ruta")

    return {
        "message": "Ruta iniciada con éxito",
        "id_ruta": str(id_ruta),
        "estado_ruta": "EN_PROCESO",
        "estado_conductor": "EN_RUTA"
    }


@router.post("/{id_ruta}/finish")
def finish_route(id_ruta: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    conductor = db.query(models.Conductor).filter(models.Conductor.id_usuario == current_user.id_usuario).first()
    if not conductor:
        raise HTTPException(status_code=400, detail="No se encontró un perfil de conductor asociado a esta cuenta.")

    route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not route:
        raise HTTPException(status_code=404, detail="La ruta solicitada no existe.")

    if route.estado_ruta not in ("EN_PROCESO", "EN_CURSO"):
        raise HTTPException(status_code=400, detail="La ruta no se encuentra en curso.")

    now = datetime.now()
    route.estado_ruta = "COMPLETADA"
    route.hora_fin_real = now

    if conductor:
        conductor.estado_conductor = "DISPONIBLE"

    # Reset vehicle state
    asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first()
    if asig_v:
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == asig_v.id_vehiculo).first()
        if vehiculo:
            vehiculo.estado_vehiculo = "DISPONIBLE"

    # Set tracking session to FINALIZADO
    seg = db.query(models.SeguimientoRuta).filter(models.SeguimientoRuta.id_ruta == id_ruta).first()
    if seg:
        seg.estado_seguimiento = "FINALIZADO"
        seg.ultima_actualizacion = now

    db.commit()

    # Activity & Notification
    cond_name = f"{conductor.nombre_conductor} {conductor.apellido_conductor}" if conductor else "Conductor"
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "FINALIZAR_RUTA", "Rutas", f"El conductor {cond_name} finalizó la ruta {route.nombre_ruta} ({route.codigo_ruta}).", str(id_ruta))
    create_notification(db, "Ruta completada", f"La ruta {route.nombre_ruta} ha sido completada exitosamente por {cond_name}.", "ruta")

    return {
        "message": "Ruta finalizada exitosamente.",
        "id_ruta": str(id_ruta),
        "estado_ruta": "COMPLETADA",
        "estado_conductor": "DISPONIBLE"
    }


@router.post("/{id_ruta}/location")
def update_driver_location(id_ruta: UUID, body: schemas.UbicacionUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not route or route.estado_ruta not in ("EN_PROCESO", "EN_CURSO"):
        raise HTTPException(status_code=400, detail="No se pueden registrar posiciones en una ruta que no esté activa.")

    seg = db.query(models.SeguimientoRuta).filter(models.SeguimientoRuta.id_ruta == id_ruta).first()
    now = datetime.now()

    if not seg:
        asig_c = db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).first()
        asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first()
        seg = models.SeguimientoRuta(
            id_ruta=id_ruta,
            id_conductor=asig_c.id_conductor if asig_c else current_user.id_usuario,
            id_vehiculo=asig_v.id_vehiculo if asig_v else current_user.id_usuario,
            latitud=body.latitud,
            longitud=body.longitud,
            velocidad=body.velocidad or 0.0,
            heading=body.heading or 0.0,
            ultima_actualizacion=now,
            estado_seguimiento="ACTIVO"
        )
        db.add(seg)
    else:
        seg.latitud = body.latitud
        seg.longitud = body.longitud
        seg.velocidad = body.velocidad or 0.0
        seg.heading = body.heading or 0.0
        seg.ultima_actualizacion = now
        seg.estado_seguimiento = "ACTIVO"

    hist = models.HistorialUbicacion(
        id_seguimiento=seg.id_seguimiento,
        id_ruta=id_ruta,
        latitud=body.latitud,
        longitud=body.longitud,
        velocidad=body.velocidad or 0.0,
        fecha_hora=now
    )
    db.add(hist)
    db.commit()

    return {"message": "Ubicación actualizada correctamente."}


@router.get("/active-tracking")
def get_active_tracking(db: Session = Depends(get_db)):
    active_segs = db.query(models.SeguimientoRuta).filter(
        models.SeguimientoRuta.estado_seguimiento == "ACTIVO"
    ).all()

    result = []
    now = datetime.now()

    for s in active_segs:
        # Check if route is still in process
        route = db.query(models.Ruta).filter(models.Ruta.id_ruta == s.id_ruta).first()
        if not route or route.estado_ruta not in ("EN_PROCESO", "EN_CURSO"):
            continue

        conductor = db.query(models.Conductor).filter(models.Conductor.id_conductor == s.id_conductor).first()
        vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == s.id_vehiculo).first()

        seconds_since_update = int((now - s.ultima_actualizacion).total_seconds()) if s.ultima_actualizacion else 999
        is_stale = seconds_since_update > 45

        result.append({
            "id_seguimiento": str(s.id_seguimiento),
            "id_ruta": str(s.id_ruta),
            "codigo_ruta": route.codigo_ruta,
            "nombre_ruta": route.nombre_ruta,
            "origen": route.origen,
            "destino": route.destino,
            "latitud": float(s.latitud),
            "longitud": float(s.longitud),
            "velocidad": float(s.velocidad or 0.0),
            "heading": float(s.heading or 0.0),
            "ultima_actualizacion": s.ultima_actualizacion.isoformat() if s.ultima_actualizacion else None,
            "segundos_transcurridos": seconds_since_update,
            "is_stale": is_stale,
            "conductor": {
                "id_conductor": str(conductor.id_conductor) if conductor else None,
                "nombre": f"{conductor.nombre_conductor} {conductor.apellido_conductor}" if conductor else "Conductor",
                "cedula": conductor.cedula_conductor if conductor else "",
                "telefono": conductor.telefono_conductor if conductor else ""
            },
            "vehiculo": {
                "id_vehiculo": str(vehiculo.id_vehiculo) if vehiculo else None,
                "placa": vehiculo.placa if vehiculo else "N/A",
                "marca": vehiculo.marca if vehiculo else "",
                "modelo": vehiculo.modelo if vehiculo else "",
                "tipo": vehiculo.tipo_vehiculo if vehiculo else ""
            }
        })

    return result


@router.get("", response_model=List[schemas.Ruta])
def get_routes(db: Session = Depends(get_db)):
    # Join route table with assignment tables to find current active assignments
    # and return them as id_conductor and id_vehiculo fields.
    routes = db.query(models.Ruta).all()
    for r in routes:
        # Find active assignment (or any assignment)
        asig_cond = db.query(models.AsignacionConductor).filter(
            models.AsignacionConductor.id_ruta == r.id_ruta
        ).first()
        asig_veh = db.query(models.AsignacionVehiculo).filter(
            models.AsignacionVehiculo.id_ruta == r.id_ruta
        ).first()
        r.id_conductor = asig_cond.id_conductor if asig_cond else None
        r.id_vehiculo = asig_veh.id_vehiculo if asig_veh else None
    return routes

@router.post("", response_model=schemas.Ruta)
def create_route(route: schemas.RutaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    # Check duplicate code
    db_route = db.query(models.Ruta).filter(models.Ruta.codigo_ruta == route.codigo_ruta.strip().upper()).first()
    if db_route:
        raise HTTPException(
            status_code=400,
            detail="El código de ruta ya está registrado."
        )

    new_r = models.Ruta(
        codigo_ruta=route.codigo_ruta.strip().upper(),
        nombre_ruta=route.nombre_ruta.strip(),
        origen=route.origen.strip(),
        destino=route.destino.strip(),
        fecha_programada=route.fecha_programada,
        hora_inicio_real=route.hora_inicio_real,
        hora_fin_real=route.hora_fin_real,
        estado_ruta=route.estado_ruta or "PROGRAMADA",
        motivo_suspension=route.motivo_suspension or ""
    )
    db.add(new_r)
    db.commit()
    db.refresh(new_r)

    # Create Assignments
    if route.id_conductor:
        asig_c = models.AsignacionConductor(id_conductor=route.id_conductor, id_ruta=new_r.id_ruta)
        db.add(asig_c)
    if route.id_vehiculo:
        asig_v = models.AsignacionVehiculo(id_vehiculo=route.id_vehiculo, id_ruta=new_r.id_ruta)
        db.add(asig_v)

    db.commit()

    new_r.id_conductor = route.id_conductor
    new_r.id_vehiculo = route.id_vehiculo

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "CREAR", "Rutas", f"Creó la ruta {new_r.nombre_ruta} ({new_r.codigo_ruta}).", str(new_r.id_ruta))
    create_notification(db, "Nueva ruta programada", f"La ruta {new_r.nombre_ruta} ({new_r.codigo_ruta}) ha sido programada por {user_name}.", "ruta")

    return new_r

@router.put("/{id_ruta}", response_model=schemas.Ruta)
def update_route(id_ruta: UUID, route_data: schemas.RutaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    db_route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    if route_data.codigo_ruta:
        code_exists = db.query(models.Ruta).filter(
            models.Ruta.id_ruta != id_ruta,
            models.Ruta.codigo_ruta == route_data.codigo_ruta.strip().upper()
        ).first()
        if code_exists:
            raise HTTPException(
                status_code=400,
                detail="El código de ruta ya está registrado en otra ruta."
            )

    update_dict = route_data.model_dump(exclude_unset=True)
    # Extract assignments from update dict to handle them separately
    target_id_conductor = update_dict.pop("id_conductor", None)
    target_id_vehiculo = update_dict.pop("id_vehiculo", None)

    for key, value in update_dict.items():
        if key == "codigo_ruta" and value:
            value = value.strip().upper()
        elif key == "nombre_ruta" or key == "origen" or key == "destino":
            if value:
                value = value.strip()
        setattr(db_route, key, value)

    # Sync assignments
    if target_id_conductor:
        # Check if already assigned
        asig_c = db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).first()
        if asig_c:
            asig_c.id_conductor = target_id_conductor
        else:
            asig_c = models.AsignacionConductor(id_conductor=target_id_conductor, id_ruta=id_ruta)
            db.add(asig_c)

    if target_id_vehiculo:
        asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first()
        if asig_v:
            asig_v.id_vehiculo = target_id_vehiculo
        else:
            asig_v = models.AsignacionVehiculo(id_vehiculo=target_id_vehiculo, id_ruta=id_ruta)
            db.add(asig_v)

    db.commit()
    db.refresh(db_route)

    asig_c = db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).first()
    asig_v = db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first()
    db_route.id_conductor = target_id_conductor or (asig_c.id_conductor if asig_c else None)
    db_route.id_vehiculo = target_id_vehiculo or (asig_v.id_vehiculo if asig_v else None)

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "EDITAR", "Rutas", f"Editó la ruta {db_route.nombre_ruta} ({db_route.codigo_ruta}).", str(db_route.id_ruta))
    create_notification(db, "Ruta actualizada", f"La ruta {db_route.nombre_ruta} ({db_route.codigo_ruta}) ha sido actualizada por {user_name}.", "ruta")

    return db_route

@router.delete("/{id_ruta}")
def delete_route(id_ruta: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    db_route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    # Remove assignments first due to ON DELETE RESTRICT in SQL (if any constraint exists, or delete cascades)
    codigo_deleted = db_route.codigo_ruta
    nombre_deleted = db_route.nombre_ruta

    db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).delete()
    db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).delete()

    db.delete(db_route)
    db.commit()

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "ELIMINAR", "Rutas", f"Eliminó la ruta {nombre_deleted} ({codigo_deleted}).", str(id_ruta))
    create_notification(db, "Ruta eliminada", f"La ruta {nombre_deleted} ({codigo_deleted}) fue eliminada por {user_name}.", "ruta")

    return {"message": "Ruta eliminada con éxito"}
