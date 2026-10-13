"""
Pruebas integrales de compatibilidad de esquema PostgreSQL / Supabase
Verifica que no existan errores HTTP 500 en los flujos principales de Vextor.
"""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, SesionUsuario, Actividad, Vehiculo, Marca, Modelo, Empresa
from app.core.security import hash_password
from app.core.rate_limiter import auth_rate_limiter
from app.services import AuditService


@pytest.fixture
def test_db_supabase():
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

    # Crear roles por defecto
    rol_admin = Rol(id_rol=uuid4(), nombre_rol="Administrador", descripcion_rol="Admin")
    rol_user = Rol(id_rol=uuid4(), nombre_rol="Usuario", descripcion_rol="User")
    rol_cond = Rol(id_rol=uuid4(), nombre_rol="Conductor", descripcion_rol="Driver")
    db.add_all([rol_admin, rol_user, rol_cond])
    db.commit()

    # Usuario admin de prueba
    admin_user = Usuario(
        id_usuario=uuid4(),
        id_rol=rol_admin.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Vextor",
        correo_usuario="admin@vextor.com",
        contrasenia_usuario=hash_password("AdminPass123!"),
        estado_usuario="ACTIVO"
    )
    db.add(admin_user)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()
    auth_rate_limiter.requests.clear()


def test_login_valid_and_invalid_credentials(test_db_supabase):
    """Verifica que el login con credenciales válidas funcione y con inválidas devuelva HTTP 400 (no 500)"""
    auth_rate_limiter.requests.clear()
    client = TestClient(app)

    # Credenciales inválidas
    res_bad = client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "WrongPassword!"})
    assert res_bad.status_code == 400
    assert "Credenciales incorrectas" in res_bad.json()["detail"]

    auth_rate_limiter.requests.clear()
    # Credenciales válidas
    res_good = client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "AdminPass123!"})
    assert res_good.status_code == 200
    data = res_good.json()
    assert "token" in data
    assert data["user"]["email"] == "admin@vextor.com"

    # Verificar que token no nulo se guardó en SesionUsuario
    session_rec = test_db_supabase.query(SesionUsuario).first()
    assert session_rec is not None
    assert session_rec.token is not None
    assert session_rec.token == data["token"]


def test_me_endpoint_auth_and_no_auth(test_db_supabase):
    """Verifica /api/auth/me con y sin autenticación"""
    auth_rate_limiter.requests.clear()
    client = TestClient(app)

    # Sin auth
    res_no_auth = client.get("/api/auth/me")
    assert res_no_auth.status_code == 401

    auth_rate_limiter.requests.clear()
    # Con auth
    res_login = client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "AdminPass123!"})
    token = res_login.json()["token"]

    res_auth = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_auth.status_code == 200
    assert res_auth.json()["email"] == "admin@vextor.com"


def test_registration_flow_and_duplicate_handling(test_db_supabase):
    """Verifica flujo completo de registro, duplicados y validación de contraseña"""
    auth_rate_limiter.requests.clear()
    client = TestClient(app)

    # 1. Contraseña débil -> 400
    res_weak = client.post("/api/auth/register", json={
        "email": "user1@vextor.com",
        "password": "123",
        "fullName": "User One"
    })
    assert res_weak.status_code == 400

    auth_rate_limiter.requests.clear()
    # 2. Registro exitoso
    res_reg = client.post("/api/auth/register", json={
        "email": "user1@vextor.com",
        "password": "ValidPassword123!",
        "fullName": "User One"
    })
    assert res_reg.status_code == 200

    # Verificar creación en BD
    created_u = test_db_supabase.query(Usuario).filter(Usuario.correo_usuario == "user1@vextor.com").first()
    assert created_u is not None
    assert created_u.nombres_usuario == "User"

    auth_rate_limiter.requests.clear()
    # 3. Intentar duplicado -> 400
    res_dup = client.post("/api/auth/register", json={
        "email": "user1@vextor.com",
        "password": "ValidPassword123!",
        "fullName": "User One"
    })
    assert res_dup.status_code == 400
    assert "ya está registrado" in res_dup.json()["detail"]


def test_role_change_persists(test_db_supabase):
    """Verifica que los cambios de rol persistan al consultar nuevamente la BD"""
    admin_u = test_db_supabase.query(Usuario).filter(Usuario.correo_usuario == "admin@vextor.com").first()
    user_rol = test_db_supabase.query(Rol).filter(Rol.nombre_rol == "Usuario").first()

    admin_u.id_rol = user_rol.id_rol
    test_db_supabase.commit()

    reloaded = test_db_supabase.query(Usuario).filter(Usuario.id_usuario == admin_u.id_usuario).first()
    assert reloaded.id_rol == user_rol.id_rol


def test_vehicle_creation_and_properties(test_db_supabase):
    """Verifica creación de vehículo con marca y modelo dinámicos sin error 500 de columna en vehiculo"""
    auth_rate_limiter.requests.clear()
    client = TestClient(app)
    res_login = client.post("/api/auth/login", json={"email": "admin@vextor.com", "password": "AdminPass123!"})
    token = res_login.json()["token"]

    veh_payload = {
        "placa": "XYZ987",
        "marca": "Chevrolet",
        "modelo": "NPR",
        "anio": 2023,
        "color": "Blanco",
        "tipo_vehiculo": "Camión",
        "capacidad_pasajeros": 3,
        "kilometraje_actual": 12000,
        "kilometraje_limite_mantenimiento": 20000,
        "estado_vehiculo": "DISPONIBLE"
    }

    res_veh = client.post("/api/vehicles", json=veh_payload, headers={"Authorization": f"Bearer {token}"})
    assert res_veh.status_code == 200
    veh_data = res_veh.json()
    assert veh_data["placa"] == "XYZ987"
    assert veh_data["marca"] == "Chevrolet"
    assert veh_data["modelo"] == "NPR"


def test_defensive_notifications(test_db_supabase):
    """Verifica que AuditService.create_notification cree notificaciones sin lanzar excepción 500"""
    admin_u = test_db_supabase.query(Usuario).first()
    notif = AuditService.create_notification(
        test_db_supabase,
        titulo="Notificación Test",
        descripcion="Test Desc",
        tipo="general",
        id_usuario=admin_u.id_usuario
    )
    assert notif is not None
    assert notif.titulo == "Notificación Test"
