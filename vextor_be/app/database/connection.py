"""
Conexión a la base de datos PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

def normalize_database_url(url: str) -> str:
    """
    Normaliza el esquema de conexión para garantizar el uso de psycopg 3
    cuando se utilicen URLs postgresql:// o postgres://.
    """
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


database_url = normalize_database_url(settings.DATABASE_URL)

connect_args = {}
if database_url.startswith("postgresql"):
    connect_args["connect_timeout"] = 15
elif database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Crear engine con parámetros robustos para Supabase Pooler
engine = create_engine(
    database_url,
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