import jwt
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from database import get_db
import models
import schemas

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "vextor_super_secret_key_1234567890!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 hours

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

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

def get_current_user_from_token(token: str, db: Session) -> models.Usuario:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
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
    return get_current_user_from_token(token, db)

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    # Clean inputs
    email_clean = req.email.strip().lower()
    name_clean = req.fullName.strip()

    # Check if exists
    existing = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")

    # Resolve role (Default to Administrador)
    rol = db.query(models.Rol).filter(models.Rol.nombre_rol == "Administrador").first()
    if not rol:
        # Fallback to Super Administrador or create Admin
        rol = db.query(models.Rol).filter(models.Rol.nombre_rol == "Super Administrador").first()
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
def login_user(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()

    user = db.query(models.Usuario).filter(models.Usuario.correo_usuario == email_clean).first()
    if not user or not verify_password(req.password, user.contrasenia_usuario):
        # Prevent user enumeration by keeping this generic
        raise HTTPException(status_code=400, detail="Credenciales incorrectas o el usuario no existe.")

    if user.estado_usuario != "ACTIVO":
        raise HTTPException(status_code=403, detail="Su cuenta de usuario se encuentra inactiva.")

    # Resolve Rol Name
    rol = db.query(models.Rol).filter(models.Rol.id_rol == user.id_rol).first()
    role_name = rol.nombre_rol if rol else "Usuario"

    # Create JWT Token
    token = create_access_token(data={"sub": user.correo_usuario, "role": role_name})

    # Set Cookie HttpOnly
    response.set_cookie(
        key="vextor_auth_token",
        value=token,
        httponly=True,
        secure=False, # Set to True in production with SSL
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    avatar = f"{user.nombres_usuario[0]}{user.apellidos_usuario[0]}" if user.apellidos_usuario else user.nombres_usuario[0]
    avatar = avatar.upper()

    return {
        "token": token,
        "user": {
            "id": str(user.id_usuario),
            "name": f"{user.nombres_usuario} {user.apellidos_usuario}".strip(),
            "email": user.correo_usuario,
            "role": role_name,
            "avatar": avatar,
            "phone": user.telefono_usuario or "",
            "photo": user.foto_perfil
        }
    }

@router.post("/logout")
def logout_user(response: Response):
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
