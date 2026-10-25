import pytest
from uuid import uuid4
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.main import app
from app.database import Base, get_db
from app.models import Usuario, Rol, Conductor, Ruta, AsignacionConductor
from app.core.security import create_access_token, hash_password


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


def create_test_role(db, role_name="Conductor"):
    rol = db.query(Rol).filter(Rol.nombre_rol == role_name).first()
    if not rol:
        rol = Rol(id_rol=uuid4(), nombre_rol=role_name, descripcion_rol=f"Rol {role_name}")
        db.add(rol)
        db.commit()
        db.refresh(rol)
    return rol


def test_non_driver_access_my_routes(test_db):
    """Un usuario que no sea conductor debe retornar conductor: None"""
    client = TestClient(app)
    role = create_test_role(test_db, "Usuario")
    user = Usuario(
        id_usuario=uuid4(),
        id_rol=role.id_rol,
        nombres_usuario="Regular",
        apellidos_usuario="User",
        correo_usuario="user@vextor.com",
        contrasenia_usuario=hash_password("User123!"),
        estado_usuario="ACTIVO",
    )
    test_db.add(user)
    test_db.commit()

    token = create_access_token({"sub": user.correo_usuario, "sid": "session1"})

    response = client.get(
        "/api/routes/driver/my-routes",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["conductor"] is None
    assert data["active_route"] is None


def test_driver_route_lifecycle_and_assignment_security(test_db):
    """Conductor puede operar su ruta asignada, pero no rutas ajenas"""
    client = TestClient(app)
    role_driver = create_test_role(test_db, "Conductor")

    # Crear Driver 1
    u1 = Usuario(
        id_usuario=uuid4(),
        id_rol=role_driver.id_rol,
        nombres_usuario="Juan",
        apellidos_usuario="Perez",
        correo_usuario="juan@vextor.com",
        contrasenia_usuario=hash_password("Pass123!"),
        estado_usuario="ACTIVO",
    )
    test_db.add(u1)
    test_db.commit()

    c1 = Conductor(
        id_conductor=uuid4(),
        id_usuario=u1.id_usuario,
        nombre_conductor="Juan",
        apellido_conductor="Perez",
        cedula_conductor="10101010",
        licencia="C2-111",
        estado_conductor="DISPONIBLE",
    )
    test_db.add(c1)

    # Crear Driver 2
    u2 = Usuario(
        id_usuario=uuid4(),
        id_rol=role_driver.id_rol,
        nombres_usuario="Carlos",
        apellidos_usuario="Gomez",
        correo_usuario="carlos@vextor.com",
        contrasenia_usuario=hash_password("Pass123!"),
        estado_usuario="ACTIVO",
    )
    test_db.add(u2)
    test_db.commit()

    c2 = Conductor(
        id_conductor=uuid4(),
        id_usuario=u2.id_usuario,
        nombre_conductor="Carlos",
        apellido_conductor="Gomez",
        cedula_conductor="20202020",
        licencia="C2-222",
        estado_conductor="DISPONIBLE",
    )
    test_db.add(c2)

    # Crear Ruta asignada a Driver 1
    ruta1 = Ruta(
        id_ruta=uuid4(),
        codigo_ruta="RUT-001",
        nombre_ruta="Bogotá - Tunja",
        origen="4.7110,-74.0721",
        destino="5.5353,-73.3678",
        estado_ruta="PROGRAMADA",
        fecha_programada=datetime.now(),
    )
    test_db.add(ruta1)
    test_db.commit()

    asig1 = AsignacionConductor(
        id_asignacion_conductor=uuid4(),
        id_ruta=ruta1.id_ruta,
        id_conductor=c1.id_conductor,
        estado_asignacion="ACTIVA",
    )
    test_db.add(asig1)
    test_db.commit()

    token1 = create_access_token({"sub": u1.correo_usuario, "sid": "s1"})
    token2 = create_access_token({"sub": u2.correo_usuario, "sid": "s2"})

    # Driver 2 intenta iniciar la ruta de Driver 1 -> Debe ser rechazado con 403
    resp_unauth = client.post(
        f"/api/routes/{ruta1.id_ruta}/start",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert resp_unauth.status_code == 403

    # Driver 1 inicia su ruta -> Debe ser exitoso
    resp_start = client.post(
        f"/api/routes/{ruta1.id_ruta}/start",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert resp_start.status_code == 200
    assert resp_start.json()["estado_ruta"] == "EN_PROCESO"

    # Enviar ubicación GPS via HTTP fallback
    resp_loc = client.post(
        f"/api/routes/{ruta1.id_ruta}/location",
        json={"latitud": 4.7200, "longitud": -74.0800, "velocidad": 45.0, "heading": 180.0},
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert resp_loc.status_code == 200
    assert resp_loc.json()["status"] == "ok"

    # Driver 1 pausa la ruta
    resp_pause = client.post(
        f"/api/routes/{ruta1.id_ruta}/pause",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert resp_pause.status_code == 200
    assert resp_pause.json()["estado_ruta"] == "SUSPENDIDA"

    # Driver 1 finaliza la ruta
    resp_finish = client.post(
        f"/api/routes/{ruta1.id_ruta}/finish",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert resp_finish.status_code == 200
    assert resp_finish.json()["estado_ruta"] == "COMPLETADA"
