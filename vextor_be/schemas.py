from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List

# --- ROL ---
class RolBase(BaseModel):
    nombre_rol: str = Field(..., max_length=50)
    descripcion_rol: Optional[str] = Field(None, max_length=255)

class RolCreate(RolBase):
    pass

class Rol(RolBase):
    id_rol: UUID

    class Config:
        from_attributes = True

# --- EMPRESA ---
class EmpresaBase(BaseModel):
    name: str = Field(..., max_length=100)
    nit: str = Field(..., max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    retention_days: Optional[int] = 30

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    nit: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    retention_days: Optional[int] = None

class Empresa(EmpresaBase):
    id_empresa: UUID

    class Config:
        from_attributes = True

# --- ACTIVIDAD ---
class ActividadBase(BaseModel):
    tipo_accion: str
    modulo: str
    descripcion: str
    id_registro_afectado: Optional[str] = None
    ip_origen: Optional[str] = None
    resultado: str = "EXITOSO"

class ActividadCreate(ActividadBase):
    id_usuario: Optional[UUID] = None
    nombres_usuario: Optional[str] = None

class Actividad(ActividadBase):
    id_actividad: UUID
    id_usuario: Optional[UUID] = None
    nombres_usuario: Optional[str] = None
    fecha_hora: datetime

    class Config:
        from_attributes = True

# --- SESION USUARIO ---
class SesionUsuarioOut(BaseModel):
    id_sesion: UUID
    id_usuario: UUID
    ip_origen: Optional[str] = None
    dispositivo: Optional[str] = None
    user_agent: Optional[str] = None
    fecha_inicio: datetime
    ultima_actividad: datetime
    estado_sesion: str
    is_current: bool = False

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- NOTIFICACION ---
class NotificacionBase(BaseModel):
    titulo: str
    descripcion: str
    tipo: str

class NotificacionCreate(NotificacionBase):
    id_usuario: Optional[UUID] = None

class Notificacion(NotificacionBase):
    id_notificacion: UUID
    id_usuario: Optional[UUID] = None
    fecha_hora: datetime
    leido: bool

    class Config:
        from_attributes = True


# --- USUARIO ---
class UsuarioBase(BaseModel):
    nombres_usuario: str = Field(..., max_length=100)
    apellidos_usuario: str = Field(..., max_length=100)
    correo_usuario: EmailStr
    telefono_usuario: Optional[str] = Field(None, max_length=20)
    estado_usuario: str = Field("ACTIVO", max_length=20)
    foto_perfil: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    id_rol: UUID
    contrasenia_usuario: str = Field(..., max_length=255)

class UsuarioUpdate(BaseModel):
    nombres_usuario: Optional[str] = Field(None, max_length=100)
    apellidos_usuario: Optional[str] = Field(None, max_length=100)
    correo_usuario: Optional[EmailStr] = None
    telefono_usuario: Optional[str] = Field(None, max_length=20)
    estado_usuario: Optional[str] = Field(None, max_length=20)
    foto_perfil: Optional[str] = None

class Usuario(UsuarioBase):
    id_usuario: UUID
    id_rol: UUID
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# --- CONDUCTOR ---
class ConductorBase(BaseModel):
    nombre_conductor: str = Field(..., max_length=100)
    apellido_conductor: str = Field(..., max_length=100)
    cedula_conductor: str = Field(..., max_length=20)
    telefono_conductor: Optional[str] = Field(None, max_length=20)
    licencia: str = Field(..., max_length=50)
    estado_conductor: str = Field("ACTIVO", max_length=20)
    fecha_ingreso: date

class ConductorCreate(ConductorBase):
    pass

class ConductorUpdate(BaseModel):
    nombre_conductor: Optional[str] = Field(None, max_length=100)
    apellido_conductor: Optional[str] = Field(None, max_length=100)
    cedula_conductor: Optional[str] = Field(None, max_length=20)
    telefono_conductor: Optional[str] = Field(None, max_length=20)
    licencia: Optional[str] = Field(None, max_length=50)
    estado_conductor: Optional[str] = Field(None, max_length=20)
    fecha_ingreso: Optional[date] = None

class Conductor(ConductorBase):
    id_conductor: UUID
    id_usuario: UUID

    class Config:
        from_attributes = True


# --- VEHICULO ---
class VehiculoBase(BaseModel):
    placa: str = Field(..., max_length=15)
    marca: str = Field(..., max_length=50)
    modelo: str = Field(..., max_length=50)
    anio: int
    color: Optional[str] = Field(None, max_length=30)
    tipo_vehiculo: str = Field(..., max_length=50)
    capacidad_pasajeros: int
    kilometraje_actual: int = 0
    kilometraje_limite_mantenimiento: int
    estado_vehiculo: str = Field("DISPONIBLE", max_length=20)
    documentacion_vehiculo: Optional[str] = Field(None, max_length=255)

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(BaseModel):
    placa: Optional[str] = Field(None, max_length=15)
    marca: Optional[str] = Field(None, max_length=50)
    modelo: Optional[str] = Field(None, max_length=50)
    anio: Optional[int] = None
    color: Optional[str] = Field(None, max_length=30)
    tipo_vehiculo: Optional[str] = Field(None, max_length=50)
    capacidad_pasajeros: Optional[int] = None
    kilometraje_actual: Optional[int] = None
    kilometraje_limite_mantenimiento: Optional[int] = None
    estado_vehiculo: Optional[str] = Field(None, max_length=20)
    documentacion_vehiculo: Optional[str] = Field(None, max_length=255)

class Vehiculo(VehiculoBase):
    id_vehiculo: UUID

    class Config:
        from_attributes = True


# --- RUTA ---
class RutaBase(BaseModel):
    codigo_ruta: str = Field(..., max_length=50)
    nombre_ruta: str = Field(..., max_length=100)
    origen: str = Field(..., max_length=150)
    destino: str = Field(..., max_length=150)
    fecha_programada: datetime
    hora_inicio_real: Optional[datetime] = None
    hora_fin_real: Optional[datetime] = None
    estado_ruta: str = Field("PROGRAMADA", max_length=30)
    motivo_suspension: Optional[str] = Field(None, max_length=255)

class RutaCreate(RutaBase):
    id_conductor: UUID
    id_vehiculo: UUID

class RutaUpdate(BaseModel):
    codigo_ruta: Optional[str] = Field(None, max_length=50)
    nombre_ruta: Optional[str] = Field(None, max_length=100)
    origen: Optional[str] = Field(None, max_length=150)
    destino: Optional[str] = Field(None, max_length=150)
    fecha_programada: Optional[datetime] = None
    hora_inicio_real: Optional[datetime] = None
    hora_fin_real: Optional[datetime] = None
    estado_ruta: Optional[str] = Field(None, max_length=30)
    motivo_suspension: Optional[str] = Field(None, max_length=255)
    id_conductor: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None

class Ruta(RutaBase):
    id_ruta: UUID
    id_conductor: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None

    class Config:
        from_attributes = True


# --- MANTENIMIENTO ---
class MantenimientoBase(BaseModel):
    id_vehiculo: UUID
    tipo_mantenimiento: str = Field(..., max_length=50)
    descripcion_mantenimiento: str
    fecha_mantenimiento: date
    costo_mantenimiento: float
    kilometraje_mantenimiento: int
    estado_mantenimiento: str = Field("PROGRAMADO", max_length=20)

class MantenimientoCreate(MantenimientoBase):
    pass
class MantenimientoUpdate(BaseModel):
    id_vehiculo: Optional[UUID] = None
    tipo_mantenimiento: Optional[str] = Field(None, max_length=50)
    descripcion_mantenimiento: Optional[str] = None
    fecha_mantenimiento: Optional[date] = None
    costo_mantenimiento: Optional[float] = None
    kilometraje_mantenimiento: Optional[int] = None
    estado_mantenimiento: Optional[str] = Field(None, max_length=20)

class Mantenimiento(MantenimientoBase):
    id_mantenimiento: UUID

    class Config:
        from_attributes = True

