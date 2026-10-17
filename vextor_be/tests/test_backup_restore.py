"""
Pruebas para el endpoint de restauración de copias de seguridad (backup restore)
"""
import pytest
import io
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, Actividad
from app.core.security import hash_password


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

    # Pre-cargar roles
    admin_rol = Rol(
        id_rol=uuid4(),
        nombre_rol="Administrador",
        descripcion_rol="Administrador del sistema"
    )
    user_rol = Rol(
        id_rol=uuid4(),
        nombre_rol="Usuario",
        descripcion_rol="Usuario regular"
    )
    db.add(admin_rol)
    db.add(user_rol)
    db.commit()

    # Crear usuario admin y usuario regular
    admin_user = Usuario(
        id_usuario=uuid4(),
        id_rol=admin_rol.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Vextor",
        correo_usuario="admin_backup@vextor.com",
        contrasenia_usuario=hash_password("Admin123!"),
        estado_usuario="ACTIVO"
    )
    regular_user = Usuario(
        id_usuario=uuid4(),
        id_rol=user_rol.id_rol,
        nombres_usuario="Regular",
        apellidos_usuario="User",
        correo_usuario="user_backup@vextor.com",
        contrasenia_usuario=hash_password("User123!"),
        estado_usuario="ACTIVO"
    )
    db.add(admin_user)
    db.add(regular_user)
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    yield {
        "db": db,
        "admin": admin_user,
        "user": regular_user
    }

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_backup_restore_permission_denied(test_db):
    """Verifica que un usuario sin rol de Administrador sea rechazado con HTTP 403"""
    client = TestClient(app)
    # Autenticar mediante login para obtener la cookie de sesion
    login_res = client.post("/api/auth/login", json={"email": "user_backup@vextor.com", "password": "User123!"})
    assert login_res.status_code == 200

    # Intentar restaurar como usuario regular
    response = client.post(
        "/api/backup/restore",
        cookies=login_res.cookies,
        files={"file": ("test_backup.sql", b"SELECT 1;", "application/sql")}
    )
    assert response.status_code == 403
    assert "Acceso denegado" in response.json()["detail"]


def test_backup_restore_invalid_extension(test_db):
    """Verifica que un archivo que no sea .sql sea rechazado con HTTP 400"""
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={"email": "admin_backup@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200

    response = client.post(
        "/api/backup/restore",
        cookies=login_res.cookies,
        files={"file": ("malicious.exe", b"binary content", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Formato de archivo no permitido" in response.json()["detail"]


def test_backup_restore_empty_file(test_db):
    """Verifica que un archivo vacio sea rechazado"""
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={"email": "admin_backup@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200

    response = client.post(
        "/api/backup/restore",
        cookies=login_res.cookies,
        files={"file": ("empty.sql", b"   \n\t  ", "text/plain")}
    )
    assert response.status_code == 400
    assert "vacío" in response.json()["detail"]


def test_backup_restore_invalid_sql_content(test_db):
    """Verifica que un archivo .sql sin sintaxis SQL valida sea rechazado"""
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={"email": "admin_backup@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200

    response = client.post(
        "/api/backup/restore",
        cookies=login_res.cookies,
        files={"file": ("invalid.sql", b"Hello World This Is Not Sql", "text/plain")}
    )
    assert response.status_code == 400
    assert "no parece ser un script SQL válido" in response.json()["detail"]


def test_backup_restore_successful_upload(test_db):
    """Verifica la restauracion exitosa subiendo un archivo .sql valido"""
    client = TestClient(app)
    admin = test_db["admin"]
    db = test_db["db"]
    login_res = client.post("/api/auth/login", json={"email": "admin_backup@vextor.com", "password": "Admin123!"})
    assert login_res.status_code == 200

    sql_payload = "CREATE TABLE IF NOT EXISTS test_restore_table (id INT, name VARCHAR(50)); INSERT INTO test_restore_table VALUES (1, 'VextorTest');"

    response = client.post(
        "/api/backup/restore",
        cookies=login_res.cookies,
        files={"file": ("valid_backup.sql", sql_payload.encode("utf-8"), "text/plain")}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "restaurados exitosamente" in response.json()["message"]

    # Verificar registro de auditoria
    audit = db.query(Actividad).filter(Actividad.tipo_accion == "RESTAURACION").first()
    assert audit is not None
    assert audit.id_usuario == admin.id_usuario
    assert "valid_backup.sql" in audit.descripcion
