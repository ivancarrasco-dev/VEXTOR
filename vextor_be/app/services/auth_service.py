"""
Servicio de Autenticación
Contiene toda la lógica de registro, login, validación de tokens, recuperación de contraseña
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_policy,
    create_access_token,
    decode_token,
)
from app.models import Usuario, Rol, SesionUsuario
from app.schemas import LoginRequest, RegisterRequest
from app.utils import (
    get_client_ip,
    parse_user_agent,
    split_full_name,
    generate_avatar_initials,
)


class AuthService:
    """Servicio de autenticación"""

    @staticmethod
    def register_user(
        email: str,
        password: str,
        full_name: str,
        db: Session,
    ) -> Usuario:
        """Registra un nuevo usuario"""
        email_clean = email.strip().lower()
        full_name_clean = full_name.strip()

        if not full_name_clean or len(full_name_clean) < 2:
            raise HTTPException(
                status_code=400,
                detail="El nombre completo es obligatorio y debe tener al menos 2 caracteres.",
            )

        # Validar contraseña
        is_valid, error_msg = validate_password_policy(password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Verificar si existe
        existing = db.query(Usuario).filter(Usuario.correo_usuario == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="El correo electrónico ya está registrado.",
            )

        # Obtener o crear rol Usuario para registro público
        rol = db.query(Rol).filter(Rol.nombre_rol == "Usuario").first()
        if not rol:
            rol = db.query(Rol).filter(Rol.id_rol == UUID("11111111-2222-3333-4444-555555555555")).first()
        if not rol:
            rol = Rol(
                id_rol=UUID("11111111-2222-3333-4444-555555555555"),
                nombre_rol="Usuario",
                descripcion_rol="Usuario normal con acceso limitado",
            )
            db.add(rol)
            db.commit()
            db.refresh(rol)

        # Dividir nombre
        nombres, apellidos = split_full_name(full_name_clean)

        # Crear usuario
        hashed_password = hash_password(password)
        new_user = Usuario(
            id_usuario=uuid4(),
            id_rol=rol.id_rol,
            nombres_usuario=nombres,
            apellidos_usuario=apellidos,
            correo_usuario=email_clean,
            contrasenia_usuario=hashed_password,
            telefono_usuario="",
            estado_usuario="ACTIVO",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    @staticmethod
    def login_user(
        email: str,
        password: str,
        request: Request,
        db: Session,
    ) -> Tuple[str, dict]:
        """
        Autentica un usuario y crea una sesión.
        
        Retorna: (token, user_info_dict)
        """
        email_clean = email.strip().lower()
        client_ip = get_client_ip(request)

        user = db.query(Usuario).filter(Usuario.correo_usuario == email_clean).first()
        if not user or not verify_password(password, user.contrasenia_usuario):
            raise HTTPException(
                status_code=400,
                detail="Credenciales incorrectas o el usuario no existe.",
            )

        if user.estado_usuario != "ACTIVO":
            raise HTTPException(
                status_code=403,
                detail="Su cuenta de usuario se encuentra inactiva.",
            )

        # Obtener nombre de rol
        rol = db.query(Rol).filter(Rol.id_rol == user.id_rol).first()
        role_name = rol.nombre_rol if rol else "Usuario"

        # Crear sesión en BD
        ua_str = request.headers.get("user-agent", "")
        device_info = parse_user_agent(ua_str)

        new_session = SesionUsuario(
            id_sesion=uuid4(),
            id_usuario=user.id_usuario,
            ip_origen=client_ip,
            dispositivo=device_info,
            user_agent=ua_str,
            fecha_inicio=datetime.now(),
            ultima_actividad=datetime.now(),
            estado_sesion="ACTIVA",
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        # Crear JWT con session ID
        token = create_access_token(
            data={
                "sub": user.correo_usuario,
                "role": role_name,
                "sid": str(new_session.id_sesion),
            }
        )

        # Generar avatar
        avatar = generate_avatar_initials(user.nombres_usuario, user.apellidos_usuario)

        user_info = {
            "id": str(user.id_usuario),
            "name": f"{user.nombres_usuario} {user.apellidos_usuario}".strip(),
            "email": user.correo_usuario,
            "role": role_name,
            "avatar": avatar,
            "phone": user.telefono_usuario or "",
            "photo": user.foto_perfil,
            "must_change_password": bool(user.requiere_cambio_clave),
        }

        return token, user_info

    @staticmethod
    def request_password_reset(email: str, db: Session) -> bool:
        """Solicita un reset de contraseña"""
        email_clean = email.strip().lower()
        user = db.query(Usuario).filter(Usuario.correo_usuario == email_clean).first()

        if user and user.estado_usuario == "ACTIVO":
            # Generar token de recuperación
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            exp_time = (
                datetime.now(timezone.utc) + timedelta(minutes=30)
            ).isoformat()

            # Guardar hash + expiración
            user.token_recuperacion = f"{token_hash}|{exp_time}"
            db.commit()

            return True, raw_token
        
        # Siempre retornar True para evitar enumeración de usuarios
        return True, None

    @staticmethod
    def verify_reset_token(token: str, db: Session) -> Optional[str]:
        """Verifica que un token de reset sea válido"""
        if not token or not token.strip():
            raise HTTPException(
                status_code=400,
                detail="El token de recuperación es requerido.",
            )

        token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()

        # Buscar usuario con ese token
        users = db.query(Usuario).filter(Usuario.token_recuperacion.isnot(None)).all()
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
                detail="El enlace de recuperación es inválido o ya ha sido utilizado.",
            )

        # Verificar expiración
        try:
            exp_dt = datetime.fromisoformat(exp_iso)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if exp_dt < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=400,
                    detail="El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.",
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="El enlace de recuperación es inválido.",
            )

        return user.correo_usuario

    @staticmethod
    def reset_password(token: str, new_password: str, db: Session) -> bool:
        """Cambia la contraseña usando un token de recuperación"""
        if not token or not token.strip():
            raise HTTPException(
                status_code=400,
                detail="El token de recuperación es requerido.",
            )

        # Validar contraseña
        is_valid, error_msg = validate_password_policy(new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()

        # Buscar usuario
        users = db.query(Usuario).filter(Usuario.token_recuperacion.isnot(None)).all()
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
                detail="El enlace de recuperación es inválido o ya ha sido utilizado.",
            )

        # Verificar expiración
        try:
            exp_dt = datetime.fromisoformat(exp_iso)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if exp_dt < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=400,
                    detail="El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.",
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="El enlace de recuperación es inválido.",
            )

        # Actualizar contraseña y limpiar token
        user.contrasenia_usuario = hash_password(new_password)
        user.token_recuperacion = None

        # Revocar todas las sesiones activas
        db.query(SesionUsuario).filter(
            SesionUsuario.id_usuario == user.id_usuario,
            SesionUsuario.estado_sesion == "ACTIVA",
        ).update({"estado_sesion": "REVOCADA"}, synchronize_session=False)

        db.commit()
        return True

    @staticmethod
    def get_current_user(token: str, db: Session, request: Optional[Request] = None) -> Usuario:
        """Valida un JWT y retorna el usuario actual"""
        try:
            payload = decode_token(token)
            email = payload.get("sub")
            sid = payload.get("sid")

            if not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido",
                )
        except HTTPException:
            raise

        user = db.query(Usuario).filter(Usuario.correo_usuario == email).first()
        if not user or user.estado_usuario != "ACTIVO":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo",
            )

        # Validar sesión
        if sid:
            try:
                session_id_uuid = UUID(sid)
                session = db.query(SesionUsuario).filter(
                    SesionUsuario.id_sesion == session_id_uuid,
                    SesionUsuario.id_usuario == user.id_usuario,
                ).first()

                if not session or session.estado_sesion != "ACTIVA":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="La sesión ha sido revocada o cerró sesión.",
                    )

                # Actualizar última actividad
                session.ultima_actividad = datetime.now()
                db.commit()

                if request:
                    request.state.current_session_id = str(session.id_sesion)
            except ValueError:
                pass

        return user

    @staticmethod
    def logout_user(session_id: str, db: Session) -> bool:
        """Cierra una sesión"""
        try:
            session_uuid = UUID(session_id)
            session = db.query(SesionUsuario).filter(
                SesionUsuario.id_sesion == session_uuid
            ).first()

            if session and session.estado_sesion == "ACTIVA":
                session.estado_sesion = "CERRADA"
                db.commit()
                return True
        except ValueError:
            pass

        return False

    @staticmethod
    def update_profile(
        user_id: UUID,
        name: str,
        email: str,
        phone: str = "",
        photo: Optional[str] = None,
        db: Session = None,
    ) -> dict:
        """Actualiza el perfil del usuario"""
        user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        nombres, apellidos = split_full_name(name.strip())
        user.nombres_usuario = nombres
        user.apellidos_usuario = apellidos
        user.correo_usuario = email.strip().lower()
        user.telefono_usuario = phone.strip()
        if photo is not None:
            user.foto_perfil = photo

        db.commit()
        db.refresh(user)

        rol = db.query(Rol).filter(Rol.id_rol == user.id_rol).first()
        role_name = rol.nombre_rol if rol else "Usuario"
        avatar = generate_avatar_initials(user.nombres_usuario, user.apellidos_usuario)

        return {
            "id": str(user.id_usuario),
            "name": f"{user.nombres_usuario} {user.apellidos_usuario}".strip(),
            "email": user.correo_usuario,
            "role": role_name,
            "avatar": avatar,
            "phone": user.telefono_usuario or "",
            "photo": user.foto_perfil,
            "must_change_password": bool(user.requiere_cambio_clave),
        }
