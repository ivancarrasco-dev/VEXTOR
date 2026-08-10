from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from . import models, schemas


router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[schemas.Vehiculo])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehiculo).all()

@router.post("", response_model=schemas.Vehiculo)
def create_vehicle(vehicle: schemas.VehiculoCreate, db: Session = Depends(get_db)):
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
    return new_v

@router.put("/{id_vehiculo}", response_model=schemas.Vehiculo)
def update_vehicle(id_vehiculo: UUID, vehicle_data: schemas.VehiculoUpdate, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == id_vehiculo).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")

    if vehicle_data.placa:
        plate_exists = db.query(models.Vehiculo).filter(
            models.Vehiculo.id_vehiculo != id_vehiculo,
            models.Vehiculo.placa == vehicle_data.placa.upper()
        ).first()
        if plate_exists:
            raise HTTPException(
                status_code=400,
                detail="La placa ingresada ya está registrada en otro vehículo."
            )

    update_dict = vehicle_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if key == "placa":
            value = value.upper()
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.delete("/{id_vehiculo}")
def delete_vehicle(id_vehiculo: UUID, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == id_vehiculo).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")

    # Check if there are maintenances referenced
    has_maint = db.query(models.Mantenimiento).filter(models.Mantenimiento.id_vehiculo == id_vehiculo).first()
    if has_maint:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el vehículo porque tiene registros de mantenimiento asociados."
        )

    db.delete(db_vehicle)
    db.commit()
    return {"message": "Vehículo eliminado con éxito"}
