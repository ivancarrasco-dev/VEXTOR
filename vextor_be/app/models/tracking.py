"""Modelos de Tracking en Tiempo Real"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class SeguimientoRuta(Base):
    __tablename__ = "seguimiento_ruta"
    id_seguimiento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_ruta = Column(UUID(as_uuid=True), ForeignKey("ruta.id_ruta", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, unique=True)
    id_conductor = Column(UUID(as_uuid=True), ForeignKey("conductor.id_conductor", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    latitud = Column(Numeric(10, 6), nullable=False)
    longitud = Column(Numeric(10, 6), nullable=False)
    velocidad = Column(Numeric(5, 2), nullable=True, default=0.0)
    heading = Column(Numeric(5, 2), nullable=True, default=0.0)
    ultima_actualizacion = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    estado_seguimiento = Column(String(20), nullable=False, default="ACTIVO")

    ruta = relationship("Ruta")
    conductor = relationship("Conductor")
    vehiculo = relationship("Vehiculo")

    __table_args__ = (
        CheckConstraint("estado_seguimiento IN ('ACTIVO', 'FINALIZADO')", name="chk_estado_seguimiento"),
    )


class HistorialUbicacion(Base):
    __tablename__ = "historial_ubicacion"
    id_historial = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_seguimiento = Column(UUID(as_uuid=True), ForeignKey("seguimiento_ruta.id_seguimiento", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_ruta = Column(UUID(as_uuid=True), ForeignKey("ruta.id_ruta", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    latitud = Column(Numeric(10, 6), nullable=False)
    longitud = Column(Numeric(10, 6), nullable=False)
    velocidad = Column(Numeric(5, 2), nullable=True)
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())

    seguimiento = relationship("SeguimientoRuta")
    ruta = relationship("Ruta")
