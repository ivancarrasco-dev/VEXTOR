"""Modelos de Usuario, Rol y Sesiones"""
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


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
    requiere_cambio_clave = Column(Boolean, nullable=False, default=False)

    rol = relationship("Rol", back_populates="usuarios")
    conductor = relationship("Conductor", uselist=False, back_populates="usuario")
    reportes = relationship("Reporte", back_populates="usuario")
    sesiones = relationship("SesionUsuario", back_populates="usuario", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("estado_usuario IN ('ACTIVO', 'INACTIVO')", name="chk_estado_usuario"),
    )


class SesionUsuario(Base):
    __tablename__ = "sesion_usuario"
    id_sesion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    ip_origen = Column(String(45), nullable=True)
    dispositivo = Column(String(255), nullable=True)
    user_agent = Column(Text, nullable=True)
    fecha_inicio = Column(DateTime, nullable=False, server_default=func.now())
    ultima_actividad = Column(DateTime, nullable=False, server_default=func.now())
    estado_sesion = Column(String(20), nullable=False, default="ACTIVA")

    usuario = relationship("Usuario", back_populates="sesiones")

    __table_args__ = (
        CheckConstraint("estado_sesion IN ('ACTIVA', 'CERRADA', 'REVOCADA', 'EXPIRADA')", name="chk_estado_sesion"),
    )
