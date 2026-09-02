"""
Pruebas de verificación de correcciones de seguridad
"""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, Vehiculo, Conductor, Ruta
from app.core.security import hash_password, create_access_token


@pytest.fixture
def test_db_security():
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

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_crud_endpoints_require_auth(test_db_security):
    """Verifica que los endpoints GET sin autenticación sean rechazados con 401"""
    client = TestClient(app)
    res = client.get("/api/vehicles")
    assert res.status_code == 401
    res = client.get("/api/drivers")
    assert res.status_code == 401
    res = client.get("/api/routes")
    assert res.status_code == 401


def test_rbac_restrictions(test_db_security):
    """Verifica que un Conductor no pueda realizar operaciones de edición administrativas"""
    client = TestClient(app)
    driver_user = test_db_security.query(Usuario).filter(Usuario.correo_usuario == "driver@vextor.com").first()
    token = create_access_token({"sub": driver_user.correo_usuario, "role": "Conductor"})
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


def test_rate_limiting_login(test_db_security):
    """Verifica que el rate limiter bloquee tras 5 intentos seguidos"""
    client = TestClient(app)
    for _ in range(5):
        res = client.post("/api/auth/login", json={"email": "wrong@vextor.com", "password": "WrongPassword1!"})

    res = client.post("/api/auth/login", json={"email": "wrong@vextor.com", "password": "WrongPassword1!"})
    assert res.status_code == 429
    assert "Demasiados intentos" in res.json()["detail"]
