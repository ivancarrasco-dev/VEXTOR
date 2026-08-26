import pytest
from uuid import UUID, uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.database import get_db
from app.main import app
from app.models import Rol, Usuario
from app.core.security import hash_password, create_access_token, verify_password

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


def test_public_registration_with_driver_attempt(client, test_db):
    payload = {
        "fullName": "Driver Attempt",
        "email": "driverattempt@test.com",
        "password": "Password123!",
        "role": "Conductor"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "driverattempt@test.com").first()
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


def test_last_administrator_protection(client, test_db):
    admin_rol = test_db.query(Rol).filter(Rol.nombre_rol == "Administrador").first()
    user_rol = test_db.query(Rol).filter(Rol.nombre_rol == "Usuario").first()

    # Deactivate any previously created admins to test sole admin protection
    existing_admins = test_db.query(Usuario).filter(Usuario.id_rol == admin_rol.id_rol).all()
    for u in existing_admins:
        u.estado_usuario = "INACTIVO"
    test_db.commit()

    # Create sole active admin
    sole_admin = Usuario(
        id_usuario=uuid4(),
        nombres_usuario="Sole",
        apellidos_usuario="Admin",
        correo_usuario="soleadmin@test.com",
        contrasenia_usuario=hash_password("Password123!"),
        id_rol=admin_rol.id_rol,
        estado_usuario="ACTIVO",
        requiere_cambio_clave=False
    )
    test_db.add(sole_admin)
    test_db.commit()

    admin_token = create_access_token({"sub": sole_admin.correo_usuario, "role": "Administrador"})

    # 1. Attempt to delete sole admin -> 400 Bad Request
    resp = client.delete(f"/api/users/{sole_admin.id_usuario}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 400
    assert "único Administrador" in resp.json()["detail"]

    # 2. Attempt to demote sole admin to Usuario -> 400 Bad Request
    resp = client.put(
        f"/api/users/{sole_admin.id_usuario}",
        json={"id_rol": str(user_rol.id_rol)},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 400
    assert "único Administrador" in resp.json()["detail"]

    # 3. Attempt to deactivate sole admin -> 400 Bad Request
    resp = client.put(
        f"/api/users/{sole_admin.id_usuario}",
        json={"estado_usuario": "INACTIVO"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 400
    assert "único Administrador" in resp.json()["detail"]


def test_forced_password_change_flow(client, test_db):
    user_rol = test_db.query(Rol).filter(Rol.nombre_rol == "Usuario").first()

    temp_pass_user = Usuario(
        id_usuario=uuid4(),
        nombres_usuario="Temp",
        apellidos_usuario="PassUser",
        correo_usuario="temppass@test.com",
        contrasenia_usuario=hash_password("TempPassword123!"),
        id_rol=user_rol.id_rol,
        estado_usuario="ACTIVO",
        requiere_cambio_clave=True
    )
    test_db.add(temp_pass_user)
    test_db.commit()

    token = create_access_token({"sub": temp_pass_user.correo_usuario, "role": "Usuario"})

    # Check /api/auth/me indicates must_change_password=True
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["must_change_password"] is True

    # Change password
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "TempPassword123!", "new_password": "NewSecurePassword2026!"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200

    # Verify flag updated to False in DB and me response
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["must_change_password"] is False
