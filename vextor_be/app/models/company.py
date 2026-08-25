"""Modelo de Empresa"""
import uuid
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base


class Empresa(Base):
    __tablename__ = "empresa"
    id_empresa = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    nit = Column(String(50), nullable=False, unique=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    retention_days = Column(Integer, default=30, nullable=True)
