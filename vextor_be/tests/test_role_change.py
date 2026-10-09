import pytest
import uuid
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.models import Usuario, Rol, Conductor
from app.services.crud_services import UserService

def test_user_role_change_and_driver_sync():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    admin_rol = Rol(id_rol=uuid.uuid4(), nombre_rol="Administrador", descripcion_rol="Admin")
    driver_rol = Rol(id_rol=uuid.uuid4(), nombre_rol="Conductor", descripcion_rol="Driver")
    user_rol = Rol(id_rol=uuid.uuid4(), nombre_rol="Usuario", descripcion_rol="User")
    db.add_all([admin_rol, driver_rol, user_rol])
    db.commit()

    u = Usuario(
        id_usuario=uuid.uuid4(),
        id_rol=user_rol.id_rol,
        nombres_usuario="Carlos",
        apellidos_usuario="Gomez",
        correo_usuario="carlos@vextor.com",
        contrasenia_usuario="hashedpwd",
        estado_usuario="ACTIVO"
    )
    db.add(u)
    db.commit()

    # 1. Update role to Conductor
    updated = UserService.update(u.id_usuario, {"id_rol": driver_rol.id_rol}, db)
    assert updated.id_rol == driver_rol.id_rol

    cond = db.query(Conductor).filter(Conductor.id_usuario == u.id_usuario).first()
    assert cond is not None
    assert cond.estado_conductor == "DISPONIBLE"

    # 2. Update role to Administrador
    updated2 = UserService.update(u.id_usuario, {"id_rol": admin_rol.id_rol}, db)
    assert updated2.id_rol == admin_rol.id_rol

    cond2 = db.query(Conductor).filter(Conductor.id_usuario == u.id_usuario).first()
    assert cond2.estado_conductor == "INACTIVO"

    db.close()
