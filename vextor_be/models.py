import uuid
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text, Numeric, CheckConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Rol(Base):
    __tablename__ = "rol"
    id_rol = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_rol = Column(String(50), nullable=False, unique=True)
    descripcion_rol = Column(String(255), nullable=True)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_rol = Column(UUID(as_uuid=True), ForeignKey("rol.id_rol", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    nombres_usuario = Column(String(100), nullable=False)
    apellidos_usuario = Column(String(100), nullable=False)
    correo_usuario = Column(String(150), nullable=False, unique=True)
    contrasenia_usuario = Column(String(255), nullable=False)
    telefono_usuario = Column(String(20), nullable=True)
    estado_usuario = Column(String(20), nullable=False, default="ACTIVO")
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    token_recuperacion = Column(String(255), nullable=True)
    foto_perfil = Column(Text, nullable=True)

    rol = relationship("Rol", back_populates="usuarios")
    conductor = relationship("Conductor", uselist=False, back_populates="usuario")
    reportes = relationship("Reporte", back_populates="usuario")

    __table_args__ = (
        CheckConstraint("estado_usuario IN ('ACTIVO', 'INACTIVO')", name="chk_estado_usuario"),
    )


class Conductor(Base):
    __tablename__ = "conductor"
    id_conductor = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    nombre_conductor = Column(String(100), nullable=False)
    apellido_conductor = Column(String(100), nullable=False)
    cedula_conductor = Column(String(20), nullable=False, unique=True)
    telefono_conductor = Column(String(20), nullable=True)
    licencia = Column(String(50), nullable=False)
    estado_conductor = Column(String(20), nullable=False, default="ACTIVO")
    fecha_ingreso = Column(Date, nullable=False)

    usuario = relationship("Usuario", back_populates="conductor")
    asignaciones = relationship("AsignacionConductor", back_populates="conductor")
    novedades = relationship("Novedad", back_populates="conductor")

    __table_args__ = (
        CheckConstraint("estado_conductor IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')", name="chk_estado_conductor"),
    )


class Vehiculo(Base):
    __tablename__ = "vehiculo"
    id_vehiculo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    placa = Column(String(15), nullable=False, unique=True)
    marca = Column(String(50), nullable=False)
    modelo = Column(String(50), nullable=False)
    anio = Column(Integer, nullable=False)
    color = Column(String(30), nullable=True)
    tipo_vehiculo = Column(String(50), nullable=False)
    capacidad_pasajeros = Column(Integer, nullable=False)
    kilometraje_actual = Column(Integer, nullable=False, default=0)
    kilometraje_limite_mantenimiento = Column(Integer, nullable=False)
    estado_vehiculo = Column(String(20), nullable=False, default="DISPONIBLE")
    documentacion_vehiculo = Column(String(255), nullable=True)

    asignaciones = relationship("AsignacionVehiculo", back_populates="vehiculo")
    mantenimientos = relationship("Mantenimiento", back_populates="vehiculo")

    __table_args__ = (
        CheckConstraint("estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO')", name="chk_estado_vehiculo"),
    )


class Ruta(Base):
    __tablename__ = "ruta"
    id_ruta = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo_ruta = Column(String(50), nullable=False, unique=True)
    nombre_ruta = Column(String(100), nullable=False)
    origen = Column(String(150), nullable=False)
    destino = Column(String(150), nullable=False)
    fecha_programada = Column(DateTime, nullable=False)
    hora_inicio_real = Column(DateTime, nullable=True)
    hora_fin_real = Column(DateTime, nullable=True)
    estado_ruta = Column(String(30), nullable=False, default="PROGRAMADA")
    motivo_suspension = Column(String(255), nullable=True)

    asignaciones_conductor = relationship("AsignacionConductor", back_populates="ruta")
    asignaciones_vehiculo = relationship("AsignacionVehiculo", back_populates="ruta")
    novedades = relationship("Novedad", back_populates="ruta")

    __table_args__ = (
        CheckConstraint("estado_ruta IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA')", name="chk_estado_ruta"),
    )


class AsignacionConductor(Base):
    __tablename__ = "asignacion_conductor"
    id_asignacion_conductor = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_conductor = Column(UUID(as_uuid=True), ForeignKey("conductor.id_conductor", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    id_ruta = Column(UUID(as_uuid=True), ForeignKey("ruta.id_ruta", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    fecha_asignacion = Column(DateTime, nullable=False, server_default=func.now())
    estado_asignacion = Column(String(20), nullable=False, default="ACTIVA")
    motivo_cambio = Column(String(255), nullable=True)

    conductor = relationship("Conductor", back_populates="asignaciones")
    ruta = relationship("Ruta", back_populates="asignaciones_conductor")

    __table_args__ = (
        CheckConstraint("estado_asignacion IN ('ACTIVA', 'INACTIVA', 'FINALIZADA')", name="chk_estado_asig_cond"),
    )


class AsignacionVehiculo(Base):
    __tablename__ = "asignacion_vehiculo"
    id_asignacion_vehiculo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    id_ruta = Column(UUID(as_uuid=True), ForeignKey("ruta.id_ruta", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    fecha_asignacion = Column(DateTime, nullable=False, server_default=func.now())
    estado_asignacion = Column(String(20), nullable=False, default="ACTIVA")

    vehiculo = relationship("Vehiculo", back_populates="asignaciones")
    ruta = relationship("Ruta", back_populates="asignaciones_vehiculo")

    __table_args__ = (
        CheckConstraint("estado_asignacion IN ('ACTIVA', 'INACTIVA', 'FINALIZADA')", name="chk_estado_asig_veh"),
    )


class Novedad(Base):
    __tablename__ = "novedad"
    id_novedad = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_conductor = Column(UUID(as_uuid=True), ForeignKey("conductor.id_conductor", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    id_ruta = Column(UUID(as_uuid=True), ForeignKey("ruta.id_ruta", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    tipo_novedad = Column(String(50), nullable=False)
    descripcion_novedad = Column(Text, nullable=False)
    fecha_hora_reporte = Column(DateTime, nullable=False, server_default=func.now())
    evidencia_adjunta = Column(String(255), nullable=True)
    estado_novedad = Column(String(20), nullable=False, default="PENDIENTE")

    conductor = relationship("Conductor", back_populates="novedades")
    ruta = relationship("Ruta", back_populates="novedades")

    __table_args__ = (
        CheckConstraint("estado_novedad IN ('PENDIENTE', 'EN_REVISION', 'RESUELTA', 'RECHAZADA')", name="chk_estado_novedad"),
    )


class Reporte(Base):
    __tablename__ = "reporte"
    id_reporte = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    tipo_reporte = Column(String(50), nullable=False)
    fecha_generacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_rango_inicio = Column(Date, nullable=False)
    fecha_rango_fin = Column(Date, nullable=False)
    formato_exportacion = Column(String(10), nullable=False, default="PDF")

    usuario = relationship("Usuario", back_populates="reportes")

    __table_args__ = (
        CheckConstraint("formato_exportacion IN ('PDF', 'EXCEL', 'CSV')", name="chk_formato_exportacion"),
    )


# Additional table for Maintenance to support the frontend functionality
class Mantenimiento(Base):
    __tablename__ = "mantenimiento"
    id_mantenimiento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    tipo_mantenimiento = Column(String(50), nullable=False)
    descripcion_mantenimiento = Column(Text, nullable=False)
    fecha_mantenimiento = Column(Date, nullable=False)
    costo_mantenimiento = Column(Numeric(10, 2), nullable=False)
    kilometraje_mantenimiento = Column(Integer, nullable=False)
    estado_mantenimiento = Column(String(20), nullable=False, default="PROGRAMADO")

    vehiculo = relationship("Vehiculo", back_populates="mantenimientos")

    __table_args__ = (
        CheckConstraint("estado_mantenimiento IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO')", name="chk_estado_mantenimiento"),
    )

class Empresa(Base):
    __tablename__ = "empresa"
    id_empresa = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    nit = Column(String(50), nullable=False, unique=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    retention_days = Column(Integer, default=30, nullable=True)

class Actividad(Base):
    __tablename__ = "actividad"
    id_actividad = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    nombres_usuario = Column(String(150), nullable=True)
    tipo_accion = Column(String(50), nullable=False)
    modulo = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=False)
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())
    id_registro_afectado = Column(String(100), nullable=True)

class Notificacion(Base):
    __tablename__ = "notificacion"
    id_notificacion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())
    leido = Column(Boolean, default=False, nullable=False)
    tipo = Column(String(50), nullable=False)
