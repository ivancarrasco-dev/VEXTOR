"""Modelos de Mantenimiento"""
import uuid
from datetime import date
from sqlalchemy import Column, String, Text, Date, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Mantenimiento(Base):
    __tablename__ = "mantenimiento"
    id_mantenimiento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vehiculo = Column(UUID(as_uuid=True), ForeignKey("vehiculo.id_vehiculo", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    tipo_mantenimiento = Column(String(50), nullable=False)
    descripcion_mantenimiento = Column(Text, nullable=False)
    fecha_mantenimiento = Column(Date, nullable=False)
    costo_mantenimiento = Column(Numeric(10, 2), nullable=False)
    kilometraje_mantenimiento = Column(String(20), nullable=False)
    estado_mantenimiento = Column(String(20), nullable=False, default="PROGRAMADO")

    vehiculo = relationship("Vehiculo", back_populates="mantenimientos")

    __table_args__ = (
        CheckConstraint("estado_mantenimiento IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO')", name="chk_estado_mantenimiento"),
    )
