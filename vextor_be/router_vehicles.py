from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from database import get_db
import models, schemas
from router_auth import get_current_user, require_admin
from router_activities import record_activity, create_notification

import re

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

def validate_colombian_plate(plate: str):
    pattern = r"^[A-Za-z]{3}-?([0-9]{3}|[0-9]{2}[A-Za-z])$"
    if not re.match(pattern, plate.strip()):
        raise HTTPException(
            status_code=400,
            detail="Formato de placa inválido en Colombia. Debe tener 3 letras y terminar con 3 números o 2 números y una letra (ej. ABC-123 o ABC-12C)."
        )

@router.get("", response_model=List[schemas.Vehiculo])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehiculo).all()

@router.post("", response_model=schemas.Vehiculo)
def create_vehicle(vehicle: schemas.VehiculoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    # Colombian plate validation
    validate_colombian_plate(vehicle.placa)

    # Check for duplicate plate
    db_vehicle = db.query(models.Vehiculo).filter(models.Vehiculo.placa == vehicle.placa.upper()).first()
    if db_vehicle:
        raise HTTPException(
            status_code=400,
            detail="La placa ingresada ya existe en el sistema."
        )
    new_v = models.Vehiculo(**vehicle.model_dump())
    new_v.placa = new_v.placa.upper()
    db.add(new_v)
    db.commit()
    db.refresh(new_v)

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "CREAR", "Vehículos", f"Registró el vehículo {new_v.marca} {new_v.modelo} de placas {new_v.placa}.", str(new_v.id_vehiculo))
    create_notification(db, "Vehículo registrado", f"El vehículo {new_v.marca} {new_v.modelo} ({new_v.placa}) fue agregado por {user_name}.", "vehiculo")

    return new_v

@router.put("/{id_vehiculo}", response_model=schemas.Vehiculo)
def update_vehicle(id_vehiculo: UUID, vehicle_data: schemas.VehiculoUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    db_vehicle = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == id_vehiculo).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")

    if vehicle_data.placa:
        validate_colombian_plate(vehicle_data.placa)
        plate_exists = db.query(models.Vehiculo).filter(
            models.Vehiculo.id_vehiculo != id_vehiculo,
            models.Vehiculo.placa == vehicle_data.placa.upper()
        ).first()
        if plate_exists:
            raise HTTPException(
                status_code=400,
                detail="La placa ingresada ya está registrada en otro vehículo."
            )

    old_plate = db_vehicle.placa
    update_dict = vehicle_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if key == "placa":
            value = value.upper()
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)

    # Record Activity
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "EDITAR", "Vehículos", f"Editó el vehículo de placas {db_vehicle.placa}.", str(db_vehicle.id_vehiculo))

    return db_vehicle

from sqlalchemy.exc import IntegrityError

@router.delete("/{id_vehiculo}")
def delete_vehicle(id_vehiculo: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    db_vehicle = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == id_vehiculo).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")

    # 1. Check if assigned to an active or scheduled route
    active_route_asig = db.query(models.AsignacionVehiculo).join(models.Ruta).filter(
        models.AsignacionVehiculo.id_vehiculo == id_vehiculo,
        models.Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO", "EN_CURSO"])
    ).first()
    if active_route_asig:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el vehículo porque está asignado a una ruta activa o programada actualmente."
        )

    # 2. Check if assigned to active/in-process maintenance
    active_maint = db.query(models.Mantenimiento).filter(
        models.Mantenimiento.id_vehiculo == id_vehiculo,
        models.Mantenimiento.estado_mantenimiento.in_(["PROGRAMADO", "EN_PROCESO"])
    ).first()
    if active_maint:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el vehículo porque tiene un mantenimiento activo o programado actualmente."
        )

    placa_deleted = db_vehicle.placa
    marca_deleted = db_vehicle.marca
    modelo_deleted = db_vehicle.modelo
    try:
        # Clean up historical assignments and finished maintenance logs for this vehicle
        db.query(models.AsignacionVehiculo).filter(models.AsignacionVehiculo.id_vehiculo == id_vehiculo).delete()
        db.query(models.Mantenimiento).filter(models.Mantenimiento.id_vehiculo == id_vehiculo).delete()
        db.query(models.SeguimientoRuta).filter(models.SeguimientoRuta.id_vehiculo == id_vehiculo).delete()

        db.delete(db_vehicle)
        db.commit()

        # Record Activity & Create Notification
        user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
        record_activity(db, current_user.id_usuario, user_name, "ELIMINAR", "Vehículos", f"Eliminó el vehículo {marca_deleted} {modelo_deleted} de placas {placa_deleted}.", str(id_vehiculo))
        create_notification(db, "Vehículo eliminado", f"El vehículo {marca_deleted} {modelo_deleted} ({placa_deleted}) fue eliminado por {user_name}.", "vehiculo")

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el vehículo debido a restricciones relacionales en el sistema."
        )
    return {"message": "Vehículo eliminado con éxito"}
