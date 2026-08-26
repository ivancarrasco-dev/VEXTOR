"""
Pruebas de verificación de correcciones de seguridad
"""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, Vehiculo, Conductor, Ruta
from app.core.security import hash_password, create_access_token

# Configurar BD SQLite estática/compartida para tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Crear roles
    admin_role = Rol(nombre_rol="Administrador", descripcion_rol="Admin")
    driver_role = Rol(nombre_rol="Conductor", descripcion_rol="Driver")
    db.add_all([admin_role, driver_role])
    db.commit()
    db.refresh(admin_role)
    db.refresh(driver_role)

    # Crear usuarios
    admin_user = Usuario(
        id_rol=admin_role.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Vextor",
        correo_usuario="admin@vextor.com",
        contrasenia_usuario=hash_password("Admin123!"),
        estado_usuario="ACTIVO"
    )
    driver_user = Usuario(
        id_rol=driver_role.id_rol,
        nombres_usuario="Driver",
        apellidos_usuario="Vextor",
        correo_usuario="driver@vextor.com",
        contrasenia_usuario=hash_password("Driver123!"),
        estado_usuario="ACTIVO"
    )
    db.add_all([admin_user, driver_user])
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=engine)


def test_crud_endpoints_require_auth():
    """Verifica que los endpoints GET sin autenticación sean rechazados con 401"""
    res = client.get("/api/vehicles")
    assert res.status_code == 401
    res = client.get("/api/drivers")
    assert res.status_code == 401
    res = client.get("/api/routes")
    assert res.status_code == 401


def test_rbac_restrictions():
    """Verifica que un Conductor no pueda realizar operaciones de edición administrativas"""
    db = TestingSessionLocal()
    driver_user = db.query(Usuario).filter(Usuario.correo_usuario == "driver@vextor.com").first()
    session_id = uuid4()
    from app.models import SesionUsuario
    sess = SesionUsuario(id_sesion=session_id, id_usuario=driver_user.id_usuario, estado_sesion="ACTIVA")
    db.add(sess)
    db.commit()
    token = create_access_token({"sub": driver_user.correo_usuario, "role": "Conductor", "sid": str(session_id)})

    headers = {"Authorization": f"Bearer {token}"}

    vehicle_payload = {
        "placa": "ABC123",
        "marca": "Toyota",
        "modelo": "Hilux",
        "anio": 2022,
        "color": "Blanco",
        "tipo_vehiculo": "Camioneta",
        "capacidad_pasajeros": 4,
        "kilometraje_actual": 1000,
        "kilometraje_limite_mantenimiento": 5000,
        "estado_vehiculo": "DISPONIBLE"
    }
    res = client.post("/api/vehicles", json=vehicle_payload, headers=headers)
    assert res.status_code == 403
    assert "Acceso denegado" in res.json()["detail"]


def test_rate_limiting_login():
    """Verifica que el rate limiter bloquee tras 5 intentos seguidos"""
    for _ in range(5):
        res = client.post("/api/auth/login", json={"email": "wrong@vextor.com", "password": "WrongPassword1!"})

    res = client.post("/api/auth/login", json={"email": "wrong@vextor.com", "password": "WrongPassword1!"})
    assert res.status_code == 429
    assert "Demasiados intentos" in res.json()["detail"]
