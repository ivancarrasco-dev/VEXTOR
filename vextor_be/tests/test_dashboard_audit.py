"""
Pruebas de Integración para Dashboard, Actividades y Notificaciones
"""
import uuid
import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Rol, Usuario, Vehiculo, Conductor, Ruta, Mantenimiento, Actividad, Notificacion
from app.core.security import create_access_token, hash_password


@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    admin_role = Rol(
        nombre_rol="Administrador",
        descripcion_rol="Acceso total"
    )
    db.add(admin_role)
    db.commit()
    db.refresh(admin_role)

    admin_user = Usuario(
        id_rol=admin_role.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Vextor",
        correo_usuario="admin@vextor.com",
        contrasenia_usuario=hash_password("admin123"),
        estado_usuario="ACTIVO"
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    veh1 = Vehiculo(
        placa="ABC-123",
        marca="Toyota",
        modelo="Hilux",
        anio=2022,
        tipo_vehiculo="Camioneta",
        capacidad_pasajeros=5,
        kilometraje_actual=10000,
        kilometraje_limite_mantenimiento=15000,
        estado_vehiculo="DISPONIBLE"
    )
    db.add(veh1)

    drv1 = Conductor(
        id_usuario=admin_user.id_usuario,
        cedula_conductor="1010101010",
        nombre_conductor="Carlos",
        apellido_conductor="Pérez",
        licencia="C1",
        telefono_conductor="3001234567",
        estado_conductor="DISPONIBLE",
        fecha_ingreso=date.today()
    )
    db.add(drv1)

    act = Actividad(
        id_usuario=admin_user.id_usuario,
        nombres_usuario="Admin Vextor",
        tipo_accion="CREACION",
        modulo="Vehículos",
        descripcion="Vehículo registrado con placa ABC-123"
    )
    db.add(act)

    notif = Notificacion(
        id_usuario=admin_user.id_usuario,
        titulo="Bienvenido a Vextor",
        descripcion="Sistema inicializado correctamente",
        tipo="general",
        leido=False
    )
    db.add(notif)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_dashboard_stats_authenticated(test_db):
    client = TestClient(app)
    token = create_access_token({"sub": "admin@vextor.com", "sid": "session123"})
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "vehicles" in data
    assert data["vehicles"]["value"] == 1
    assert "drivers" in data
    assert data["drivers"]["value"] == 1
    assert "routes" in data
    assert "maintenances" in data
    assert "users" in data
    assert data["users"]["value"] == 1


def test_activities_and_notifications_endpoints(test_db):
    client = TestClient(app)
    token = create_access_token({"sub": "admin@vextor.com", "sid": "session123"})
    headers = {"Authorization": f"Bearer {token}"}

    # Test /api/activities
    res_act = client.get("/api/activities", headers=headers)
    assert res_act.status_code == 200
    activities = res_act.json()
    assert len(activities) >= 1
    assert activities[0]["modulo"] == "Vehículos"

    # Test /api/notifications
    res_notif = client.get("/api/notifications", headers=headers)
    assert res_notif.status_code == 200
    notifs = res_notif.json()
    assert len(notifs) >= 1
    notif_id = notifs[0]["id_notificacion"]

    # Mark as read
    res_read = client.put(f"/api/notifications/{notif_id}/read", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json()["leido"] is True

    # Mark as unread
    res_unread = client.put(f"/api/notifications/{notif_id}/unread", headers=headers)
    assert res_unread.status_code == 200
    assert res_unread.json()["leido"] is False
