from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid4
from .database import get_db
from . import models, schemas

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.get("", response_model=List[schemas.Conductor])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(models.Conductor).all()

@router.post("", response_model=schemas.Conductor)
def create_driver(driver: schemas.ConductorCreate, db: Session = Depends(get_db)):
    # Check duplicate cedula
    db_cond = db.query(models.Conductor).filter(models.Conductor.cedula_conductor == driver.cedula_conductor).first()
    if db_cond:
        raise HTTPException(
            status_code=400,
            detail="La cédula ingresada ya está registrada."
        )
        

    # Resolve or create Rol for Conductor
    rol = db.query(models.Rol).filter(models.Rol.nombre_rol == "rol-conductor").first()
    if not rol:
        rol = models.Rol(nombre_rol="rol-conductor", descripcion_rol="Conductor de la flota Vextor")
        db.add(rol)
        db.commit()
        db.refresh(rol)

    # Create associated user account
    id_usuario = uuid4()
    email = f"{driver.nombre_conductor.lower()}.{driver.apellido_conductor.lower()}@vextor.com".replace(" ", "")
    # Normalize (remove tildes etc.)
    import unicodedata
    email = "".join(c for c in unicodedata.normalize("NFD", email) if unicodedata.category(c) != "Mn")

    new_user = models.Usuario(
        id_usuario=id_usuario,
        id_rol=rol.id_rol,
        nombres_usuario=driver.nombre_conductor,
        apellidos_usuario=driver.apellido_conductor,
        correo_usuario=email,
        contrasenia_usuario="pbkdf2:sha256:123456",  # Dummy secure hashed password
        telefono_usuario=driver.telefono_conductor or "",
        estado_usuario="INACTIVO" if driver.estado_conductor == "INACTIVO" else "ACTIVO"
    )
    db.add(new_user)

    new_cond = models.Conductor(
        **driver.model_dump(),
        id_usuario=id_usuario
    )
    db.add(new_cond)
    db.commit()
    db.refresh(new_cond)
    return new_cond

@router.put("/{id_conductor}", response_model=schemas.Conductor)
def update_driver(id_conductor: UUID, driver_data: schemas.ConductorUpdate, db: Session = Depends(get_db)):
    db_cond = db.query(models.Conductor).filter(models.Conductor.id_conductor == id_conductor).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor no encontrado.")

    if driver_data.cedula_conductor:
        cedula_exists = db.query(models.Conductor).filter(
            models.Conductor.id_conductor != id_conductor,
            models.Conductor.cedula_conductor == driver_data.cedula_conductor
        ).first()
        if cedula_exists:
            raise HTTPException(
                status_code=400,
                detail="La cédula ingresada ya está registrada en otro conductor."
            )

    update_dict = driver_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_cond, key, value)

    # Sync associated user
    db_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == db_cond.id_usuario).first()
    if db_user:
        if driver_data.nombre_conductor:
            db_user.nombres_usuario = driver_data.nombre_conductor
        if driver_data.apellido_conductor:
            db_user.apellidos_usuario = driver_data.apellido_conductor
        if driver_data.telefono_conductor is not None:
            db_user.telefono_usuario = driver_data.telefono_conductor
        if driver_data.estado_conductor:
            db_user.estado_usuario = "INACTIVO" if driver_data.estado_conductor == "INACTIVO" else "ACTIVO"

    db.commit()
    db.refresh(db_cond)
    return db_cond

@router.delete("/{id_conductor}")
def delete_driver(id_conductor: UUID, db: Session = Depends(get_db)):
    db_cond = db.query(models.Conductor).filter(models.Conductor.id_conductor == id_conductor).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor no encontrado.")

    # Remove the associated user account
    db_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == db_cond.id_usuario).first()

    db.delete(db_cond)
    if db_user:
        db.delete(db_user)

    db.commit()
    return {"message": "Conductor eliminado con éxito"}
