"""
Endpoints CRUD para Vehículos, Conductores, Rutas, Mantenimiento, Usuarios, Empresa
ACTUALIZADO: Soporte para correo de conductores vinculado a Usuario
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys

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
from app.models import Rol

# Routers
vehicles_router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])
drivers_router = APIRouter(prefix="/api/drivers", tags=["Drivers"])
routes_router = APIRouter(prefix="/api/routes", tags=["Routes"])
maintenance_router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])
company_router = APIRouter(prefix="/api/company", tags=["Company"])


# Dependencia para requerir rol de Administrador
def require_admin(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
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
    AuditService.create_notification(
        db,
        titulo="Nuevo Vehículo",
        descripcion=f"Vehículo registrado: {res.placa}",
        tipo="vehiculo",
        id_usuario=current_user.id_usuario
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
    """
    ACTUALIZADO: Obtiene conductores incluyendo el correo del usuario asociado
    """
    from app.models import Conductor as ConductorModel, Usuario as UsuarioModel
    
    query = db.query(ConductorModel).join(UsuarioModel).join(Rol, UsuarioModel.id_rol == Rol.id_rol).filter(Rol.nombre_rol == 'rol-conductor').offset(skip).limit(min(limit, 100))
    conductores = query.all()
    
    # Enriquecer con correo del usuario
    result = []
    for cond in conductores:
        cond_dict = {
            'id_conductor': cond.id_conductor,
            'id_usuario': cond.id_usuario,
            'nombre_conductor': cond.nombre_conductor,
            'apellido_conductor': cond.apellido_conductor,
            'cedula_conductor': cond.cedula_conductor,
            'telefono_conductor': cond.telefono_conductor,
            'correo_conductor': cond.usuario.correo_usuario if cond.usuario else None,
            'licencia': cond.licencia,
            'estado_conductor': cond.estado_conductor,
            'fecha_ingreso': cond.fecha_ingreso,
        }
        result.append(Conductor(**cond_dict))
    
    return result


@drivers_router.post("", response_model=Conductor)
def create_driver(
    driver: ConductorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """
    ACTUALIZADO: Crea un conductor con correo vinculado al usuario
    Si se proporciona correo, crea/vincula usuario automáticamente
    """
    from app.models import Usuario, Conductor as ConductorModel
    from app.core.security import hash_password
    import uuid
    
    driver_data = driver.model_dump()
    correo_conductor = driver_data.pop('correo_conductor', None)
    id_usuario = driver_data.get('id_usuario')

    # Si no se envió id_usuario pero sí correo, buscar/crear usuario
    if not id_usuario and correo_conductor:
        existing_user = db.query(Usuario).filter(Usuario.correo_usuario == correo_conductor).first()
        if existing_user:
            id_usuario = existing_user.id_usuario
        else:
            # Obtener rol Conductor
            rol_conductor = db.query(Rol).filter(Rol.nombre_rol == "rol-conductor").first()
            rol_id = rol_conductor.id_rol if rol_conductor else uuid.UUID("11111111-2222-3333-4444-555555555552")
            
            new_user = Usuario(
                id_usuario=uuid.uuid4(),
                id_rol=rol_id,
                nombres_usuario=driver_data['nombre_conductor'],
                apellidos_usuario=driver_data['apellido_conductor'],
                correo_usuario=correo_conductor,
                contrasenia_usuario=hash_password(driver_data['cedula_conductor']),
                telefono_usuario=driver_data.get('telefono_conductor'),
                estado_usuario="ACTIVO"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            id_usuario = new_user.id_usuario
    
    # Si no hay id_usuario ni correo, generar automáticamente
    elif not id_usuario:
        rol_conductor = db.query(Rol).filter(Rol.nombre_rol == "rol-conductor").first()
        rol_id = rol_conductor.id_rol if rol_conductor else uuid.UUID("11111111-2222-3333-4444-555555555552")
        
        email_derived = f"conductor_{driver_data['cedula_conductor']}@vextor.com"
        new_user = Usuario(
            id_usuario=uuid.uuid4(),
            id_rol=rol_id,
            nombres_usuario=driver_data['nombre_conductor'],
            apellidos_usuario=driver_data['apellido_conductor'],
            correo_usuario=email_derived,
            contrasenia_usuario=hash_password(driver_data['cedula_conductor']),
            telefono_usuario=driver_data.get('telefono_conductor'),
            estado_usuario="ACTIVO"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        id_usuario = new_user.id_usuario

    driver_data['id_usuario'] = id_usuario
    res = DriverService.create(driver_data, db)
    
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "CREACION", "Conductores", f"Conductor creado: {res.nombre_conductor} {res.apellido_conductor}"
    )
    AuditService.create_notification(
        db,
        titulo="Nuevo Conductor",
        descripcion=f"Se registró el conductor {res.nombre_conductor} {res.apellido_conductor}",
        tipo="conductor",
        id_usuario=current_user.id_usuario
    )
    
    # Enriquecer respuesta con correo
    result = {
        'id_conductor': res.id_conductor,
        'id_usuario': res.id_usuario,
        'nombre_conductor': res.nombre_conductor,
        'apellido_conductor': res.apellido_conductor,
        'cedula_conductor': res.cedula_conductor,
        'telefono_conductor': res.telefono_conductor,
        'correo_conductor': correo_conductor or f"conductor_{res.cedula_conductor}@vextor.com",
        'licencia': res.licencia,
        'estado_conductor': res.estado_conductor,
        'fecha_ingreso': res.fecha_ingreso,
    }
    return Conductor(**result)


@drivers_router.put("/{id_conductor}", response_model=Conductor)
def update_driver(
    id_conductor: UUID,
    driver: ConductorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """
    ACTUALIZADO: Actualiza conductor y su correo asociado en Usuario
    """
    from app.models import Conductor as ConductorModel, Usuario as UsuarioModel
    
    driver_data = driver.model_dump(exclude_unset=True)
    correo_conductor = driver_data.pop('correo_conductor', None)
    
    res = DriverService.update(id_conductor, driver_data, db)
    
    # Actualizar correo en el usuario asociado si se proporcionó
    if correo_conductor and res.id_usuario:
        usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == res.id_usuario).first()
        if usuario:
            usuario.correo_usuario = correo_conductor
            db.commit()
    
    AuditService.record_activity(
        db, current_user.id_usuario,
        f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "ACTUALIZACION", "Conductores", f"Conductor actualizado ID: {id_conductor}"
    )
    
    # Enriquecer respuesta
    result = {
        'id_conductor': res.id_conductor,
        'id_usuario': res.id_usuario,
        'nombre_conductor': res.nombre_conductor,
        'apellido_conductor': res.apellido_conductor,
        'cedula_conductor': res.cedula_conductor,
        'telefono_conductor': res.telefono_conductor,
        'correo_conductor': correo_conductor or (res.usuario.correo_usuario if res.usuario else None),
        'licencia': res.licencia,
        'estado_conductor': res.estado_conductor,
        'fecha_ingreso': res.fecha_ingreso,
    }
    return Conductor(**result)


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
    AuditService.create_notification(
        db,
        titulo="Nueva Ruta",
        descripcion=f"Ruta creada: {res.codigo_ruta}",
        tipo="ruta",
        id_usuario=current_user.id_usuario
    )
    return res


@routes_router.put("/{id_ruta}", response_model=Ruta)
def update_route(
    id_ruta: UUID,
    route: RutaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    from app.models import Conductor, AsignacionConductor
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


@routes_router.get("/driver/my-routes", response_model=List[Ruta])
def get_driver_routes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Obtiene las rutas asignadas al conductor logueado
    """
    from app.models import Conductor as ConductorModel, AsignacionConductor
    
    # Buscar el conductor del usuario actual
    driver = db.query(ConductorModel).filter(ConductorModel.id_usuario == current_user.id_usuario).first()
    if not driver:
        return []  # Si no es conductor, retornar lista vacía
    
    # Obtener rutas asignadas a este conductor
    asignaciones = db.query(AsignacionConductor).filter(
        AsignacionConductor.id_conductor == driver.id_conductor
    ).all()
    
    # Retornar las rutas
    rutas = [asig.ruta for asig in asignaciones if asig.ruta]
    return rutas


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
    AuditService.create_notification(
        db,
        titulo="Nuevo Mantenimiento",
        descripcion=f"Mantenimiento registrado",
        tipo="mantenimiento",
        id_usuario=current_user.id_usuario
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
