"""
Conexión a la base de datos PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    connect_args["connect_timeout"] = 15
elif settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Crear engine con parámetros robustos para Supabase Pooler
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Valida que la conexión esté viva antes de cada consulta
    pool_recycle=300,        # Recicla las conexiones para evitar bloqueos por inactividad
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