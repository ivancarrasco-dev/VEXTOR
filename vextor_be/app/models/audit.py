"""Modelos de Auditoría y Notificaciones"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, CheckConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


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
    ip_origen = Column(String(45), nullable=True)
    resultado = Column(String(20), nullable=False, default="EXITOSO")


class Notificacion(Base):
    __tablename__ = "notificacion"
    id_notificacion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())
    leido = Column(Boolean, default=False, nullable=False)
    tipo = Column(String(50), nullable=False)
