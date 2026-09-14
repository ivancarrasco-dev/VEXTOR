"""
Pruebas de autenticación (Login y Registro)
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, SesionUsuario, Actividad


@pytest.fixture
def test_db():
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


def test_register_and_login_success(test_db):
    """Verifica que el flujo de registro y login funcione correctamente"""
    client = TestClient(app)

    # 1. Registrar usuario
    reg_payload = {
        "email": "newuser@vextor.com",
        "password": "Password123!",
        "fullName": "New User"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 200
    assert res_reg.json() == {"message": "Usuario creado correctamente"}

    # Verificar que se creó el usuario y la actividad de auditoría
    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "newuser@vextor.com").first()
    assert user is not None
    assert user.nombres_usuario == "New"
    assert user.apellidos_usuario == "User"

    reg_activity = test_db.query(Actividad).filter(Actividad.tipo_accion == "REGISTRO").first()
    assert reg_activity is not None
    assert reg_activity.id_usuario == user.id_usuario

    # 2. Iniciar sesión
    login_payload = {
        "email": "newuser@vextor.com",
        "password": "Password123!"
    }
    res_login = client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    data = res_login.json()
    assert "token" in data
    assert data["user"]["email"] == "newuser@vextor.com"

    # Verificar sesión y actividad de auditoría
    session_db = test_db.query(SesionUsuario).filter(SesionUsuario.id_usuario == user.id_usuario).first()
    assert session_db is not None

    login_activity = test_db.query(Actividad).filter(Actividad.tipo_accion == "LOGIN").first()
    assert login_activity is not None
    assert login_activity.id_usuario == user.id_usuario


def test_login_invalid_credentials(test_db):
    """Verifica error de credenciales incorrectas en login"""
    client = TestClient(app)

    # Intentar login sin registrar usuario
    res = client.post("/api/auth/login", json={"email": "nonexistent@vextor.com", "password": "Password123!"})
    assert res.status_code == 400
    assert "Credenciales incorrectas" in res.json()["detail"]
