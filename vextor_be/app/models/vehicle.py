"""Modelos de Marca, Modelo, Vehículo, DocumentoVehiculo e InspeccionUnidad"""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Marca(Base):
    __tablename__ = "marca"
    id_marca = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_marca = Column(String(100), nullable=False, unique=True)

    modelos = relationship("Modelo", back_populates="marca")


class Modelo(Base):
    __tablename__ = "modelo"
    id_modelo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_marca = Column(UUID(as_uuid=True), ForeignKey("marca.id_marca", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    nombre_modelo = Column(String(100), nullable=False)
    capacidad_pasajeros = Column(Integer, nullable=False, default=4)
    anio = Column(Integer, nullable=False)

    marca = relationship("Marca", back_populates="modelos")
    vehiculos = relationship("Vehiculo", back_populates="modelo_rel")


class Vehiculo(Base):
    __tablename__ = "vehiculo"
    id_vehiculo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_modelo = Column(UUID(as_uuid=True), ForeignKey("modelo.id_modelo", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
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

    modelo_rel = relationship("Modelo", back_populates="vehiculos")
    documentos = relationship("DocumentoVehiculo", back_populates="vehiculo", cascade="all, delete-orphan")
    inspecciones = relationship("InspeccionUnidad", back_populates="vehiculo", cascade="all, delete-orphan")
    asignaciones = relationship("AsignacionVehiculo", back_populates="vehiculo")
    mantenimientos = relationship("Mantenimiento", back_populates="vehiculo")

    __table_args__ = (
        CheckConstraint("estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO')", name="chk_estado_vehiculo"),
    )


class DocumentoVehiculo(Base):
    __tablename__ = "documento_vehiculo"
    id_documento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    tipo_documento = Column(String(50), nullable=False)
    numero_documento = Column(String(50), nullable=True)
    fecha_vencimiento = Column(Date, nullable=False)

    vehiculo = relationship("Vehiculo", back_populates="documentos")


class InspeccionUnidad(Base):
    __tablename__ = "inspeccion_unidad"
    id_inspeccion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    resultado = Column(String(30), nullable=False)
    observaciones = Column(Text, nullable=True)
    fecha_inspeccion = Column(DateTime, nullable=False, server_default=func.now())

    vehiculo = relationship("Vehiculo", back_populates="inspecciones")

    __table_args__ = (
        CheckConstraint("resultado IN ('APROBADO', 'RECHAZADO', 'CON_OBSERVACIONES')", name="chk_resultado_inspeccion"),
    )
