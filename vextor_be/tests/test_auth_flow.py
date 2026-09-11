"""
Pruebas automatizadas de flujo completo de autenticación y auditoría
- login válido
- credenciales inválidas
- creación de sesión en sesion_usuario
- acceso posterior a /api/auth/me
- logout
- auditoría LOGIN
- sesión revocada / cerrada
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, SesionUsuario, Actividad
from app.core.security import hash_password


@pytest.fixture
def test_db_auth():
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

    # Crear rol Administrador
    admin_role = Rol(nombre_rol="Administrador", descripcion_rol="Admin")
    db.add(admin_role)
    db.commit()
    db.refresh(admin_role)

    # Crear usuario activo de prueba
    test_user = Usuario(
        id_rol=admin_role.id_rol,
        nombres_usuario="Juan",
        apellidos_usuario="Pérez",
        correo_usuario="juan.perez@vextor.com",
        contrasenia_usuario=hash_password("SecurePass123!"),
        estado_usuario="ACTIVO"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_login_invalid_credentials(test_db_auth):
    """Verifica respuesta 400 cuando las credenciales son incorrectas"""
    client = TestClient(app)
    res = client.post(
        "/api/auth/login",
        json={"email": "juan.perez@vextor.com", "password": "WrongPassword123!"}
    )
    assert res.status_code == 400
    assert "Credenciales incorrectas" in res.json()["detail"]


def test_login_success_and_me_and_logout_flow(test_db_auth):
    """
    Verifica:
    1. Login exitoso -> HTTP 200, cookie vextor_auth_token establecida.
    2. Creación de registro activo en sesion_usuario.
    3. Registro de auditoría LOGIN en la tabla actividad.
    4. Acceso exitoso a /api/auth/me usando la cookie.
    5. Logout exitoso -> revocación/cierre de la sesión y eliminación de la cookie.
    6. Denegación posterior de /api/auth/me tras revocación/logout.
    """
    client = TestClient(app)

    # 1. Login válido
    login_res = client.post(
        "/api/auth/login",
        json={"email": "juan.perez@vextor.com", "password": "SecurePass123!"}
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "token" in data
    assert data["user"]["email"] == "juan.perez@vextor.com"

    # Verificar presencia de cookie vextor_auth_token
    assert "vextor_auth_token" in login_res.cookies

    # 2. Verificar que la sesión se guardó en sesion_usuario
    db_session_record = test_db_auth.query(SesionUsuario).first()
    assert db_session_record is not None
    assert db_session_record.estado_sesion == "ACTIVA"

    # 3. Verificar auditoría LOGIN en la tabla actividad
    audit_record = test_db_auth.query(Actividad).filter(Actividad.tipo_accion == "LOGIN").first()
    assert audit_record is not None
    assert audit_record.resultado == "EXITOSO"
    assert audit_record.nombres_usuario == "Juan Pérez"

    # 4. Acceso posterior a /api/auth/me con la cookie establecida
    me_res = client.get("/api/auth/me", cookies=login_res.cookies)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "juan.perez@vextor.com"
    assert me_data["name"] == "Juan Pérez"

    # 5. Logout
    logout_res = client.post("/api/auth/logout", cookies=login_res.cookies)
    assert logout_res.status_code == 200

    # Verificar que la sesión cambió a CERRADA
    test_db_auth.refresh(db_session_record)
    assert db_session_record.estado_sesion == "CERRADA"

    # 6. Intento de acceso posterior a /api/auth/me con la misma cookie caducada/cerrada
    me_after_logout = client.get("/api/auth/me", cookies=login_res.cookies)
    assert me_after_logout.status_code == 401


def test_revoked_session_denies_access(test_db_auth):
    """Verifica que si una sesión se marca como REVOCADA en BD, /api/auth/me devuelve 401"""
    client = TestClient(app)

    login_res = client.post(
        "/api/auth/login",
        json={"email": "juan.perez@vextor.com", "password": "SecurePass123!"}
    )
    assert login_res.status_code == 200

    # Marcar sesión como REVOCADA manualmente en BD
    db_session = test_db_auth.query(SesionUsuario).first()
    db_session.estado_sesion = "REVOCADA"
    test_db_auth.commit()

    # Intentar acceder a /api/auth/me
    me_res = client.get("/api/auth/me", cookies=login_res.cookies)
    assert me_res.status_code == 401
    assert "revocada" in me_res.json()["detail"].lower()
