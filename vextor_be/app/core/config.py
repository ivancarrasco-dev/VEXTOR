"""
Configuración centralizada del backend VEXTOR
Lee todas las variables de entorno en un solo lugar
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
env_file = Path(__file__).parent.parent.parent / ".env"
if env_file.exists():
    load_dotenv(env_file)
else:
    # Si no existe .env, cargar desde el entorno (útil en Docker)
    load_dotenv()


class Settings:
    """Configuración de la aplicación"""

    # ========== DATABASE ==========
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL no está configurada. Crea .env en la raíz del proyecto a partir de .env.example."
        )

    # ========== JWT / SECURITY ==========
    SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "your-secret-key-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # ========== EMAIL / SMTP ==========
    MAIL_HOST: str = os.getenv("MAIL_HOST") or os.getenv("SMTP_HOST")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT") or "587")
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME") or os.getenv("SMTP_USER")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM") or os.getenv("SMTP_FROM_EMAIL") or "noreply@vextor.com"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    # ========== OSRM ==========
    OSRM_URL: str = os.getenv("OSRM_URL", "http://localhost:5000").rstrip("/")
    OSRM_TIMEOUT_SECONDS: float = float(os.getenv("OSRM_TIMEOUT_SECONDS", "10"))
    OSRM_HEALTHCHECK_COORDINATES: str = os.getenv(
        "OSRM_HEALTHCHECK_COORDINATES",
        "-74.0721,4.7110"  # Bogotá por defecto
    )

    # ========== CORS ==========
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://localhost:80",
    ]

    # ========== APP ==========
    APP_NAME: str = "Vextor API"
    APP_DESCRIPTION: str = "Backend para la gestión de flota y transporte de Vextor"

    @classmethod
    def validate(cls):
        """Valida que la configuración crítica esté presente"""
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL es requerido")
        if not cls.SECRET_KEY or cls.SECRET_KEY == "your-secret-key-change-in-production":
            raise ValueError("JWT_SECRET_KEY debe ser configurado en .env")
        return True


# Instancia global de configuración
settings = Settings()
settings.validate()
