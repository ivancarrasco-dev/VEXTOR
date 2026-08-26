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
    AuditService,
)
from app.api.routes.auth import get_current_user

# Routers
vehicles_router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])
drivers_router = APIRouter(prefix="/api/drivers", tags=["Drivers"])
routes_router = APIRouter(prefix="/api/routes", tags=["Routes"])
maintenance_router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])
company_router = APIRouter(prefix="/api/company", tags=["Company"])


# Dependencia para requerir rol de Administrador
def require_admin(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models import Rol
    rol = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
    if not rol or rol.nombre_rol != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de Administrador"
        )
    return current_user


# ========== VEHICLES ==========

@vehicles_router.get("", response_model=List[Vehiculo])
def get_vehicles(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    limit = min(limit, 100)
    return VehicleService.get_all(db)[skip : skip + limit]


@vehicles_router.post("", response_model=Vehiculo)
def create_vehicle(
    vehicle: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = VehicleService.create(vehicle.model_dump(), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Vehículos", f"Vehículo registrado con placa: {res.placa}"
    )
    return res


@vehicles_router.put("/{id_vehiculo}", response_model=Vehiculo)
def update_vehicle(
    id_vehiculo: UUID,
    vehicle: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = VehicleService.update(id_vehiculo, vehicle.model_dump(exclude_unset=True), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Vehículos", f"Vehículo actualizado ID: {id_vehiculo}"
    )
    return res


@vehicles_router.delete("/{id_vehiculo}")
def delete_vehicle(
    id_vehiculo: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    VehicleService.delete(id_vehiculo, db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ELIMINACION", "Vehículos", f"Vehículo eliminado ID: {id_vehiculo}"
    )
    return {"message": "Vehículo eliminado correctamente"}


# ========== DRIVERS ==========

@drivers_router.get("", response_model=List[Conductor])
def get_drivers(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    limit = min(limit, 100)
    return DriverService.get_all(db)[skip : skip + limit]


@drivers_router.post("", response_model=Conductor)
def create_driver(
    driver: ConductorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = DriverService.create(driver.model_dump(), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Conductores", f"Conductor creado: {res.nombre_conductor} {res.apellido_conductor}"
    )
    return res


@drivers_router.put("/{id_conductor}", response_model=Conductor)
def update_driver(
    id_conductor: UUID,
    driver: ConductorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = DriverService.update(id_conductor, driver.model_dump(exclude_unset=True), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Conductores", f"Conductor actualizado ID: {id_conductor}"
    )
    return res


@drivers_router.delete("/{id_conductor}")
def delete_driver(
    id_conductor: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    DriverService.delete(id_conductor, db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ELIMINACION", "Conductores", f"Conductor eliminado ID: {id_conductor}"
    )
    return {"message": "Conductor eliminado correctamente"}


# ========== ROUTES ==========

@routes_router.get("", response_model=List[Ruta])
def get_routes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    limit = min(limit, 100)
    return RouteService.get_all(db)[skip : skip + limit]


@routes_router.post("", response_model=Ruta)
def create_route(
    route: RutaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = RouteService.create(route.model_dump(), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Rutas", f"Ruta creada con código: {res.codigo_ruta}"
    )
    return res


@routes_router.put("/{id_ruta}", response_model=Ruta)
def update_route(
    id_ruta: UUID,
    route: RutaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    from app.models import Rol, Conductor, AsignacionConductor
    rol = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
    is_admin = rol and rol.nombre_rol == "Administrador"

    if not is_admin:
        driver = db.query(Conductor).filter(Conductor.id_usuario == current_user.id_usuario).first()
        if not driver:
            raise HTTPException(status_code=403, detail="Acceso denegado: No es un conductor autorizado")

        asig = db.query(AsignacionConductor).filter(
            AsignacionConductor.id_ruta == id_ruta,
            AsignacionConductor.id_conductor == driver.id_conductor
        ).first()
        if not asig:
            raise HTTPException(status_code=403, detail="Acceso denegado: No está asignado a esta ruta")

    res = RouteService.update(id_ruta, route.model_dump(exclude_unset=True), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Rutas", f"Ruta actualizada ID: {id_ruta}"
    )
    return res


@routes_router.delete("/{id_ruta}")
def delete_route(
    id_ruta: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    RouteService.delete(id_ruta, db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ELIMINACION", "Rutas", f"Ruta eliminada ID: {id_ruta}"
    )
    return {"message": "Ruta eliminada correctamente"}


# ========== MAINTENANCE ==========

@maintenance_router.get("", response_model=List[Mantenimiento])
def get_maintenance(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    limit = min(limit, 100)
    return MaintenanceService.get_all(db)[skip : skip + limit]


@maintenance_router.post("", response_model=Mantenimiento)
def create_maintenance(
    maintenance: MantenimientoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = MaintenanceService.create(maintenance.model_dump(), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Mantenimiento", f"Mantenimiento creado ID: {res.id_mantenimiento}"
    )
    return res


@maintenance_router.put("/{id_mantenimiento}", response_model=Mantenimiento)
def update_maintenance(
    id_mantenimiento: UUID,
    maintenance: MantenimientoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = MaintenanceService.update(
        id_mantenimiento,
        maintenance.model_dump(exclude_unset=True),
        db,
    )
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Mantenimiento", f"Mantenimiento actualizado ID: {id_mantenimiento}"
    )
    return res


@maintenance_router.delete("/{id_mantenimiento}")
def delete_maintenance(
    id_mantenimiento: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    MaintenanceService.delete(id_mantenimiento, db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ELIMINACION", "Mantenimiento", f"Mantenimiento eliminado ID: {id_mantenimiento}"
    )
    return {"message": "Mantenimiento eliminado correctamente"}


# ========== USERS ==========

@users_router.get("", response_model=List[Usuario])
def get_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    limit = min(limit, 100)
    return UserService.get_all(db)[skip : skip + limit]


@users_router.post("", response_model=Usuario)
def create_user(
    user_data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = UserService.create(user_data.model_dump(), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Usuarios", f"Usuario creado: {res.correo_usuario}"
    )
    return res


@users_router.put("/{id_usuario}", response_model=Usuario)
def update_user(
    id_usuario: UUID,
    user_data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    res = UserService.update(id_usuario, user_data.model_dump(exclude_unset=True), db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Usuarios", f"Usuario actualizado ID: {id_usuario}"
    )
    return res


@users_router.delete("/{id_usuario}")
def delete_user(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    UserService.delete(id_usuario, db)
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ELIMINACION", "Usuarios", f"Usuario eliminado ID: {id_usuario}"
    )
    return {"message": "Usuario eliminado correctamente"}


# ========== COMPANY ==========

@company_router.get("", response_model=List[Empresa])
def get_company(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return CompanyService.get_all(db)


@company_router.post("", response_model=Empresa)
def create_company(
    company: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    return CompanyService.create(company.model_dump(), db)


@company_router.put("/{id_empresa}", response_model=Empresa)
def update_company(
    id_empresa: UUID,
    company: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    return CompanyService.update(id_empresa, company.model_dump(exclude_unset=True), db)


@company_router.delete("/{id_empresa}")
def delete_company(
    id_empresa: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    CompanyService.delete(id_empresa, db)
    return {"message": "Empresa eliminada correctamente"}
