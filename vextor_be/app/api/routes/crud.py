"""
Endpoints CRUD para Vehículos, Conductores, Rutas, Mantenimiento, Usuarios, Empresa
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    Vehiculo, VehiculoCreate, VehiculoUpdate,
    Conductor, ConductorCreate, ConductorUpdate,
    Ruta, RutaCreate, RutaUpdate,
    Mantenimiento, MantenimientoCreate, MantenimientoUpdate,
    Usuario, UsuarioCreate, UsuarioUpdate,
    Empresa, EmpresaCreate, EmpresaUpdate,
)
from app.services import (
    VehicleService, DriverService, RouteService,
    MaintenanceService, UserService, CompanyService,
)
from app.api.routes.auth import get_current_user

# Routers
vehicles_router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])
drivers_router = APIRouter(prefix="/api/drivers", tags=["Drivers"])
routes_router = APIRouter(prefix="/api/routes", tags=["Routes"])
maintenance_router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])
company_router = APIRouter(prefix="/api/company", tags=["Company"])


# ========== VEHICLES ==========

@vehicles_router.get("", response_model=List[Vehiculo])
def get_vehicles(db: Session = Depends(get_db)):
    return VehicleService.get_all(db)


@vehicles_router.post("", response_model=Vehiculo)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return VehicleService.create(vehicle.model_dump(), db)


@vehicles_router.put("/{id_vehiculo}", response_model=Vehiculo)
def update_vehicle(
    id_vehiculo: UUID,
    vehicle: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return VehicleService.update(id_vehiculo, vehicle.model_dump(exclude_unset=True), db)


@vehicles_router.delete("/{id_vehiculo}")
def delete_vehicle(
    id_vehiculo: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    VehicleService.delete(id_vehiculo, db)
    return {"message": "Vehículo eliminado correctamente"}


# ========== DRIVERS ==========

@drivers_router.get("", response_model=List[Conductor])
def get_drivers(db: Session = Depends(get_db)):
    return DriverService.get_all(db)


@drivers_router.post("", response_model=Conductor)
def create_driver(
    driver: ConductorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return DriverService.create(driver.model_dump(), db)


@drivers_router.put("/{id_conductor}", response_model=Conductor)
def update_driver(
    id_conductor: UUID,
    driver: ConductorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return DriverService.update(id_conductor, driver.model_dump(exclude_unset=True), db)


@drivers_router.delete("/{id_conductor}")
def delete_driver(
    id_conductor: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    DriverService.delete(id_conductor, db)
    return {"message": "Conductor eliminado correctamente"}


# ========== ROUTES ==========

@routes_router.get("", response_model=List[Ruta])
def get_routes(db: Session = Depends(get_db)):
    return RouteService.get_all(db)


@routes_router.post("", response_model=Ruta)
def create_route(
    route: RutaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return RouteService.create(route.model_dump(), db)


@routes_router.put("/{id_ruta}", response_model=Ruta)
def update_route(
    id_ruta: UUID,
    route: RutaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return RouteService.update(id_ruta, route.model_dump(exclude_unset=True), db)


@routes_router.delete("/{id_ruta}")
def delete_route(
    id_ruta: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    RouteService.delete(id_ruta, db)
    return {"message": "Ruta eliminada correctamente"}


# ========== MAINTENANCE ==========

@maintenance_router.get("", response_model=List[Mantenimiento])
def get_maintenance(db: Session = Depends(get_db)):
    return MaintenanceService.get_all(db)


@maintenance_router.post("", response_model=Mantenimiento)
def create_maintenance(
    maintenance: MantenimientoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return MaintenanceService.create(maintenance.model_dump(), db)


@maintenance_router.put("/{id_mantenimiento}", response_model=Mantenimiento)
def update_maintenance(
    id_mantenimiento: UUID,
    maintenance: MantenimientoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return MaintenanceService.update(
        id_mantenimiento,
        maintenance.model_dump(exclude_unset=True),
        db,
    )


@maintenance_router.delete("/{id_mantenimiento}")
def delete_maintenance(
    id_mantenimiento: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    MaintenanceService.delete(id_mantenimiento, db)
    return {"message": "Mantenimiento eliminado correctamente"}


# ========== USERS ==========

@users_router.get("", response_model=List[Usuario])
def get_users(db: Session = Depends(get_db)):
    return UserService.get_all(db)


@users_router.delete("/{id_usuario}")
def delete_user(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    UserService.delete(id_usuario, db)
    return {"message": "Usuario eliminado correctamente"}


# ========== COMPANY ==========

@company_router.get("", response_model=List[Empresa])
def get_company(db: Session = Depends(get_db)):
    return CompanyService.get_all(db)


@company_router.post("", response_model=Empresa)
def create_company(
    company: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return CompanyService.create(company.model_dump(), db)


@company_router.put("/{id_empresa}", response_model=Empresa)
def update_company(
    id_empresa: UUID,
    company: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return CompanyService.update(id_empresa, company.model_dump(exclude_unset=True), db)


@company_router.delete("/{id_empresa}")
def delete_company(
    id_empresa: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    CompanyService.delete(id_empresa, db)
    return {"message": "Empresa eliminada correctamente"}
