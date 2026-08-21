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


class VehicleService:
    """CRUD de vehículos"""

    @staticmethod
    def get_all(db: Session):
        return db.query(Vehiculo).all()

    @staticmethod
    def get_by_id(vehicle_id: UUID, db: Session):
        return db.query(Vehiculo).filter(Vehiculo.id_vehiculo == vehicle_id).first()

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
        return vehicle

    @staticmethod
    def update(vehicle_id: UUID, vehicle_data: dict, db: Session):
        vehicle = VehicleService.get_by_id(vehicle_id, db)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

        for key, value in vehicle_data.items():
            if value is not None:
                if key == "placa":
                    value = value.upper()
                setattr(vehicle, key, value)

        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def delete(vehicle_id: UUID, db: Session):
        vehicle = VehicleService.get_by_id(vehicle_id, db)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

        db.delete(vehicle)
        db.commit()
        return True


class DriverService:
    """CRUD de conductores"""

    @staticmethod
    def get_all(db: Session):
        return db.query(Conductor).all()

    @staticmethod
    def get_by_id(driver_id: UUID, db: Session):
        return db.query(Conductor).filter(Conductor.id_conductor == driver_id).first()

    @staticmethod
    def create(driver_data: dict, db: Session):
        conductor = Conductor(**driver_data)
        db.add(conductor)
        db.commit()
        db.refresh(conductor)
        return conductor

    @staticmethod
    def update(driver_id: UUID, driver_data: dict, db: Session):
        conductor = DriverService.get_by_id(driver_id, db)
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")

        for key, value in driver_data.items():
            if value is not None:
                setattr(conductor, key, value)

        db.commit()
        db.refresh(conductor)
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
        return ruta

    @staticmethod
    def update(route_id: UUID, route_data: dict, db: Session):
        ruta = RouteService.get_by_id(route_id, db)
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        conductor_id = route_data.pop("id_conductor", None)
        vehicle_id = route_data.pop("id_vehiculo", None)

        for key, value in route_data.items():
            if value is not None:
                setattr(ruta, key, value)

        if conductor_id:
            asig_c = db.query(AsignacionConductor).filter(
                AsignacionConductor.id_ruta == route_id
            ).first()
            if asig_c:
                asig_c.id_conductor = conductor_id
            else:
                asig_c = AsignacionConductor(id_conductor=conductor_id, id_ruta=route_id)
                db.add(asig_c)

        if vehicle_id:
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
        return ruta

    @staticmethod
    def delete(route_id: UUID, db: Session):
        ruta = RouteService.get_by_id(route_id, db)
        if not ruta:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        db.query(AsignacionConductor).filter(
            AsignacionConductor.id_ruta == route_id
        ).delete()
        db.query(AsignacionVehiculo).filter(
            AsignacionVehiculo.id_ruta == route_id
        ).delete()
        db.delete(ruta)
        db.commit()
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
        return mantenimiento

    @staticmethod
    def update(maintenance_id: UUID, maintenance_data: dict, db: Session):
        mantenimiento = MaintenanceService.get_by_id(maintenance_id, db)
        if not mantenimiento:
            raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

        for key, value in maintenance_data.items():
            if value is not None:
                setattr(mantenimiento, key, value)

        db.commit()
        db.refresh(mantenimiento)
        return mantenimiento

    @staticmethod
    def delete(maintenance_id: UUID, db: Session):
        mantenimiento = MaintenanceService.get_by_id(maintenance_id, db)
        if not mantenimiento:
            raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

        db.delete(mantenimiento)
        db.commit()
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
