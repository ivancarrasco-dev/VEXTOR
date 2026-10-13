"""
Conexión a la base de datos PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

if "postgresql" in db_url or "psycopg" in db_url:
    connect_args["connect_timeout"] = 10
    # Evitar problemas de conexión o certificados SSL estrictos en redes restringidas si se utiliza sslmode
    if "sslmode" not in db_url:
        connect_args["sslmode"] = "prefer"
elif db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Crear engine
engine = create_engine(
    db_url,
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
