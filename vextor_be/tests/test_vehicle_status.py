import pytest
from uuid import uuid4
from datetime import datetime, timezone, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database.connection import Base
from app.models import Vehiculo, Ruta, AsignacionVehiculo, Conductor, Mantenimiento, Usuario, Rol
from app.services.crud_services import (
    VehicleService,
    DriverService,
    RouteService,
    MaintenanceService,
    sync_vehicle_status,
    sync_driver_status
)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_vehicle_status_auto_en_ruta_on_route_creation(db_session):
    """Un vehículo asignado a una ruta activa (PROGRAMADA) pasa automáticamente a EN_RUTA."""
    v_data = {
        "placa": "AAA123",
        "marca": "Toyota",
        "modelo": "Hilux",
        "anio": 2022,
        "tipo_vehiculo": "Camioneta",
        "capacidad_pasajeros": 5,
        "kilometraje_actual": 1000,
        "kilometraje_limite_mantenimiento": 10000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)
    assert vehicle.estado_vehiculo == "DISPONIBLE"

    r_data = {
        "codigo_ruta": "RUT-001",
        "nombre_ruta": "Ruta Centro",
        "origen": "4.60,-74.08",
        "destino": "4.65,-74.05",
        "fecha_programada": datetime.now(timezone.utc),
        "estado_ruta": "PROGRAMADA",
        "id_vehiculo": vehicle.id_vehiculo
    }
    RouteService.create(r_data, db_session)

    vehicle_updated = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_updated.estado_vehiculo == "EN_RUTA"


def test_reject_manual_disponible_while_on_active_route(db_session):
    """No se permite cambiar manualmente un vehículo a DISPONIBLE mientras tenga una ruta activa."""
    v_data = {
        "placa": "BBB456",
        "marca": "Chevrolet",
        "modelo": "NPR",
        "anio": 2021,
        "tipo_vehiculo": "Camión",
        "capacidad_pasajeros": 3,
        "kilometraje_actual": 5000,
        "kilometraje_limite_mantenimiento": 15000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)

    r_data = {
        "codigo_ruta": "RUT-002",
        "nombre_ruta": "Ruta Norte",
        "origen": "4.70,-74.03",
        "destino": "4.75,-74.01",
        "fecha_programada": datetime.now(timezone.utc),
        "estado_ruta": "EN_PROCESO",
        "id_vehiculo": vehicle.id_vehiculo
    }
    RouteService.create(r_data, db_session)

    with pytest.raises(HTTPException) as exc_info:
        VehicleService.update(vehicle.id_vehiculo, {"estado_vehiculo": "DISPONIBLE"}, db_session)

    assert exc_info.value.status_code == 400
    assert "No se puede cambiar el estado a DISPONIBLE" in exc_info.value.detail


def test_vehicle_reverts_to_disponible_when_route_completed(db_session):
    """Si la ruta pasa a COMPLETADA, el vehículo vuelve automáticamente a DISPONIBLE."""
    v_data = {
        "placa": "CCC789",
        "marca": "Renault",
        "modelo": "Master",
        "anio": 2023,
        "tipo_vehiculo": "Furgón",
        "capacidad_pasajeros": 2,
        "kilometraje_actual": 2000,
        "kilometraje_limite_mantenimiento": 10000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)

    r_data = {
        "codigo_ruta": "RUT-003",
        "nombre_ruta": "Ruta Sur",
        "origen": "4.50,-74.10",
        "destino": "4.55,-74.12",
        "fecha_programada": datetime.now(timezone.utc),
        "estado_ruta": "EN_PROCESO",
        "id_vehiculo": vehicle.id_vehiculo
    }
    route = RouteService.create(r_data, db_session)

    vehicle_in_route = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_in_route.estado_vehiculo == "EN_RUTA"

    RouteService.update(route.id_ruta, {"estado_ruta": "COMPLETADA"}, db_session)

    vehicle_completed = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_completed.estado_vehiculo == "DISPONIBLE"


def test_vehicle_reverts_to_disponible_on_route_deletion(db_session):
    """Si la ruta activa se elimina, el vehículo vuelve automáticamente a DISPONIBLE."""
    v_data = {
        "placa": "DDD101",
        "marca": "Nissan",
        "modelo": "Urvan",
        "anio": 2020,
        "tipo_vehiculo": "Bus",
        "capacidad_pasajeros": 15,
        "kilometraje_actual": 12000,
        "kilometraje_limite_mantenimiento": 20000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)

    r_data = {
        "codigo_ruta": "RUT-004",
        "nombre_ruta": "Ruta Expresa",
        "origen": "4.60,-74.08",
        "destino": "4.80,-74.00",
        "fecha_programada": datetime.now(timezone.utc),
        "estado_ruta": "PROGRAMADA",
        "id_vehiculo": vehicle.id_vehiculo
    }
    route = RouteService.create(r_data, db_session)

    vehicle_in_route = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_in_route.estado_vehiculo == "EN_RUTA"

    RouteService.delete(route.id_ruta, db_session)

    vehicle_after_delete = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_after_delete.estado_vehiculo == "DISPONIBLE"


def test_manual_status_change_when_no_active_route(db_session):
    """Si un vehículo no tiene ruta activa, se puede cambiar libremente de estado."""
    v_data = {
        "placa": "EEE202",
        "marca": "Ford",
        "modelo": "Cargo",
        "anio": 2019,
        "tipo_vehiculo": "Camión",
        "capacidad_pasajeros": 2,
        "kilometraje_actual": 30000,
        "kilometraje_limite_mantenimiento": 35000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)

    updated_1 = VehicleService.update(vehicle.id_vehiculo, {"estado_vehiculo": "MANTENIMIENTO"}, db_session)
    assert updated_1.estado_vehiculo == "MANTENIMIENTO"

    updated_2 = VehicleService.update(vehicle.id_vehiculo, {"estado_vehiculo": "INACTIVO"}, db_session)
    assert updated_2.estado_vehiculo == "INACTIVO"

    updated_3 = VehicleService.update(vehicle.id_vehiculo, {"estado_vehiculo": "DISPONIBLE"}, db_session)
    assert updated_3.estado_vehiculo == "DISPONIBLE"


def test_driver_status_auto_en_ruta_and_reversion(db_session):
    """Un conductor asignado a ruta activa pasa a EN_RUTA, se rechaza cambio manual a DISPONIBLE y vuelve a DISPONIBLE al terminar."""
    rol = Rol(nombre_rol="Conductor", descripcion_rol="Rol Conductor")
    db_session.add(rol)
    db_session.commit()

    user = Usuario(
        id_rol=rol.id_rol,
        nombres_usuario="Carlos",
        apellidos_usuario="Gómez",
        correo_usuario="driver1@vextor.com",
        contrasenia_usuario="hash"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    d_data = {
        "id_usuario": user.id_usuario,
        "nombre_conductor": "Carlos",
        "apellido_conductor": "Gómez",
        "cedula_conductor": "1020304050",
        "telefono_conductor": "3101234567",
        "licencia": "C2",
        "estado_conductor": "DISPONIBLE",
        "fecha_ingreso": date(2023, 1, 15)
    }
    driver = DriverService.create(d_data, db_session)
    assert driver.estado_conductor == "DISPONIBLE"

    r_data = {
        "codigo_ruta": "RUT-005",
        "nombre_ruta": "Ruta Nocturna",
        "origen": "4.60,-74.08",
        "destino": "4.70,-74.05",
        "fecha_programada": datetime.now(timezone.utc),
        "estado_ruta": "PROGRAMADA",
        "id_conductor": driver.id_conductor
    }
    route = RouteService.create(r_data, db_session)

    driver_in_route = DriverService.get_by_id(driver.id_conductor, db_session)
    assert driver_in_route.estado_conductor == "EN_RUTA"

    with pytest.raises(HTTPException) as exc_info:
        DriverService.update(driver.id_conductor, {"estado_conductor": "DISPONIBLE"}, db_session)
    assert exc_info.value.status_code == 400

    RouteService.update(route.id_ruta, {"estado_ruta": "EN_PROCESO"}, db_session)
    RouteService.update(route.id_ruta, {"estado_ruta": "COMPLETADA"}, db_session)

    driver_completed = DriverService.get_by_id(driver.id_conductor, db_session)
    assert driver_completed.estado_conductor == "DISPONIBLE"


def test_vehicle_status_sync_with_maintenance(db_session):
    """Vehículo pasa a MANTENIMIENTO cuando hay mantenimiento EN_PROCESO y vuelve a DISPONIBLE al terminar."""
    v_data = {
        "placa": "FFF303",
        "marca": "Mercedes",
        "modelo": "Sprinter",
        "anio": 2022,
        "tipo_vehiculo": "Bus",
        "capacidad_pasajeros": 19,
        "kilometraje_actual": 25000,
        "kilometraje_limite_mantenimiento": 25000,
        "estado_vehiculo": "DISPONIBLE"
    }
    vehicle = VehicleService.create(v_data, db_session)

    m_data = {
        "id_vehiculo": vehicle.id_vehiculo,
        "tipo_mantenimiento": "PREVENTIVO",
        "descripcion_mantenimiento": "Cambio de aceite y filtros",
        "fecha_mantenimiento": date.today(),
        "costo_mantenimiento": 250000.0,
        "kilometraje_mantenimiento": "25000",
        "estado_mantenimiento": "EN_PROCESO"
    }
    maint = MaintenanceService.create(m_data, db_session)

    vehicle_maint = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_maint.estado_vehiculo == "MANTENIMIENTO"

    MaintenanceService.update(maint.id_mantenimiento, {"estado_mantenimiento": "COMPLETADA"}, db_session)

    vehicle_done = VehicleService.get_by_id(vehicle.id_vehiculo, db_session)
    assert vehicle_done.estado_vehiculo == "DISPONIBLE"
