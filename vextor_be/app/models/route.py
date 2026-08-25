"""Modelos de Ruta, Asignaciones y Novedades"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


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
