import pytest
from uuid import UUID, uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.database import get_db
from app.main import app
from app.models import Rol, Usuario
from app.core.security import hash_password, create_access_token


# Configurar BD SQLite estática para rbac tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_rbac_temp.db"
rbac_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
RbacSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=rbac_engine)


@pytest.fixture(autouse=True, scope="module")
def setup_rbac_db():
    Base.metadata.drop_all(bind=rbac_engine)
    Base.metadata.create_all(bind=rbac_engine)
    db = RbacSessionLocal()

    admin_rol = Rol(id_rol=uuid4(), nombre_rol="Administrador", descripcion_rol="Admin")
    driver_rol = Rol(id_rol=uuid4(), nombre_rol="Conductor", descripcion_rol="Driver")
    user_rol = Rol(id_rol=uuid4(), nombre_rol="Usuario", descripcion_rol="User")
    db.add_all([admin_rol, driver_rol, user_rol])
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=rbac_engine)


@pytest.fixture
def test_db():
    db = RbacSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(test_db):
    def override_get_db():
        db = RbacSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_public_registration_creates_only_normal_user(client, test_db):
    payload = {
        "fullName": "User Test",
        "email": "user@test.com",
        "password": "Password123!",
        "role": "administrador"  # Attempt privilege escalation
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "user@test.com").first()
    assert user is not None
    assert user.rol.nombre_rol == "Usuario"


def test_rbac_user_management_access_control(client, test_db):
    user_rol = test_db.query(Rol).filter(Rol.nombre_rol == "Usuario").first()
    admin_rol = test_db.query(Rol).filter(Rol.nombre_rol == "Administrador").first()

    normal_user = Usuario(
        id_usuario=uuid4(),
        nombres_usuario="Normal",
        apellidos_usuario="User",
        correo_usuario="normal@test.com",
        contrasenia_usuario=hash_password("Password123!"),
        id_rol=user_rol.id_rol
    )
    admin_user = Usuario(
        id_usuario=uuid4(),
        nombres_usuario="Admin",
        apellidos_usuario="User",
        correo_usuario="admin@test.com",
        contrasenia_usuario=hash_password("Password123!"),
        id_rol=admin_rol.id_rol
    )
    test_db.add_all([normal_user, admin_user])
    test_db.commit()

    normal_token = create_access_token({"sub": normal_user.correo_usuario, "role": "Usuario"})
    admin_token = create_access_token({"sub": admin_user.correo_usuario, "role": "Administrador"})

    # 1. Normal user attempts GET /api/users -> 403 Forbidden
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {normal_token}"})
    assert resp.status_code == 403

    # 2. Normal user attempts POST /api/users -> 403 Forbidden
    resp = client.post(
        "/api/users",
        json={
            "nombres_usuario": "Attempt",
            "apellidos_usuario": "Admin",
            "correo_usuario": "attempt@test.com",
            "contrasenia_usuario": "Password123!",
            "id_rol": str(admin_rol.id_rol)
        },
        headers={"Authorization": f"Bearer {normal_token}"}
    )
    assert resp.status_code == 403

    # 3. Admin user attempts GET /api/users -> 200 OK
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    # 4. Admin user attempts POST /api/users to create another Admin -> 200 OK
    resp = client.post(
        "/api/users",
        json={
            "nombres_usuario": "NewAdmin",
            "apellidos_usuario": "Test",
            "correo_usuario": "newadmin@test.com",
            "contrasenia_usuario": "Password123!",
            "id_rol": str(admin_rol.id_rol)
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["correo_usuario"] == "newadmin@test.com"
