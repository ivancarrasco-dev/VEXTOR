import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Rol, Usuario, Conductor, Vehiculo
from app.core.security import hash_password


@pytest.fixture
def test_client():
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

    admin_role = Rol(id_rol=uuid4(), nombre_rol="Administrador")
    user_role = Rol(id_rol=uuid4(), nombre_rol="Usuario")
    driver_role = Rol(id_rol=uuid4(), nombre_rol="Conductor")
    db.add_all([admin_role, user_role, driver_role])
    db.commit()

    admin_user = Usuario(
        id_usuario=uuid4(),
        id_rol=admin_role.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Vextor",
        correo_usuario="admin@vextor.com",
        contrasenia_usuario=hash_password("Admin123!"),
        estado_usuario="ACTIVO",
    )
    normal_user = Usuario(
        id_usuario=uuid4(),
        id_rol=user_role.id_rol,
        nombres_usuario="User",
        apellidos_usuario="Vextor",
        correo_usuario="user@vextor.com",
        contrasenia_usuario=hash_password("User123!"),
        estado_usuario="ACTIVO",
    )
    driver_user = Usuario(
        id_usuario=uuid4(),
        id_rol=driver_role.id_rol,
        nombres_usuario="Driver",
        apellidos_usuario="Vextor",
        correo_usuario="driver@vextor.com",
        contrasenia_usuario=hash_password("Driver123!"),
        estado_usuario="ACTIVO",
    )
    db.add_all([admin_user, normal_user, driver_user])
    db.commit()

    cond = Conductor(
        id_conductor=uuid4(),
        id_usuario=driver_user.id_usuario,
        nombre_conductor="Driver",
        apellido_conductor="Vextor",
        cedula_conductor="100200300",
        telefono_conductor="3001112233",
        licencia="C2",
        estado_conductor="DISPONIBLE",
        fecha_ingreso=date.today(),
    )
    veh = Vehiculo(
        id_vehiculo=uuid4(),
        placa="VEX123",
        marca="Mercedes",
        modelo="Sprinter",
        anio=2022,
        color="Negro",
        tipo_vehiculo="Van",
        capacidad_pasajeros=12,
        kilometraje_actual=10000,
        kilometraje_limite_mantenimiento=15000,
        estado_vehiculo="DISPONIBLE",
    )
    db.add_all([cond, veh])
    db.commit()

    client = TestClient(app)
    yield client

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_cors_preflight_and_headers(test_client):
    response = test_client.options(
        "/api/vehicles",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_get_vehicles_and_drivers_authenticated(test_client):
    # Login admin
    login_res = test_client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200

    # GET vehicles
    v_res = test_client.get("/api/vehicles", cookies=login_res.cookies)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert len(v_data) >= 1
    assert v_data[0]["placa"] == "VEX123"

    # GET drivers
    d_res = test_client.get("/api/drivers", cookies=login_res.cookies)
    assert d_res.status_code == 200
    d_data = d_res.json()
    assert len(d_data) >= 1
    assert d_data[0]["cedula_conductor"] == "100200300"
    assert d_data[0]["correo_conductor"] == "driver@vextor.com"


def test_users_authorization(test_client):
    # 1. Non-admin user receives 403 on GET /api/users
    u_login = test_client.post("/api/auth/login", json={"email": "user@vextor.com", "password": "User123!"})
    assert u_login.status_code == 200
    u_res = test_client.get("/api/users", cookies=u_login.cookies)
    assert u_res.status_code == 403

    # 2. Admin receives 200 on GET /api/users
    admin_login = test_client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "Admin123!"})
    assert admin_login.status_code == 200
    admin_users_res = test_client.get("/api/users", cookies=admin_login.cookies)
    assert admin_users_res.status_code == 200
    assert len(admin_users_res.json()) >= 3
