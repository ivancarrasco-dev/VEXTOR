"""
Todos los schemas Pydantic para validación de requests/responses
Consolidado en un único archivo para facilitar importación
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from uuid import UUID
from datetime import date, datetime
from typing import Literal, Optional, List


# ========== AUTH SCHEMAS ==========

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetTokenRequest(BaseModel):
    token: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str


# ========== ROL SCHEMAS ==========

ALLOWED_SYSTEM_ROLES = ["conductor", "administrador", "usuario", "Conductor", "Administrador", "Usuario"]

class RolBase(BaseModel):
    nombre_rol: str = Field(..., max_length=50)
    descripcion_rol: Optional[str] = Field(None, max_length=255)

    @field_validator("nombre_rol")
    @classmethod
    def validate_nombre_rol(cls, v: str) -> str:
        if v.lower() not in ["conductor", "administrador", "usuario"]:
            raise ValueError("Rol no permitido. Los roles válidos son: 'conductor', 'administrador', 'usuario'")
        return v


class RolCreate(RolBase):
    pass


class Rol(RolBase):
    model_config = ConfigDict(from_attributes=True)
    id_rol: UUID


# ========== USUARIO SCHEMAS ==========

class UsuarioBase(BaseModel):
    nombres_usuario: str = Field(..., max_length=100)
    apellidos_usuario: str = Field(..., max_length=100)
    correo_usuario: EmailStr
    telefono_usuario: Optional[str] = Field(None, max_length=20)
    estado_usuario: str = Field("ACTIVO", max_length=20)
    foto_perfil: Optional[str] = None
    requiere_cambio_clave: Optional[bool] = False


class UsuarioCreate(UsuarioBase):
    id_rol: UUID
    contrasenia_usuario: str = Field(..., max_length=255)


class UsuarioUpdate(BaseModel):
    id_rol: Optional[UUID] = None
    nombres_usuario: Optional[str] = Field(None, max_length=100)
    apellidos_usuario: Optional[str] = Field(None, max_length=100)
    correo_usuario: Optional[EmailStr] = None
    telefono_usuario: Optional[str] = Field(None, max_length=20)
    estado_usuario: Optional[str] = Field(None, max_length=20)
    foto_perfil: Optional[str] = None
    requiere_cambio_clave: Optional[bool] = None


class Usuario(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)
    id_usuario: UUID
    id_rol: UUID
    fecha_creacion: datetime


# ========== SESION USUARIO SCHEMAS ==========

class SesionUsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_sesion: UUID
    id_usuario: UUID
    token: Optional[str] = None
    ip_origen: Optional[str] = None
    dispositivo: Optional[str] = None
    user_agent: Optional[str] = None
    fecha_inicio: datetime
    ultima_actividad: datetime
    estado_sesion: str
    is_current: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ========== CONDUCTOR SCHEMAS ==========

class ConductorBase(BaseModel):
    nombre_conductor: str = Field(..., max_length=100)
    apellido_conductor: str = Field(..., max_length=100)
    cedula_conductor: str = Field(..., max_length=20)
    telefono_conductor: Optional[str] = Field(None, max_length=20)
    correo_conductor: Optional[EmailStr] = None
    licencia: str = Field(..., max_length=50)
    estado_conductor: str = Field("DISPONIBLE", max_length=20)
    fecha_ingreso: date


class ConductorCreate(ConductorBase):
    id_usuario: Optional[UUID] = None


class ConductorUpdate(BaseModel):
    nombre_conductor: Optional[str] = Field(None, max_length=100)
    apellido_conductor: Optional[str] = Field(None, max_length=100)
    cedula_conductor: Optional[str] = Field(None, max_length=20)
    telefono_conductor: Optional[str] = Field(None, max_length=20)
    correo_conductor: Optional[EmailStr] = None
    licencia: Optional[str] = Field(None, max_length=50)
    estado_conductor: Optional[str] = Field(None, max_length=20)
    fecha_ingreso: Optional[date] = None


class Conductor(ConductorBase):
    model_config = ConfigDict(from_attributes=True)
    id_conductor: UUID
    id_usuario: UUID


# ========== MARCA & MODELO SCHEMAS ==========

class MarcaBase(BaseModel):
    nombre_marca: str = Field(..., max_length=100)


class Marca(MarcaBase):
    model_config = ConfigDict(from_attributes=True)
    id_marca: UUID


class ModeloBase(BaseModel):
    id_marca: UUID
    nombre_modelo: str = Field(..., max_length=100)
    capacidad_pasajeros: int = 4
    anio: int


class Modelo(ModeloBase):
    model_config = ConfigDict(from_attributes=True)
    id_modelo: UUID


# ========== VEHICULO & DOCUMENTOS & INSPECCION SCHEMAS ==========

class VehiculoBase(BaseModel):
    id_modelo: Optional[UUID] = None
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
    id_modelo: Optional[UUID] = None
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
    model_config = ConfigDict(from_attributes=True)
    id_vehiculo: UUID


class DocumentoVehiculoBase(BaseModel):
    id_vehiculo: UUID
    tipo_documento: str = Field(..., max_length=50)
    numero_documento: Optional[str] = Field(None, max_length=50)
    fecha_vencimiento: date


class DocumentoVehiculo(DocumentoVehiculoBase):
    model_config = ConfigDict(from_attributes=True)
    id_documento: UUID


class InspeccionUnidadBase(BaseModel):
    id_vehiculo: UUID
    id_usuario: UUID
    resultado: Literal["APROBADO", "RECHAZADO", "CON_OBSERVACIONES"]
    observaciones: Optional[str] = None


class InspeccionUnidad(InspeccionUnidadBase):
    model_config = ConfigDict(from_attributes=True)
    id_inspeccion: UUID
    fecha_inspeccion: datetime


# ========== RUTA & VIAJE SCHEMAS ==========

class RutaBase(BaseModel):
    codigo_ruta: str = Field(..., max_length=50)
    nombre_ruta: str = Field(..., max_length=100)
    origen: str = Field(..., max_length=150)
    destino: str = Field(..., max_length=150)
    paradas: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    hora_inicio_real: Optional[datetime] = None
    hora_fin_real: Optional[datetime] = None
    estado_ruta: str = Field("PROGRAMADA", max_length=30)
    motivo_suspension: Optional[str] = Field(None, max_length=255)


class RutaCreate(RutaBase):
    id_conductor: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None


class RutaUpdate(BaseModel):
    codigo_ruta: Optional[str] = Field(None, max_length=50)
    nombre_ruta: Optional[str] = Field(None, max_length=100)
    origen: Optional[str] = Field(None, max_length=150)
    destino: Optional[str] = Field(None, max_length=150)
    paradas: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    hora_inicio_real: Optional[datetime] = None
    hora_fin_real: Optional[datetime] = None
    estado_ruta: Optional[str] = Field(None, max_length=30)
    motivo_suspension: Optional[str] = Field(None, max_length=255)
    id_conductor: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None


class Ruta(RutaBase):
    model_config = ConfigDict(from_attributes=True)
    id_ruta: UUID
    id_conductor: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None


class ViajeBase(BaseModel):
    id_conductor: UUID
    id_vehiculo: UUID
    id_ruta: UUID
    estado_viaje: Literal["PROGRAMADO", "EN_PROCESO", "FINALIZADO", "CANCELADO"] = "PROGRAMADO"
    fecha_hora_salida_programada: datetime
    fecha_hora_llegada_programada: datetime


class Viaje(ViajeBase):
    model_config = ConfigDict(from_attributes=True)
    id_viaje: UUID


# ========== NOVEDAD SCHEMAS ==========

class NovedadBase(BaseModel):
    id_conductor: UUID
    id_viaje: Optional[UUID] = None
    id_vehiculo: Optional[UUID] = None
    id_usuario: Optional[UUID] = None
    id_ruta: Optional[UUID] = None
    tipo_novedad: str = Field(..., max_length=50)
    descripcion_novedad: str
    evidencia_adjunta: Optional[str] = Field(None, max_length=255)
    estado_novedad: Literal["PENDIENTE", "EN_REVISION", "RESUELTA", "RECHAZADA"] = "PENDIENTE"


class Novedad(NovedadBase):
    model_config = ConfigDict(from_attributes=True)
    id_novedad: UUID
    fecha_hora_reporte: datetime


# ========== MANTENIMIENTO SCHEMAS ==========

class MantenimientoBase(BaseModel):
    id_vehiculo: UUID
    id_conductor: Optional[UUID] = None
    id_novedad: Optional[UUID] = None
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
    id_conductor: Optional[UUID] = None
    id_novedad: Optional[UUID] = None
    tipo_mantenimiento: Optional[str] = Field(None, max_length=50)
    descripcion_mantenimiento: Optional[str] = None
    fecha_mantenimiento: Optional[date] = None
    costo_mantenimiento: Optional[float] = None
    kilometraje_mantenimiento: Optional[int] = None
    estado_mantenimiento: Optional[str] = Field(None, max_length=20)


class Mantenimiento(MantenimientoBase):
    model_config = ConfigDict(from_attributes=True)
    id_mantenimiento: UUID


# ========== EMPRESA SCHEMAS ==========

class EmpresaBase(BaseModel):
    name: str = Field(..., max_length=100)
    nit: str = Field(..., max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    retention_days: Optional[int] = 30
    estado: str = Field("ACTIVO", max_length=20)


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
    estado: Optional[str] = Field(None, max_length=20)


class Empresa(EmpresaBase):
    model_config = ConfigDict(from_attributes=True)
    id_empresa: UUID
    fecha_creacion: datetime


# ========== ACTIVIDAD SCHEMAS ==========

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
    model_config = ConfigDict(from_attributes=True)
    id_actividad: UUID
    id_usuario: Optional[UUID] = None
    nombres_usuario: Optional[str] = None
    fecha_hora: datetime


# ========== NOTIFICACION SCHEMAS ==========

class NotificacionBase(BaseModel):
    titulo: str
    descripcion: str
    tipo: str = "general"
    id_viaje: Optional[UUID] = None


class NotificacionCreate(NotificacionBase):
    id_usuario: Optional[UUID] = None


class Notificacion(NotificacionBase):
    model_config = ConfigDict(from_attributes=True)
    id_notificacion: UUID
    id_usuario: Optional[UUID] = None
    estado_envio: str = "PENDIENTE"
    fecha_hora: datetime
    leido: bool


# ========== UBICACION / TRACKING SCHEMAS ==========

class UbicacionUpdate(BaseModel):
    id_ruta: UUID
    latitud: float
    longitud: float
    velocidad: Optional[float] = 0.0
    heading: Optional[float] = 0.0


class HistorialUbicacionViajeBase(BaseModel):
    id_viaje: Optional[UUID] = None
    latitud: float
    longitud: float
    velocidad: Optional[float] = 0.0


class HistorialUbicacionViaje(HistorialUbicacionViajeBase):
    model_config = ConfigDict(from_attributes=True)
    id_historial: UUID
    fecha_hora: datetime


class SeguimientoRutaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_seguimiento: UUID
    id_ruta: UUID
    id_conductor: UUID
    id_vehiculo: UUID
    latitud: float
    longitud: float
    velocidad: Optional[float] = 0.0
    heading: Optional[float] = 0.0
    ultima_actualizacion: datetime
    estado_seguimiento: str
    nombre_conductor: Optional[str] = None
    placa_vehiculo: Optional[str] = None
    nombre_ruta: Optional[str] = None
    codigo_ruta: Optional[str] = None
    origen: Optional[str] = None
    destino: Optional[str] = None


# ========== ROUTING / OSRM SCHEMAS ==========

class RoutingPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class RoutingRouteRequest(BaseModel):
    origin: Optional[RoutingPoint] = None
    destination: Optional[RoutingPoint] = None
    waypoints: Optional[List[RoutingPoint]] = None
    profile: Literal["driving", "cycling", "walking"] = "driving"


class RoutingInstruction(BaseModel):
    text: str
    distance: float
    duration: float
    type: str


class RoutingGeometry(BaseModel):
    type: Literal["LineString"]
    coordinates: List[List[float]]


class RoutingRouteResponse(BaseModel):
    distance: float
    duration: float
    geometry: RoutingGeometry
    instructions: List[RoutingInstruction]


class RoutingHealth(BaseModel):
    status: Literal["available"]
