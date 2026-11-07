"""Pruebas adicionales para verificar la conexión, configuración y utilidades de backend"""
import pytest
from app.database.connection import normalize_database_url
from app.core.config import Settings
from app.core.security import validate_password_policy


def test_normalize_database_url():
    """Valida la conversión automática a dialecto postgresql+psycopg"""
    assert normalize_database_url("postgres://user:pass@host:5432/db") == "postgresql+psycopg://user:pass@host:5432/db"
    assert normalize_database_url("postgresql://user:pass@host:5432/db") == "postgresql+psycopg://user:pass@host:5432/db"
    assert normalize_database_url("postgresql+psycopg://user:pass@host:5432/db") == "postgresql+psycopg://user:pass@host:5432/db"
    assert normalize_database_url("sqlite:///:memory:") == "sqlite:///:memory:"


def test_password_policy_validation():
    """Verifica que la política de contraseña exija robustez"""
    # Cumple requisitos: min 8, mayúscula, minúscula, dígito
    valid, err = validate_password_policy("SecurePass2025!")
    assert valid is True
    assert err is None

    # Corta
    valid, err = validate_password_policy("Short1!")
    assert valid is False
    assert "al menos 8 caracteres" in err

    # Sin mayúscula
    valid, err = validate_password_policy("lowercase123!")
    assert valid is False
    assert "letra mayúscula" in err

    # Sin minúscula
    valid, err = validate_password_policy("UPPERCASE123!")
    assert valid is False
    assert "letra minúscula" in err

    # Sin número
    valid, err = validate_password_policy("NoNumbersHere!")
    assert valid is False
    assert "número" in err
