from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid4
from database import get_db
import models, schemas
from router_auth import get_current_user
from router_activities import record_activity, create_notification

import re

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

def validate_colombian_phone(phone: str):
    if not phone:
        return
    clean_phone = re.sub(r"\s+", "", phone)
    pattern = r"^(\+57|57)?3[0-9]{9}$"
    if not re.match(pattern, clean_phone):
        raise HTTPException(
            status_code=400,
            detail="Formato de celular inválido en Colombia. Debe tener 10 dígitos y comenzar con 3 (ej. 3123456789)."
        )

def validate_colombian_cedula(cedula: str):
    pattern = r"^[0-9]{3,10}$"
    if not re.match(pattern, cedula.strip()):
        raise HTTPException(
            status_code=400,
            detail="Formato de cédula de ciudadanía inválido en Colombia. Debe contener únicamente de 3 a 10 dígitos numéricos."
        )

@router.get("", response_model=List[schemas.Conductor])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(models.Conductor).all()

@router.post("", response_model=schemas.Conductor)
def create_driver(driver: schemas.ConductorCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    # Colombian driver validations
    validate_colombian_cedula(driver.cedula_conductor)
    validate_colombian_phone(driver.telefono_conductor)

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

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    cond_name = f"{new_cond.nombre_conductor} {new_cond.apellido_conductor}"
    record_activity(db, current_user.id_usuario, user_name, "CREAR", "Conductores", f"Registró al conductor {cond_name} con cédula {new_cond.cedula_conductor}.", str(new_cond.id_conductor))
    create_notification(db, "Conductor registrado", f"El conductor {cond_name} fue registrado por {user_name}.", "conductor")

    return new_cond

@router.put("/{id_conductor}", response_model=schemas.Conductor)
def update_driver(id_conductor: UUID, driver_data: schemas.ConductorUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    db_cond = db.query(models.Conductor).filter(models.Conductor.id_conductor == id_conductor).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor no encontrado.")

    if driver_data.cedula_conductor:
        validate_colombian_cedula(driver_data.cedula_conductor)
        cedula_exists = db.query(models.Conductor).filter(
            models.Conductor.id_conductor != id_conductor,
            models.Conductor.cedula_conductor == driver_data.cedula_conductor
        ).first()
        if cedula_exists:
            raise HTTPException(
                status_code=400,
                detail="La cédula ingresada ya está registrada en otro conductor."
            )

    if driver_data.telefono_conductor is not None:
        validate_colombian_phone(driver_data.telefono_conductor)

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

    # Record Activity
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    cond_name = f"{db_cond.nombre_conductor} {db_cond.apellido_conductor}"
    record_activity(db, current_user.id_usuario, user_name, "EDITAR", "Conductores", f"Editó al conductor {cond_name}.", str(db_cond.id_conductor))

    return db_cond

@router.delete("/{id_conductor}")
def delete_driver(id_conductor: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    db_cond = db.query(models.Conductor).filter(models.Conductor.id_conductor == id_conductor).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor no encontrado.")

    # Remove the associated user account
    db_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == db_cond.id_usuario).first()

    cond_name_deleted = f"{db_cond.nombre_conductor} {db_cond.apellido_conductor}"
    cedula_deleted = db_cond.cedula_conductor

    db.delete(db_cond)
    if db_user:
        db.delete(db_user)

    db.commit()

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "ELIMINAR", "Conductores", f"Eliminó al conductor {cond_name_deleted} (Cédula: {cedula_deleted}).", str(id_conductor))
    create_notification(db, "Conductor eliminado", f"El conductor {cond_name_deleted} fue eliminado por {user_name}.", "conductor")

    return {"message": "Conductor eliminado con éxito"}
