"""Modelos de Vehículo"""
import uuid
from sqlalchemy import Column, String, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


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
