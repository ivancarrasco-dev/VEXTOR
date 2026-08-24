"""
Servicios CRUD para Vehículos, Conductores, Rutas, Mantenimiento, Usuarios, Empresa
Contiene la lógica de negocio para cada entidad
"""
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Vehiculo, Conductor, Ruta, Mantenimiento, Usuario, Empresa
from app.models import AsignacionConductor, AsignacionVehiculo
from app.utils import validate_colombian_plate


def sync_driver_status(driver_id: UUID, db: Session):
    """
    Sincroniza el estado del conductor según sus asignaciones a rutas activas.
    Rutas activas son aquellas con estado_ruta IN ('PROGRAMADA', 'EN_PROCESO').
    """
    driver = db.query(Conductor).filter(Conductor.id_conductor == driver_id).first()
    if not driver:
        return

    active_assignment = (
        db.query(AsignacionConductor)
        .join(Ruta, AsignacionConductor.id_ruta == Ruta.id_ruta)
        .filter(
            AsignacionConductor.id_conductor == driver_id,
            Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO"])
        )
        .first()
    )

    if active_assignment:
        if driver.estado_conductor != "EN_RUTA":
            driver.estado_conductor = "EN_RUTA"
            db.commit()
            db.refresh(driver)
    else:
        if driver.estado_conductor == "EN_RUTA":
            driver.estado_conductor = "DISPONIBLE"
            db.commit()
            db.refresh(driver)


def sync_vehicle_status(vehicle_id: UUID, db: Session):
    """
    Sincroniza el estado del vehículo según sus asignaciones a rutas activas
    y mantenimientos en proceso.
    """
    vehicle = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehicle_id).first()
    if not vehicle:
        return

    active_route = (
        db.query(AsignacionVehiculo)
        .join(Ruta, AsignacionVehiculo.id_ruta == Ruta.id_ruta)
        .filter(
            AsignacionVehiculo.id_vehiculo == vehicle_id,
            Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO"])
        )
        .first()
    )

    active_maintenance = (
        db.query(Mantenimiento)
        .filter(
            Mantenimiento.id_vehiculo == vehicle_id,
            Mantenimiento.estado_mantenimiento == "EN_PROCESO"
        )
        .first()
    )

    if active_route:
        if vehicle.estado_vehiculo != "EN_RUTA":
            vehicle.estado_vehiculo = "EN_RUTA"
            db.commit()
            db.refresh(vehicle)
    elif active_maintenance:
        if vehicle.estado_vehiculo != "MANTENIMIENTO":
            vehicle.estado_vehiculo = "MANTENIMIENTO"
            db.commit()
            db.refresh(vehicle)
    else:
        if vehicle.estado_vehiculo == "EN_RUTA":
            vehicle.estado_vehiculo = "DISPONIBLE"
            db.commit()
            db.refresh(vehicle)


class VehicleService:
    """CRUD de vehículos"""

    @staticmethod
    def get_all(db: Session):
        vehicles = db.query(Vehiculo).all()
        for v in vehicles:
            sync_vehicle_status(v.id_vehiculo, db)
        return vehicles

    @staticmethod
    def get_by_id(vehicle_id: UUID, db: Session):
        vehicle = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehicle_id).first()
        if vehicle:
            sync_vehicle_status(vehicle.id_vehiculo, db)
        return vehicle

    @staticmethod
    def create(vehicle_data: dict, db: Session):
        # Validar placa
        if not validate_colombian_plate(vehicle_data.get("placa", "")):
            raise HTTPException(status_code=400, detail="Formato de placa inválido")

        # Verificar duplicado
        existing = db.query(Vehiculo).filter(
            Vehiculo.placa == vehicle_data["placa"].upper()
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="La placa ya existe")

        vehicle = Vehiculo(**vehicle_data)
        vehicle.placa = vehicle.placa.upper()
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        sync_vehicle_status(vehicle.id_vehiculo, db)
        return vehicle

    @staticmethod
    def update(vehicle_id: UUID, vehicle_data: dict, db: Session):
        vehicle = VehicleService.get_by_id(vehicle_id, db)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

        new_status = vehicle_data.get("estado_vehiculo")
        if new_status == "DISPONIBLE":
            has_active_route = (
                db.query(AsignacionVehiculo)
                .join(Ruta, AsignacionVehiculo.id_ruta == Ruta.id_ruta)
                .filter(
                    AsignacionVehiculo.id_vehiculo == vehicle_id,
                    Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO"])
                )
                .first()
            )
            if has_active_route:
                raise HTTPException(
                    status_code=400,
                    detail="No se puede cambiar el estado a DISPONIBLE mientras el vehículo tenga una ruta activa o asignada."
                )

        for key, value in vehicle_data.items():
            if value is not None:
                if key == "placa":
                    value = value.upper()
                setattr(vehicle, key, value)

        db.commit()
        db.refresh(vehicle)
        sync_vehicle_status(vehicle_id, db)
        return vehicle

    @staticmethod
    def delete(vehicle_id: UUID, db: Session):
        vehicle = VehicleService.get_by_id(vehicle_id, db)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

        asig = db.query(AsignacionVehiculo).filter(
            AsignacionVehiculo.id_vehiculo == vehicle_id
        ).first()
        if asig:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar un vehículo con rutas asignadas."
            )

        maint = db.query(Mantenimiento).filter(
            Mantenimiento.id_vehiculo == vehicle_id
        ).first()
        if maint:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar un vehículo con mantenimientos registrados."
            )

        db.delete(vehicle)
        db.commit()
        return True


class DriverService:
    """CRUD de conductores"""

    @staticmethod
    def get_all(db: Session):
        drivers = db.query(Conductor).all()
        for d in drivers:
            sync_driver_status(d.id_conductor, db)
        return drivers

    @staticmethod
    def get_by_id(driver_id: UUID, db: Session):
        driver = db.query(Conductor).filter(Conductor.id_conductor == driver_id).first()
        if driver:
            sync_driver_status(driver.id_conductor, db)
        return driver

    @staticmethod
    def create(driver_data: dict, db: Session):
        conductor = Conductor(**driver_data)
        db.add(conductor)
        db.commit()
        db.refresh(conductor)
        sync_driver_status(conductor.id_conductor, db)
        return conductor

    @staticmethod
    def update(driver_id: UUID, driver_data: dict, db: Session):
        conductor = DriverService.get_by_id(driver_id, db)
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")

        new_status = driver_data.get("estado_conductor")
        if new_status in ("DISPONIBLE", "ACTIVO"):
            has_active_route = (
                db.query(AsignacionConductor)
                .join(Ruta, AsignacionConductor.id_ruta == Ruta.id_ruta)
                .filter(
                    AsignacionConductor.id_conductor == driver_id,
                    Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO"])
                )
                .first()
            )
            if has_active_route:
                raise HTTPException(
                    status_code=400,
                    detail="No se puede cambiar el estado a DISPONIBLE mientras el conductor tenga una ruta activa o asignada."
                )

        for key, value in driver_data.items():
            if value is not None:
                setattr(conductor, key, value)

        db.commit()
        db.refresh(conductor)
        sync_driver_status(driver_id, db)
        return conductor

    @staticmethod
    def delete(driver_id: UUID, db: Session):
        conductor = DriverService.get_by_id(driver_id, db)
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")

        db.delete(conductor)
        db.commit()
        return True


class RouteService:
    """CRUD de rutas"""

    @staticmethod
    def get_all(db: Session):
        routes = db.query(Ruta).all()
        for r in routes:
            asig_c = db.query(AsignacionConductor).filter(
                AsignacionConductor.id_ruta == r.id_ruta
            ).first()
            asig_v = db.query(AsignacionVehiculo).filter(
                AsignacionVehiculo.id_ruta == r.id_ruta
            ).first()
            r.id_conductor = asig_c.id_conductor if asig_c else None
            r.id_vehiculo = asig_v.id_vehiculo if asig_v else None
            if r.id_conductor:
                sync_driver_status(r.id_conductor, db)
            if r.id_vehiculo:
                sync_vehicle_status(r.id_vehiculo, db)
        return routes

    @staticmethod
    def get_by_id(route_id: UUID, db: Session):
        return db.query(Ruta).filter(Ruta.id_ruta == route_id).first()

    @staticmethod
    def create(route_data: dict, db: Session):
        conductor_id = route_data.pop("id_conductor", None)
        vehicle_id = route_data.pop("id_vehiculo", None)

        ruta = Ruta(**route_data)
        db.add(ruta)
        db.commit()
        db.refresh(ruta)

        if conductor_id:
            asig_c = AsignacionConductor(id_conductor=conductor_id, id_ruta=ruta.id_ruta)
            db.add(asig_c)
        if vehicle_id:
            asig_v = AsignacionVehiculo(id_vehiculo=vehicle_id, id_ruta=ruta.id_ruta)
            db.add(asig_v)

        db.commit()
        ruta.id_conductor = conductor_id
        ruta.id_vehiculo = vehicle_id

        if conductor_id:
            sync_driver_status(conductor_id, db)
        if vehicle_id:
            sync_vehicle_status(vehicle_id, db)

        return ruta

    @staticmethod
    def update(route_id: UUID, route_data: dict, db: Session):
        ruta = RouteService.get_by_id(route_id, db)
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        old_asig_c = db.query(AsignacionConductor).filter(
            AsignacionConductor.id_ruta == route_id
        ).first()
        old_driver_id = old_asig_c.id_conductor if old_asig_c else None

        old_asig_v = db.query(AsignacionVehiculo).filter(
            AsignacionVehiculo.id_ruta == route_id
        ).first()
        old_vehicle_id = old_asig_v.id_vehiculo if old_asig_v else None

        conductor_id = route_data.pop("id_conductor", None)
        vehicle_id = route_data.pop("id_vehiculo", None)

        for key, value in route_data.items():
            if value is not None:
                setattr(ruta, key, value)

        if conductor_id is not None:
            asig_c = db.query(AsignacionConductor).filter(
                AsignacionConductor.id_ruta == route_id
            ).first()
            if asig_c:
                asig_c.id_conductor = conductor_id
            else:
                asig_c = AsignacionConductor(id_conductor=conductor_id, id_ruta=route_id)
                db.add(asig_c)

        if vehicle_id is not None:
            asig_v = db.query(AsignacionVehiculo).filter(
                AsignacionVehiculo.id_ruta == route_id
            ).first()
            if asig_v:
                asig_v.id_vehiculo = vehicle_id
            else:
                asig_v = AsignacionVehiculo(id_vehiculo=vehicle_id, id_ruta=route_id)
                db.add(asig_v)

        db.commit()
        db.refresh(ruta)

        if old_driver_id:
            sync_driver_status(old_driver_id, db)
        if conductor_id:
            sync_driver_status(conductor_id, db)

        if old_vehicle_id:
            sync_vehicle_status(old_vehicle_id, db)
        if vehicle_id:
            sync_vehicle_status(vehicle_id, db)

        return ruta

    @staticmethod
    def delete(route_id: UUID, db: Session):
        ruta = RouteService.get_by_id(route_id, db)
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        asig_c = db.query(AsignacionConductor).filter(
            AsignacionConductor.id_ruta == route_id
        ).first()
        driver_id = asig_c.id_conductor if asig_c else None

        asig_v = db.query(AsignacionVehiculo).filter(
            AsignacionVehiculo.id_ruta == route_id
        ).first()
        vehicle_id = asig_v.id_vehiculo if asig_v else None

        db.query(AsignacionConductor).filter(
            AsignacionConductor.id_ruta == route_id
        ).delete()
        db.query(AsignacionVehiculo).filter(
            AsignacionVehiculo.id_ruta == route_id
        ).delete()
        db.delete(ruta)
        db.commit()

        if driver_id:
            sync_driver_status(driver_id, db)
        if vehicle_id:
            sync_vehicle_status(vehicle_id, db)

        return True


class MaintenanceService:
    """CRUD de mantenimiento"""

    @staticmethod
    def get_all(db: Session):
        return db.query(Mantenimiento).all()

    @staticmethod
    def get_by_id(maintenance_id: UUID, db: Session):
        return db.query(Mantenimiento).filter(
            Mantenimiento.id_mantenimiento == maintenance_id
        ).first()

    @staticmethod
    def create(maintenance_data: dict, db: Session):
        mantenimiento = Mantenimiento(**maintenance_data)
        db.add(mantenimiento)
        db.commit()
        db.refresh(mantenimiento)
        if mantenimiento.id_vehiculo:
            sync_vehicle_status(mantenimiento.id_vehiculo, db)
        return mantenimiento

    @staticmethod
    def update(maintenance_id: UUID, maintenance_data: dict, db: Session):
        mantenimiento = MaintenanceService.get_by_id(maintenance_id, db)
        if not mantenimiento:
            raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

        old_status = mantenimiento.estado_mantenimiento
        for key, value in maintenance_data.items():
            if value is not None:
                setattr(mantenimiento, key, value)

        db.commit()
        db.refresh(mantenimiento)

        vehicle_id = mantenimiento.id_vehiculo
        if vehicle_id:
            if old_status == "EN_PROCESO" and mantenimiento.estado_mantenimiento in ("COMPLETADA", "CANCELADO"):
                other_maint = db.query(Mantenimiento).filter(
                    Mantenimiento.id_vehiculo == vehicle_id,
                    Mantenimiento.estado_mantenimiento == "EN_PROCESO",
                    Mantenimiento.id_mantenimiento != maintenance_id
                ).first()
                if not other_maint:
                    vehicle = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehicle_id).first()
                    if vehicle and vehicle.estado_vehiculo == "MANTENIMIENTO":
                        vehicle.estado_vehiculo = "DISPONIBLE"
                        db.commit()
            sync_vehicle_status(vehicle_id, db)
        return mantenimiento

    @staticmethod
    def delete(maintenance_id: UUID, db: Session):
        mantenimiento = MaintenanceService.get_by_id(maintenance_id, db)
        if not mantenimiento:
            raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

        vehicle_id = mantenimiento.id_vehiculo
        was_in_proceso = mantenimiento.estado_mantenimiento == "EN_PROCESO"
        db.delete(mantenimiento)
        db.commit()

        if vehicle_id:
            if was_in_proceso:
                other_maint = db.query(Mantenimiento).filter(
                    Mantenimiento.id_vehiculo == vehicle_id,
                    Mantenimiento.estado_mantenimiento == "EN_PROCESO"
                ).first()
                if not other_maint:
                    vehicle = db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehicle_id).first()
                    if vehicle and vehicle.estado_vehiculo == "MANTENIMIENTO":
                        vehicle.estado_vehiculo = "DISPONIBLE"
                        db.commit()
            sync_vehicle_status(vehicle_id, db)
        return True


class UserService:
    """CRUD de usuarios"""

    @staticmethod
    def get_all(db: Session):
        return db.query(Usuario).all()

    @staticmethod
    def get_by_id(user_id: UUID, db: Session):
        return db.query(Usuario).filter(Usuario.id_usuario == user_id).first()

    @staticmethod
    def delete(user_id: UUID, db: Session):
        usuario = UserService.get_by_id(user_id, db)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        db.delete(usuario)
        db.commit()
        return True


class CompanyService:
    """CRUD de empresa"""

    @staticmethod
    def get_all(db: Session):
        return db.query(Empresa).all()

    @staticmethod
    def get_by_id(company_id: UUID, db: Session):
        return db.query(Empresa).filter(Empresa.id_empresa == company_id).first()

    @staticmethod
    def create(company_data: dict, db: Session):
        empresa = Empresa(**company_data)
        db.add(empresa)
        db.commit()
        db.refresh(empresa)
        return empresa

    @staticmethod
    def update(company_id: UUID, company_data: dict, db: Session):
        empresa = CompanyService.get_by_id(company_id, db)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        for key, value in company_data.items():
            if value is not None:
                setattr(empresa, key, value)

        db.commit()
        db.refresh(empresa)
        return empresa

    @staticmethod
    def delete(company_id: UUID, db: Session):
        empresa = CompanyService.get_by_id(company_id, db)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        db.delete(empresa)
        db.commit()
        return True
