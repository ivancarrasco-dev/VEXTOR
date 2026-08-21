"""Modelos de Conductor"""
import uuid
from datetime import date
from sqlalchemy import Column, String, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Conductor(Base):
    __tablename__ = "conductor"
    id_conductor = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, unique=True)
    nombre_conductor = Column(String(100), nullable=False)
    apellido_conductor = Column(String(100), nullable=False)
    cedula_conductor = Column(String(20), nullable=False, unique=True)
    telefono_conductor = Column(String(20), nullable=True)
    licencia = Column(String(50), nullable=False)
    estado_conductor = Column(String(20), nullable=False, default="DISPONIBLE")
    fecha_ingreso = Column(Date, nullable=False)

    usuario = relationship("Usuario", back_populates="conductor")
    asignaciones = relationship("AsignacionConductor", back_populates="conductor")
    novedades = relationship("Novedad", back_populates="conductor")

    __table_args__ = (
        CheckConstraint("estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO')", name="chk_estado_conductor"),
    )
