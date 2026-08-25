"""
Funciones de seguridad: JWT, hashing de contraseñas, validaciones
Centraliza toda la lógica criptográfica del sistema
"""
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from uuid import UUID

from app.core.config import settings


# ========== PASSWORD HASHING ==========

def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


# ========== JWT ==========

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token.
    
    Args:
        data: payload a incluir en el token (debe incluir 'sub' para email y 'sid' para session id)
        expires_delta: tiempo de expiración personalizado
    
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodifica y valida un JWT token.
    
    Args:
        token: Token JWT
    
    Returns:
        Payload del token
    
    Raises:
        HTTPException si el token es inválido o expiró
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )


# ========== PASSWORD VALIDATION ==========

def validate_password_policy(password: str) -> tuple[bool, Optional[str]]:
    """
    Valida que una contraseña cumpla con la política de seguridad.
    
    Requisitos:
    - Mínimo 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número
    
    Returns:
        (válido: bool, mensaje_error: str or None)
    """
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not any(c.isupper() for c in password):
        return False, "La contraseña debe incluir al menos una letra mayúscula."
    if not any(c.islower() for c in password):
        return False, "La contraseña debe incluir al menos una letra minúscula."
    if not any(c.isdigit() for c in password):
        return False, "La contraseña debe incluir al menos un número."
    return True, None
