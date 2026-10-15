"""Modelos de Vehículo, Marca, Modelo y DocumentoVehiculo"""
import uuid
from sqlalchemy import Column, String, Integer, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Marca(Base):
    __tablename__ = "marca"
    id_marca = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_marca = Column(String(100), nullable=False, unique=True)

    modelos = relationship("Modelo", back_populates="marca_rel")


class Modelo(Base):
    __tablename__ = "modelo"
    id_modelo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_marca = Column(UUID(as_uuid=True), ForeignKey("marca.id_marca"), nullable=False)
    nombre_modelo = Column(String(100), nullable=False)
    capacidad_pasajeros = Column(Integer, nullable=True)
    anio = Column(Integer, nullable=True)

    marca_rel = relationship("Marca", back_populates="modelos")
    vehiculos = relationship("Vehiculo", back_populates="modelo_rel")


class Vehiculo(Base):
    __tablename__ = "vehiculo"
    id_vehiculo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_modelo = Column(UUID(as_uuid=True), ForeignKey("modelo.id_modelo"), nullable=True)
    placa = Column(String(15), nullable=False, unique=True)
    color = Column(String(30), nullable=True)
    tipo_vehiculo = Column(String(50), nullable=False)
    capacidad_pasajeros = Column(Integer, nullable=False)
    kilometraje_actual = Column(Integer, nullable=False, default=0)
    kilometraje_limite_mantenimiento = Column(Integer, nullable=False)
    estado_vehiculo = Column(String(20), nullable=False, default="DISPONIBLE")
    documentacion_vehiculo = Column(String(255), nullable=True)

    modelo_rel = relationship("Modelo", back_populates="vehiculos")
    asignaciones = relationship("AsignacionVehiculo", back_populates="vehiculo")
    mantenimientos = relationship("Mantenimiento", back_populates="vehiculo")
    documentos = relationship("DocumentoVehiculo", back_populates="vehiculo")

    __table_args__ = (
        CheckConstraint("estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO')", name="chk_estado_vehiculo"),
    )

    @property
    def marca(self) -> str:
        if self.modelo_rel and self.modelo_rel.marca_rel:
            return self.modelo_rel.marca_rel.nombre_marca
        return getattr(self, "_marca_fallback", "Generico")

    @marca.setter
    def marca(self, value: str):
        self._marca_fallback = value

    @property
    def modelo(self) -> str:
        if self.modelo_rel:
            return self.modelo_rel.nombre_modelo
        return getattr(self, "_modelo_fallback", "Generico")

    @modelo.setter
    def modelo(self, value: str):
        self._modelo_fallback = value

    @property
    def anio(self) -> int:
        if self.modelo_rel and self.modelo_rel.anio:
            return self.modelo_rel.anio
        return getattr(self, "_anio_fallback", 2024)

    @anio.setter
    def anio(self, value: int):
        self._anio_fallback = value


class DocumentoVehiculo(Base):
    __tablename__ = "documento_vehiculo"
    id_documento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo"), nullable=False)
    tipo_documento = Column(String(50), nullable=False)
    numero_documento = Column(String(50), nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)

    vehiculo = relationship("Vehiculo", back_populates="documentos")
