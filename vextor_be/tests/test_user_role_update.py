import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol
from app.core.security import hash_password
from app.core.rate_limiter import auth_rate_limiter


@pytest.fixture
def test_db():
    auth_rate_limiter.requests.clear()
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_user_role_update_persists_in_database(test_db):
    auth_rate_limiter.requests.clear()
    client = TestClient(app)

    # Create Roles
    admin_rol = Rol(id_rol=uuid4(), nombre_rol="Administrador", descripcion_rol="Admin")
    user_rol = Rol(id_rol=uuid4(), nombre_rol="Usuario", descripcion_rol="User")
    driver_rol = Rol(id_rol=uuid4(), nombre_rol="Conductor", descripcion_rol="Driver")
    test_db.add_all([admin_rol, user_rol, driver_rol])
    test_db.commit()

    # Create Admin user
    admin_user = Usuario(
        id_usuario=uuid4(),
        id_rol=admin_rol.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="System",
        correo_usuario="admin_role_test@vextor.com",
        contrasenia_usuario=hash_password("Admin123!"),
        estado_usuario="ACTIVO"
    )
    # Create target user
    target_user = Usuario(
        id_usuario=uuid4(),
        id_rol=user_rol.id_rol,
        nombres_usuario="Juan",
        apellidos_usuario="Perez",
        correo_usuario="juan_role_test@vextor.com",
        contrasenia_usuario=hash_password("User123!"),
        estado_usuario="ACTIVO"
    )
    test_db.add_all([admin_user, target_user])
    test_db.commit()

    # Login as Admin
    login_res = client.post("/api/auth/login", json={"email": "admin_role_test@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200, login_res.text
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify initial role of target user
    assert target_user.id_rol == user_rol.id_rol

    # Update role to Conductor
    update_res = client.put(
        f"/api/users/{target_user.id_usuario}",
        json={"id_rol": str(driver_rol.id_rol)},
        headers=headers
    )
    assert update_res.status_code == 200, update_res.text
    assert update_res.json()["id_rol"] == str(driver_rol.id_rol)

    # Re-query user directly from DB to ensure true persistence
    refreshed_user = test_db.query(Usuario).filter(Usuario.id_usuario == target_user.id_usuario).first()
    assert refreshed_user.id_rol == driver_rol.id_rol
    assert refreshed_user.rol.nombre_rol == "Conductor"
