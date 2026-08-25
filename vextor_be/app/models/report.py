"""Modelos de Reporte"""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


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
