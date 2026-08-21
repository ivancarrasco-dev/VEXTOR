"""Utilidades y helpers reutilizables"""
from typing import Optional
from fastapi import Request
import unicodedata
import re


def get_client_ip(request: Request) -> str:
    """Obtiene la IP del cliente desde el request, considerando proxies"""
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    if "x-real-ip" in request.headers:
        return request.headers["x-real-ip"]
    return request.client.host if request.client else "0.0.0.0"


def parse_user_agent(ua_string: str) -> str:
    """
    Parsea el User-Agent y retorna un string legible del dispositivo y SO.
    
    Ejemplo: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." → "Chrome — Windows"
    """
    ua = ua_string.lower()
    
    # Detectar navegador
    browser = "Navegador desconocido"
    if "firefox" in ua:
        browser = "Firefox"
    elif "edge" in ua or "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua:
        browser = "Chrome"
    elif "safari" in ua:
        browser = "Safari"
    elif "opera" in ua:
        browser = "Opera"
    
    # Detectar SO
    os_name = "Windows"
    if "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "android" in ua:
        os_name = "Android"
    elif "linux" in ua:
        os_name = "Linux"
    
    return f"{browser} — {os_name}"


def normalize_text(text: str) -> str:
    """Normaliza texto removiendo acentos y espacios extras"""
    if not text:
        return ""
    # Normalizar Unicode (remover acentos)
    text = "".join(c for c in unicodedata.normalize("NFD", text) 
                   if unicodedata.category(c) != "Mn")
    return text.strip()


def validate_colombian_plate(plate: str) -> bool:
    """Valida formato de placa colombiana"""
    pattern = r"^[A-Za-z]{3}-?([0-9]{3}|[0-9]{2}[A-Za-z])$"
    return bool(re.match(pattern, plate.strip()))


def validate_email(email: str) -> bool:
    """Valida formato de email básico"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email.strip()))


def split_full_name(full_name: str) -> tuple[str, str]:
    """Divide nombre completo en nombre y apellido"""
    full_name = full_name.strip()
    parts = full_name.split(" ", 1)
    nombres = parts[0] if parts else ""
    apellidos = parts[1] if len(parts) > 1 else ""
    return nombres, apellidos


def generate_avatar_initials(first_name: str, last_name: str) -> str:
    """Genera iniciales para avatar"""
    initials = first_name[0] if first_name else ""
    if last_name:
        initials += last_name[0]
    return initials.upper()
