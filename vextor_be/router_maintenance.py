from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from . import models, schemas

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

@router.get("", response_model=List[schemas.Mantenimiento])
def get_maintenances(db: Session = Depends(get_db)):
    return db.query(models.Mantenimiento).all()

@router.post("", response_model=schemas.Mantenimiento)
def create_maintenance(maint: schemas.MantenimientoCreate, db: Session = Depends(get_db)):
    new_m = models.Mantenimiento(**maint.model_dump())
    db.add(new_m)
    db.commit()
    db.refresh(new_m)

    # Side effect: if maintenance is EN_PROCESO, we can set vehicle's state to MANTENIMIENTO
    if new_m.estado_mantenimiento == "EN_PROCESO":
        v = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == new_m.id_vehiculo).first()
        if v:
            v.estado_vehiculo = "MANTENIMIENTO"
            db.commit()

    return new_m

@router.put("/{id_mantenimiento}", response_model=schemas.Mantenimiento)
def update_maintenance(id_mantenimiento: UUID, maint_data: schemas.MantenimientoUpdate, db: Session = Depends(get_db)):
    db_maint = db.query(models.Mantenimiento).filter(models.Mantenimiento.id_mantenimiento == id_mantenimiento).first()
    if not db_maint:
        raise HTTPException(status_code=404, detail="Registro de mantenimiento no encontrado.")

    update_dict = maint_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_maint, key, value)

    db.commit()
    db.refresh(db_maint)

    # Side effect: if maintenance is EN_PROCESO, we can set vehicle's state to MANTENIMIENTO
    if db_maint.estado_mantenimiento == "EN_PROCESO":
        v = db.query(models.Vehiculo).filter(models.Vehiculo.id_vehiculo == db_maint.id_vehiculo).first()
        if v:
            v.estado_vehiculo = "MANTENIMIENTO"
            db.commit()

    return db_maint

@router.delete("/{id_mantenimiento}")
def delete_maintenance(id_mantenimiento: UUID, db: Session = Depends(get_db)):
    db_maint = db.query(models.Mantenimiento).filter(models.Mantenimiento.id_mantenimiento == id_mantenimiento).first()
    if not db_maint:
        raise HTTPException(status_code=404, detail="Registro de mantenimiento no encontrado.")

    db.delete(db_maint)
    db.commit()
    return {"message": "Mantenimiento eliminado con éxito"}
