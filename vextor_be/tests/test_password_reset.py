"""
Pruebas exhaustivas de recuperación y restablecimiento de contraseña
"""
import pytest
import hashlib
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.main import app
from app.database import get_db, Base
from app.models import Usuario, Rol, SesionUsuario, Actividad
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

    # Pre-cargar rol por defecto
    rol = Rol(
        id_rol=uuid4(),
        nombre_rol="Usuario",
        descripcion_rol="Rol por defecto"
    )
    db.add(rol)
    db.commit()

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


from unittest.mock import patch
from app.services.email_service import EmailService


def test_forgot_password_smtp_failure_handling(test_db):
    """Verifica que si el envío SMTP falla, la API mantiene la respuesta genérica anti-enumeración y genera el token"""
    client = TestClient(app)

    reg_res = client.post("/api/auth/register", json={
        "email": "smtpfail@vextor.com",
        "password": "Password123!",
        "fullName": "SMTP Fail"
    })
    assert reg_res.status_code == 200

    with patch.object(EmailService, "send_password_reset_email", return_value=(False, "Connection refused")):
        res = client.post("/api/auth/forgot-password", json={"email": "smtpfail@vextor.com"})
        assert res.status_code == 200
        assert "Si existe una cuenta asociada a este correo" in res.json()["message"]

        user = test_db.query(Usuario).filter(Usuario.correo_usuario == "smtpfail@vextor.com").first()
        assert user.token_recuperacion is not None


def test_forgot_password_generic_response(test_db):
    """Verifica respuesta genérica al solicitar recuperación tanto para email existente como no existente"""
    client = TestClient(app)

    # 1. Crear usuario registrado
    reg_res = client.post("/api/auth/register", json={
        "email": "user1@vextor.com",
        "password": "Password123!",
        "fullName": "User One"
    })
    assert reg_res.status_code == 200

    # 2. Solicitar reset para usuario existente
    res1 = client.post("/api/auth/forgot-password", json={"email": "user1@vextor.com"})
    assert res1.status_code == 200
    expected_msg = "Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña."
    assert res1.json()["message"] == expected_msg

    # Verificar que el usuario tiene un token_recuperacion almacenado
    user1 = test_db.query(Usuario).filter(Usuario.correo_usuario == "user1@vextor.com").first()
    assert user1 is not None
    assert user1.token_recuperacion is not None

    # 3. Solicitar reset para usuario NO existente
    res2 = client.post("/api/auth/forgot-password", json={"email": "nonexistent@vextor.com"})
    assert res2.status_code == 200
    assert res2.json()["message"] == expected_msg


def test_verify_and_reset_password_full_flow(test_db):
    """Verifica el flujo completo de restablecimiento de contraseña e inicio de sesión con la nueva clave"""
    client = TestClient(app)

    # 1. Registrar usuario
    client.post("/api/auth/register", json={
        "email": "flowuser@vextor.com",
        "password": "OldPassword123!",
        "fullName": "Flow User"
    })

    # 2. Solicitar reset
    client.post("/api/auth/forgot-password", json={"email": "flowuser@vextor.com"})

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "flowuser@vextor.com").first()
    assert user.token_recuperacion is not None

    # Extraer hash token y simular token_raw que el usuario recibiría en correo
    # En la base de datos se guarda hash(raw_token)|exp_time
    # Como simulamos en test, generamos un raw token y lo seteamos manualmente para asegurarnos el valor exacto
    raw_token = "my-secret-test-token-123456"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    exp_iso = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    user.token_recuperacion = f"{token_hash}|{exp_iso}"
    test_db.commit()

    # 3. Verificar token
    res_verify = client.post("/api/auth/verify-reset-token", json={"token": raw_token})
    assert res_verify.status_code == 200
    assert res_verify.json() == {"valid": True, "email": "flowuser@vextor.com"}

    # 4. Cambiar contraseña
    res_reset = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "NewPassword123!"
    })
    assert res_reset.status_code == 200
    assert "actualizada correctamente" in res_reset.json()["message"]

    # 5. Verificar auditoría
    audit = test_db.query(Actividad).filter(Actividad.tipo_accion == "CAMBIO_CONTRASENIA").first()
    assert audit is not None
    assert audit.id_usuario == user.id_usuario

    # 6. Intentar login con contraseña antigua -> Debe fallar
    res_old_login = client.post("/api/auth/login", json={
        "email": "flowuser@vextor.com",
        "password": "OldPassword123!"
    })
    assert res_old_login.status_code == 400

    # 7. Intentar login con nueva contraseña -> Debe ser exitoso
    res_new_login = client.post("/api/auth/login", json={
        "email": "flowuser@vextor.com",
        "password": "NewPassword123!"
    })
    assert res_new_login.status_code == 200
    assert "token" in res_new_login.json()


def test_token_single_use_enforcement(test_db):
    """Verifica que un token no pueda reutilizarse una vez consumido"""
    client = TestClient(app)

    # Registrar usuario
    client.post("/api/auth/register", json={
        "email": "reuseuser@vextor.com",
        "password": "OldPassword123!",
        "fullName": "Reuse User"
    })

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "reuseuser@vextor.com").first()

    raw_token = "single-use-token-abc"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    exp_iso = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    user.token_recuperacion = f"{token_hash}|{exp_iso}"
    test_db.commit()

    # Primer uso -> Exitoso
    res1 = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "NewPassword123!"
    })
    assert res1.status_code == 200

    # Segundo uso del mismo token -> Debe ser rechazado
    res2 = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "AnotherPassword123!"
    })
    assert res2.status_code == 400
    assert "inválido o ya ha sido utilizado" in res2.json()["detail"]


def test_expired_token_rejection(test_db):
    """Verifica que un token expirado sea rechazado"""
    client = TestClient(app)

    client.post("/api/auth/register", json={
        "email": "expireduser@vextor.com",
        "password": "OldPassword123!",
        "fullName": "Expired User"
    })

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "expireduser@vextor.com").first()

    raw_token = "expired-token-xyz"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    # Fecha expirada (hace 10 minutos)
    expired_iso = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    user.token_recuperacion = f"{token_hash}|{expired_iso}"
    test_db.commit()

    # Verificar token expirado
    res_verify = client.post("/api/auth/verify-reset-token", json={"token": raw_token})
    assert res_verify.status_code == 400
    assert "expirado" in res_verify.json()["detail"]

    # Intentar reset con token expirado
    res_reset = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "NewPassword123!"
    })
    assert res_reset.status_code == 400
    assert "expirado" in res_reset.json()["detail"]


def test_password_policy_enforcement_on_reset(test_db):
    """Verifica que contraseñas que no cumplen con la política sean rechazadas durante el reset"""
    client = TestClient(app)

    client.post("/api/auth/register", json={
        "email": "policyuser@vextor.com",
        "password": "OldPassword123!",
        "fullName": "Policy User"
    })

    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "policyuser@vextor.com").first()

    raw_token = "policy-token-999"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    exp_iso = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    user.token_recuperacion = f"{token_hash}|{exp_iso}"
    test_db.commit()

    # Intentar cambiar a contraseña débil (menos de 8 caracteres, sin números/mayúsculas)
    res = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "weak"
    })
    assert res.status_code == 400
    assert "al menos 8 caracteres" in res.json()["detail"]


def test_sessions_revoked_upon_password_reset(test_db):
    """Verifica que al restablecer la contraseña se revoquen las sesiones activas previas"""
    client = TestClient(app)

    # Registrar e Iniciar sesión
    client.post("/api/auth/register", json={
        "email": "sessionuser@vextor.com",
        "password": "OldPassword123!",
        "fullName": "Session User"
    })

    login_res = client.post("/api/auth/login", json={
        "email": "sessionuser@vextor.com",
        "password": "OldPassword123!"
    })
    token = login_res.json()["token"]

    # Comprobar acceso con token previo -> Funciona
    me_res1 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res1.status_code == 200

    # Restablecer contraseña
    user = test_db.query(Usuario).filter(Usuario.correo_usuario == "sessionuser@vextor.com").first()
    raw_token = "revoke-sessions-token"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    exp_iso = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    user.token_recuperacion = f"{token_hash}|{exp_iso}"
    test_db.commit()

    res_reset = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "newPassword": "NewPassword123!"
    })
    assert res_reset.status_code == 200

    # Comprobar acceso con token previo -> Debe ser denegado por sesión revocada (401)
    me_res2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res2.status_code == 401
    assert "revocada" in me_res2.json()["detail"]
