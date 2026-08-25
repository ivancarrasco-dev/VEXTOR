"""
Conexión a la base de datos PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    connect_args["connect_timeout"] = 10
elif settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Crear engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
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
