from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid4
from database import get_db
import models
import schemas
from router_auth import hash_password, get_current_user
from router_activities import record_activity, create_notification

router = APIRouter(prefix="/api/users", tags=["Users Admin"])

@router.get("", response_model=List[schemas.Usuario])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

@router.post("", response_model=schemas.Usuario)
def create_admin_user(user: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    # Check if duplicate email
    db_u = db.query(models.Usuario).filter(models.Usuario.correo_usuario == user.correo_usuario.strip().lower()).first()
    if db_u:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")

    # Check if id_rol is specified or use a fallback
    id_rol = user.id_rol
    if not id_rol:
        # Fallback to Admin or Super Admin
        rol = db.query(models.Rol).filter(models.Rol.nombre_rol == "Super Administrador").first()
        if rol:
            id_rol = rol.id_rol

    hashed = hash_password(user.contrasenia_usuario)
    new_user = models.Usuario(
        id_usuario=uuid4(),
        id_rol=id_rol,
        nombres_usuario=user.nombres_usuario,
        apellidos_usuario=user.apellidos_usuario,
        correo_usuario=user.correo_usuario.strip().lower(),
        contrasenia_usuario=hashed,
        telefono_usuario=user.telefono_usuario,
        estado_usuario=user.estado_usuario
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    target_name = f"{new_user.nombres_usuario} {new_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "CREAR", "Usuarios", f"Registró al usuario administrativo {target_name}.", str(new_user.id_usuario))
    create_notification(db, "Usuario registrado", f"El usuario {target_name} ({new_user.correo_usuario}) fue registrado por {user_name}.", "usuario")

    return new_user

@router.put("/{id_usuario}", response_model=schemas.Usuario)
def update_user(id_usuario: UUID, user_data: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    db_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if user_data.correo_usuario:
        email_exists = db.query(models.Usuario).filter(
            models.Usuario.id_usuario != id_usuario,
            models.Usuario.correo_usuario == user_data.correo_usuario.strip().lower()
        ).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="El correo ya está registrado en otro usuario.")

    update_dict = user_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if key == "correo_usuario":
            value = value.strip().lower()
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    # Record Activity
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    target_name = f"{db_user.nombres_usuario} {db_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "EDITAR", "Usuarios", f"Editó al usuario {target_name}.", str(db_user.id_usuario))

    return db_user

@router.delete("/{id_usuario}")
def delete_user(id_usuario: UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    db_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Prevent deleting itself or primary constraints
    target_name_deleted = f"{db_user.nombres_usuario} {db_user.apellidos_usuario}".strip()
    db.delete(db_user)
    db.commit()

    # Record Activity & Create Notification
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "ELIMINAR", "Usuarios", f"Eliminó al usuario administrativo {target_name_deleted}.", str(id_usuario))
    create_notification(db, "Usuario eliminado", f"El usuario administrativo {target_name_deleted} fue eliminado por {user_name}.", "usuario")

    return {"message": "Usuario eliminado con éxito"}
