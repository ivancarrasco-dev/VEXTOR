import jwt
import bcrypt
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from database import get_db
import models
import schemas
from email_utils import send_recovery_email

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY no está configurada. Crea .env en la raíz del proyecto a partir de .env.example."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 hours
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetTokenRequest(BaseModel):
    token: str

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Check if we are dealing with our seed or dummy passwords
    if hashed_password.startswith("pbkdf2:sha256:"):
        dummy = hashed_password.split("pbkdf2:sha256:")[1]
        return plain_password == dummy
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if (request and request.client) else "127.0.0.1"
    if ip == "testclient" or not ip:
        ip = "127.0.0.1"
    return ip

def parse_user_agent(user_agent: str) -> str:
    if not user_agent:
        return "Navegador web"
    ua = user_agent.lower()

    browser = "Navegador"
    if "edg" in ua:
        browser = "Microsoft Edge"
    elif "chrome" in ua and "chromium" not in ua and "edg" not in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "opr" in ua or "opera" in ua:
        browser = "Opera"

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

def get_current_user_from_token(token: str, db: Session, request: Optional[Request] = None) -> models.Usuario:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        sid: str = payload.get("sid")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudieron validar las credenciales")

    user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email).first()
    if user is None or user.estado_usuario != "ACTIVO":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")

    if sid:
        try:
            session_id_uuid = UUID(sid)
            session = db.query(models.SesionUsuario).filter(
                models.SesionUsuario.id_sesion == session_id_uuid,
                models.SesionUsuario.id_usuario == user.id_usuario
            ).first()
            if not session or session.estado_sesion != "ACTIVA":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="La sesión ha sido revocada o cerró sesión.")

            # Update last activity
            session.ultima_actividad = datetime.now()
            db.commit()
            if request:
                request.state.current_session_id = str(session.id_sesion)
        except ValueError:
            pass

    return user

def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.Usuario:
    # Check cookie first, fallback to header
    token = request.cookies.get("vextor_auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return get_current_user_from_token(token, db, request=request)

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    # Clean inputs
    email_clean = req.email.strip().lower()
    name_clean = req.fullName.strip()

    if not name_clean or len(name_clean) < 2:
        raise HTTPException(status_code=400, detail="El nombre completo es obligatorio y debe tener al menos 2 caracteres.")

    # Password policy validation: min 8 chars, uppercase, lowercase, number
    if (
        len(req.password) < 8
        or not any(c.isupper() for c in req.password)
        or not any(c.islower() for c in req.password)
        or not any(c.isdigit() for c in req.password)
    ):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 8 caracteres, e incluir letras mayúsculas, minúsculas y un número."
        )

    # Check if exists
    existing = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")

    # Resolve role (Default to Administrador)
    rol = db.query(models.Rol).filter(models.Rol.nombre_rol == "Administrador").first()
    if not rol:
        rol = models.Rol(id_rol=uuid4(), nombre_rol="Administrador", descripcion_rol="Administrador de la flota")
        db.add(rol)
        db.commit()
        db.refresh(rol)

    # Name split
    parts = name_clean.split(" ", 1)
    nombres = parts[0]
    apellidos = parts[1] if len(parts) > 1 else ""

    hashed = hash_password(req.password)
    new_user = models.Usuario(
        id_usuario=uuid4(),
        id_rol=rol.id_rol,
        nombres_usuario=nombres,
        apellidos_usuario=apellidos,
        correo_usuario=email_clean,
        contrasenia_usuario=hashed,
        telefono_usuario="",
        estado_usuario="ACTIVO"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Usuario creado correctamente"}

@router.post("/login")
def login_user(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    from router_activities import record_activity
    email_clean = req.email.strip().lower()
    client_ip = get_client_ip(request)

    user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email_clean).first()
    if not user or not verify_password(req.password, user.contrasenia_usuario):
        user_name_fail = f"{user.nombres_usuario} {user.apellidos_usuario}".strip() if user else email_clean
        record_activity(
            db,
            user.id_usuario if user else None,
            user_name_fail,
            "LOGIN_FAILED",
            "Seguridad",
            f"Intento fallido de inicio de sesión para el usuario '{email_clean}'.",
            None,
            ip_origen=client_ip,
            resultado="FALLIDO"
        )
        raise HTTPException(status_code=400, detail="Credenciales incorrectas o el usuario no existe.")

    if user.estado_usuario != "ACTIVO":
        user_name_fail = f"{user.nombres_usuario} {user.apellidos_usuario}".strip()
        record_activity(
            db,
            user.id_usuario,
            user_name_fail,
            "LOGIN_FAILED",
            "Seguridad",
            f"Intento de inicio de sesión en cuenta inactiva '{email_clean}'.",
            str(user.id_usuario),
            ip_origen=client_ip,
            resultado="FALLIDO"
        )
        raise HTTPException(status_code=403, detail="Su cuenta de usuario se encuentra inactiva.")

    # Resolve Rol Name
    rol = db.query(models.Rol).filter(models.Rol.id_rol == user.id_rol).first()
    role_name = rol.nombre_rol if rol else "Usuario"

    # Create Real Active Session in DB
    ua_str = request.headers.get("user-agent", "")
    device_info = parse_user_agent(ua_str)

    new_session = models.SesionUsuario(
        id_sesion=uuid4(),
        id_usuario=user.id_usuario,
        ip_origen=client_ip,
        dispositivo=device_info,
        user_agent=ua_str,
        fecha_inicio=datetime.now(),
        ultima_actividad=datetime.now(),
        estado_sesion="ACTIVA"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Create JWT Token with Session ID (sid)
    token = create_access_token(data={
        "sub": user.correo_usuario,
        "role": role_name,
        "sid": str(new_session.id_sesion)
    })

    # Set Cookie HttpOnly
    response.set_cookie(
        key="vextor_auth_token",
        value=token,
        httponly=True,
        secure=False, # Set to True in production with SSL
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    user_name = f"{user.nombres_usuario} {user.apellidos_usuario}".strip()
    record_activity(
        db,
        user.id_usuario,
        user_name,
        "LOGIN",
        "Seguridad",
        f"Inicio de sesión exitoso desde {device_info}.",
        str(new_session.id_sesion),
        ip_origen=client_ip,
        resultado="EXITOSO"
    )

    avatar = f"{user.nombres_usuario[0]}{user.apellidos_usuario[0]}" if user.apellidos_usuario else user.nombres_usuario[0]
    avatar = avatar.upper()

    return {
        "token": token,
        "user": {
            "id": str(user.id_usuario),
            "name": user_name,
            "email": user.correo_usuario,
            "role": role_name,
            "avatar": avatar,
            "phone": user.telefono_usuario or "",
            "photo": user.foto_perfil
        }
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from router_activities import record_activity
    email_clean = req.email.strip().lower()

    # Find user
    user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email_clean).first()
    if user and user.estado_usuario == "ACTIVO":
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        exp_time = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

        # Store token hash and expiration ISO string in token_recuperacion
        user.token_recuperacion = f"{token_hash}|{exp_time}"
        db.commit()

        reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"
        send_recovery_email(user.correo_usuario, reset_link)

        user_name = f"{user.nombres_usuario} {user.apellidos_usuario}".strip()
        record_activity(
            db,
            user.id_usuario,
            user_name,
            "RECUPERACION_SOLICITADA",
            "Seguridad",
            f"Solicitud de restablecimiento de contraseña enviada para '{email_clean}'.",
            str(user.id_usuario)
        )

    # Always return a generic response to prevent account enumeration
    return {
        "message": "Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña."
    }

@router.post("/verify-reset-token")
def verify_reset_token(req: VerifyResetTokenRequest, db: Session = Depends(get_db)):
    if not req.token or not req.token.strip():
        raise HTTPException(status_code=400, detail="El token de recuperación es requerido.")

    token_hash = hashlib.sha256(req.token.strip().encode('utf-8')).hexdigest()

    # Find user whose token_recuperacion starts with token_hash + "|"
    users = db.query(models.Usuario).filter(models.Usuario.token_recuperacion.isnot(None)).all()
    user = None
    exp_iso = None
    for u in users:
        if u.token_recuperacion and u.token_recuperacion.startswith(f"{token_hash}|"):
            user = u
            parts = u.token_recuperacion.split("|", 1)
            if len(parts) == 2:
                exp_iso = parts[1]
            break

    if not user or not exp_iso:
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperación es inválido o ya ha sido utilizado."
        )

    try:
        exp_dt = datetime.fromisoformat(exp_iso)
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if exp_dt < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="El enlace de recuperación ha expirado. Por favor, solicita uno nuevo."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="El enlace de recuperación es inválido.")

    return {
        "valid": True,
        "email": user.correo_usuario
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    from router_activities import record_activity

    if not req.token or not req.token.strip():
        raise HTTPException(status_code=400, detail="El token de recuperación es requerido.")

    # Password policy validation
    if (
        len(req.newPassword) < 8
        or not any(c.isupper() for c in req.newPassword)
        or not any(c.islower() for c in req.newPassword)
        or not any(c.isdigit() for c in req.newPassword)
    ):
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña debe tener al menos 8 caracteres, e incluir letras mayúsculas, minúsculas y un número."
        )

    token_hash = hashlib.sha256(req.token.strip().encode('utf-8')).hexdigest()

    users = db.query(models.Usuario).filter(models.Usuario.token_recuperacion.isnot(None)).all()
    user = None
    exp_iso = None
    for u in users:
        if u.token_recuperacion and u.token_recuperacion.startswith(f"{token_hash}|"):
            user = u
            parts = u.token_recuperacion.split("|", 1)
            if len(parts) == 2:
                exp_iso = parts[1]
            break

    if not user or not exp_iso:
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperación es inválido o ya ha sido utilizado."
        )

    try:
        exp_dt = datetime.fromisoformat(exp_iso)
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if exp_dt < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="El enlace de recuperación ha expirado. Por favor, solicita uno nuevo."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="El enlace de recuperación es inválido.")

    # Update password
    user.contrasenia_usuario = hash_password(req.newPassword)
    # Clear single-use recovery token
    user.token_recuperacion = None

    # Revoke all active sessions for this user
    db.query(models.SesionUsuario).filter(
        models.SesionUsuario.id_usuario == user.id_usuario,
        models.SesionUsuario.estado_sesion == "ACTIVA"
    ).update({"estado_sesion": "REVOCADA"}, synchronize_session=False)

    db.commit()

    user_name = f"{user.nombres_usuario} {user.apellidos_usuario}".strip()
    record_activity(
        db,
        user.id_usuario,
        user_name,
        "CAMBIO_CONTRASENIA",
        "Seguridad",
        "Contraseña restablecida exitosamente mediante enlace de recuperación.",
        str(user.id_usuario)
    )

    return {
        "message": "Su contraseña ha sido actualizada correctamente. Inicie sesión con su nueva clave."
    }

@router.post("/logout")
def logout_user(request: Request, response: Response, db: Session = Depends(get_db)):
    from router_activities import record_activity
    token = request.cookies.get("vextor_auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            sid = payload.get("sid")
            email = payload.get("sub")
            if sid:
                session = db.query(models.SesionUsuario).filter(models.SesionUsuario.id_sesion == UUID(sid)).first()
                if session and session.estado_sesion == "ACTIVA":
                    session.estado_sesion = "CERRADA"
                    db.commit()

            if email:
                user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email).first()
                if user:
                    user_name = f"{user.nombres_usuario} {user.apellidos_usuario}".strip()
                    client_ip = get_client_ip(request)
                    record_activity(
                        db,
                        user.id_usuario,
                        user_name,
                        "LOGOUT",
                        "Seguridad",
                        "Cierre de sesión de usuario.",
                        sid,
                        ip_origen=client_ip,
                        resultado="EXITOSO"
                    )
        except Exception as e:
            print(f"Error closing session on logout: {e}")

    response.delete_cookie(key="vextor_auth_token")
    return {"message": "Sesión cerrada correctamente"}

@router.put("/profile")
def update_profile(
    name: str,
    email: str,
    phone: str = "",
    photo: str = None,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parts = name.strip().split(" ", 1)
    current_user.nombres_usuario = parts[0]
    current_user.apellidos_usuario = parts[1] if len(parts) > 1 else ""
    current_user.correo_usuario = email.strip().lower()
    current_user.telefono_usuario = phone.strip()
    if photo is not None:
        current_user.foto_perfil = photo
    db.commit()
    db.refresh(current_user)

    rol = db.query(models.Rol).filter(models.Rol.id_rol == current_user.id_rol).first()
    role_name = rol.nombre_rol if rol else "Usuario"

    avatar = f"{current_user.nombres_usuario[0]}{current_user.apellidos_usuario[0]}" if current_user.apellidos_usuario else current_user.nombres_usuario[0]
    avatar = avatar.upper()

    return {
        "id": str(current_user.id_usuario),
        "name": f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "email": current_user.correo_usuario,
        "role": role_name,
        "avatar": avatar,
        "phone": current_user.telefono_usuario or "",
        "photo": current_user.foto_perfil
    }

def require_admin(current_user: models.Usuario = Depends(get_current_user)) -> models.Usuario:
    role_name = current_user.rol.nombre_rol if current_user.rol else ""
    if role_name in ("rol-conductor", "Conductor"):
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado. Se requieren permisos administrativos."
        )
    return current_user

@router.get("/me")
def get_me(current_user: models.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    rol = db.query(models.Rol).filter(models.Rol.id_rol == current_user.id_rol).first()
    role_name = rol.nombre_rol if rol else "Usuario"

    avatar = f"{current_user.nombres_usuario[0]}{current_user.apellidos_usuario[0]}" if current_user.apellidos_usuario else current_user.nombres_usuario[0]
    avatar = avatar.upper()

    return {
        "id": str(current_user.id_usuario),
        "name": f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "email": current_user.correo_usuario,
        "role": role_name,
        "avatar": avatar,
        "phone": current_user.telefono_usuario or "",
        "photo": current_user.foto_perfil
    }
