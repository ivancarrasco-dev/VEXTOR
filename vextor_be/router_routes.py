from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/routes", tags=["Routes"])

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
def create_route(route: schemas.RutaCreate, db: Session = Depends(get_db)):
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
    return new_r

@router.put("/{id_ruta}", response_model=schemas.Ruta)
def update_route(id_ruta: UUID, route_data: schemas.RutaUpdate, db: Session = Depends(get_db)):
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

    db_route.id_conductor = target_id_conductor or db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).first().id_conductor
    db_route.id_vehiculo = target_id_vehiculo or db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).first().id_vehiculo

    return db_route

@router.delete("/{id_ruta}")
def delete_route(id_ruta: UUID, db: Session = Depends(get_db)):
    db_route = db.query(models.Ruta).filter(models.Ruta.id_ruta == id_ruta).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")

    # Remove assignments first due to ON DELETE RESTRICT in SQL (if any constraint exists, or delete cascades)
    db.query(models.AsignacionConductor).filter(models.AsignacionConductor.id_ruta == id_ruta).delete()
    db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_ruta == id_ruta).delete()

    db.delete(db_route)
    db.commit()
    return {"message": "Ruta eliminada con éxito"}
