"""
Pruebas para las nuevas funcionalidades:
- Registro con teléfono, tipo y número de documento
- Login flexible por correo, documento o teléfono
- Gestión de imágenes de vehículos
- Eliminación masiva de vehículos y conductores
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
from app.models import Usuario, Rol, SesionUsuario, Actividad, Vehiculo, Conductor, ImagenVehiculo


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

    # Sembrar roles
    admin_rol = Rol(id_rol=uuid4(), nombre_rol="Administrador", descripcion_rol="Admin")
    user_rol = Rol(id_rol=uuid4(), nombre_rol="Usuario", descripcion_rol="User")
    db.add_all([admin_rol, user_rol])
    db.commit()

    from app.core.security import hash_password
    admin_user = Usuario(
        id_usuario=uuid4(),
        id_rol=admin_rol.id_rol,
        nombres_usuario="Admin",
        apellidos_usuario="Test",
        correo_usuario="admin@vextor.com",
        contrasenia_usuario=hash_password("Admin123!"),
        telefono_usuario="3001234567",
        cedula_usuario="1122334455",
        tipo_documento="CEDULA_CIUDADANIA",
        estado_usuario="ACTIVO",
    )
    db.add(admin_user)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_register_and_multi_login(test_db):
    client = TestClient(app)

    # 1. Registrar usuario con documento y teléfono
    reg_res = client.post("/api/auth/register", json={
        "email": "juan.perez@vextor.com",
        "password": "Password123!",
        "fullName": "Juan Perez",
        "phone": "3109876543",
        "documentType": "CEDULA_CIUDADANIA",
        "documentNumber": "9988776655"
    })
    assert reg_res.status_code == 200

    # 2. Login por correo
    login_email = client.post("/api/auth/login", json={
        "email": "juan.perez@vextor.com",
        "password": "Password123!"
    })
    assert login_email.status_code == 200
    assert login_email.json()["user"]["phone"] == "3109876543"

    # 3. Login por cédula
    login_doc = client.post("/api/auth/login", json={
        "email": "9988776655",
        "password": "Password123!"
    })
    assert login_doc.status_code == 200

    # 4. Login por teléfono
    login_phone = client.post("/api/auth/login", json={
        "email": "3109876543",
        "password": "Password123!"
    })
    assert login_phone.status_code == 200


def test_vehicle_images_and_batch_delete(test_db):
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={
        "email": "admin@vextor.com",
        "password": "Admin123!"
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Crear vehículo
    veh_res = client.post("/api/vehicles", json={
        "placa": "NEW123",
        "marca": "Toyota",
        "modelo": "Coaster",
        "anio": 2023,
        "color": "Blanco",
        "tipo_vehiculo": "Bus",
        "capacidad_pasajeros": 30,
        "kilometraje_actual": 5000,
        "kilometraje_limite_mantenimiento": 15000,
        "estado_vehiculo": "DISPONIBLE"
    }, headers=headers)
    assert veh_res.status_code == 200
    v_id = veh_res.json()["id_vehiculo"]

    # 2. Subir imagen para el vehículo
    dummy_file = io.BytesIO(b"fake image bytes")
    files = [("files", ("test_bus.jpg", dummy_file, "image/jpeg"))]

    img_res = client.post(f"/api/vehicles/{v_id}/images", files=files, headers=headers)
    assert img_res.status_code == 200
    imgs = img_res.json()
    assert len(imgs) == 1
    assert imgs[0]["id_vehiculo"] == v_id
    img_id = imgs[0]["id_imagen"]

    # 3. Consultar vehículo y verificar imágenes asociadas
    get_v = client.get(f"/api/vehicles/{v_id}", headers=headers)
    assert get_v.status_code == 200
    assert len(get_v.json()["imagenes"]) == 1

    # 4. Eliminar imagen
    del_img = client.delete(f"/api/vehicles/images/{img_id}", headers=headers)
    assert del_img.status_code == 200

    # 5. Eliminación masiva de vehículos
    batch_del = client.post("/api/vehicles/batch-delete", json=[v_id], headers=headers)
    assert batch_del.status_code == 200
    assert batch_del.json()["deleted_count"] == 1


def test_driver_batch_delete(test_db):
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={
        "email": "admin@vextor.com",
        "password": "Admin123!"
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Crear conductor
    driver_res = client.post("/api/drivers", json={
        "nombre_conductor": "Carlos",
        "apellido_conductor": "Gomez",
        "cedula_conductor": "5544332211",
        "telefono_conductor": "3201112233",
        "correo_conductor": "carlos.gomez@vextor.com",
        "licencia": "C2",
        "estado_conductor": "DISPONIBLE",
        "fecha_ingreso": "2024-01-15"
    }, headers=headers)
    assert driver_res.status_code == 200
    d_id = driver_res.json()["id_conductor"]

    # 2. Batch delete driver
    batch_del = client.post("/api/drivers/batch-delete", json=[d_id], headers=headers)
    assert batch_del.status_code == 200
    assert batch_del.json()["deleted_count"] == 1
