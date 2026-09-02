"""
Pruebas de creación y sincronización de conductores y cuentas de usuario
"""
import pytest
import uuid
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.models import Usuario, Rol, Conductor
from app.api.routes.crud import create_driver
from app.schemas import ConductorCreate


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    admin_rol = Rol(nombre_rol="Administrador", descripcion_rol="Admin")
    cond_rol = Rol(nombre_rol="Conductor", descripcion_rol="Conductor")
    db.add(admin_rol)
    db.add(cond_rol)
    db.commit()

    admin_user = Usuario(
        id_usuario=uuid.uuid4(),
        id_rol=admin_rol.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="System",
        correo_usuario="admin_sync@vextor.com",
        contrasenia_usuario="hashed",
        estado_usuario="ACTIVO"
    )
    db.add(admin_user)
    db.commit()

    yield db, admin_user

    db.close()


def test_create_multiple_drivers_success(db_session):
    db, admin_user = db_session

    # Driver 1
    d1_payload = ConductorCreate(
        nombre_conductor="Carlos",
        apellido_conductor="Mendoza",
        cedula_conductor="1234567890",
        telefono_conductor="3001234567",
        licencia="C2",
        estado_conductor="DISPONIBLE",
        fecha_ingreso=date(2025, 1, 1)
    )

    res1 = create_driver(driver=d1_payload, db=db, current_user=admin_user)
    assert res1.nombre_conductor == "Carlos"
    assert res1.id_usuario != admin_user.id_usuario

    # Driver 2
    d2_payload = ConductorCreate(
        nombre_conductor="Ana",
        apellido_conductor="Gómez",
        cedula_conductor="9876543210",
        telefono_conductor="3009876543",
        licencia="C1",
        estado_conductor="DISPONIBLE",
        fecha_ingreso=date(2025, 1, 2)
    )

    res2 = create_driver(driver=d2_payload, db=db, current_user=admin_user)
    assert res2.nombre_conductor == "Ana"
    assert res2.id_usuario != admin_user.id_usuario
    assert res1.id_usuario != res2.id_usuario

    # Verify users created in DB
    users_count = db.query(Usuario).count()
    assert users_count == 3
