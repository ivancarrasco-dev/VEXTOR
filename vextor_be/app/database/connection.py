"""
Conexión a la base de datos PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Crear engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"connect_timeout": 10}
)

# Crear SessionLocal factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para modelos ORM
Base = declarative_base()

__all__ = ["engine", "SessionLocal", "Base"]
