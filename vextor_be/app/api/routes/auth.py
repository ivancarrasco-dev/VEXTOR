"""
Endpoints de Autenticación
Login, registro, logout, recuperación de contraseña
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginRequest, RegisterRequest, ForgotPasswordRequest, VerifyResetTokenRequest, ResetPasswordRequest
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.services.email_service import EmailService
from app.utils import get_client_ip

# Crear router
router = APIRouter(tags=["Authentication"])


def get_current_user_from_token(token: str, db: Session, request: Request = None):
    """Dependency para obtener usuario actual desde JWT"""
    return AuthService.get_current_user(token, db, request)


def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Dependency que extrae token de cookie o header"""
    token = request.cookies.get("vextor_auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return get_current_user_from_token(token, db, request)


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuevo usuario"""
    try:
        user = AuthService.register_user(req.email, req.password, req.fullName, db)
        
        # Auditoría
        AuditService.record_activity(
            db,
            id_usuario=user.id_usuario,
            nombres_usuario=f"{user.nombres_usuario} {user.apellidos_usuario}".strip(),
            tipo_accion="REGISTRO",
            modulo="Autenticación",
            descripcion=f"Nuevo usuario registrado: {user.correo_usuario}",
            resultado="EXITOSO",
        )
        
        return {"message": "Usuario creado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """Autentica un usuario"""
    try:
        token, user_info = AuthService.login_user(req.email, req.password, request, db)
        
        # Set cookie
        response.set_cookie(
            key="vextor_auth_token",
            value=token,
            httponly=True,
            secure=False,  # Change to True in production with SSL
            samesite="lax",
            max_age=1440 * 60,  # 24 horas
        )
        
        # Auditoría
        AuditService.record_activity(
            db,
            id_usuario=user_info["id"],
            nombres_usuario=user_info["name"],
            tipo_accion="LOGIN",
            modulo="Autenticación",
            descripcion=f"Inicio de sesión exitoso",
            ip_origen=get_client_ip(request),
            resultado="EXITOSO",
        )
        
        return {
            "token": token,
            "user": user_info,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicita reseteo de contraseña"""
    try:
        success, raw_token = AuthService.request_password_reset(req.email, db)
        
        if success and raw_token:
            # Enviar email
            EmailService.send_password_reset_email(req.email, raw_token)
        
        # Siempre responder lo mismo para evitar enumeración
        return {
            "message": "Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña."
        }
    except Exception as e:
        return {
            "message": "Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña."
        }


@router.post("/verify-reset-token")
def verify_reset_token(req: VerifyResetTokenRequest, db: Session = Depends(get_db)):
    """Verifica que un token de reset sea válido"""
    try:
        email = AuthService.verify_reset_token(req.token, db)
        return {"valid": True, "email": email}
    except HTTPException:
        raise


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Cambia la contraseña usando token"""
    try:
        AuthService.reset_password(req.token, req.newPassword, db)
        return {"message": "Su contraseña ha sido actualizada correctamente. Inicie sesión con su nueva clave."}
    except HTTPException:
        raise


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Cierra la sesión del usuario"""
    try:
        token = request.cookies.get("vextor_auth_token")
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if token:
            try:
                from app.core.security import decode_token
                payload = decode_token(token)
                sid = payload.get("sid")
                if sid:
                    AuthService.logout_user(sid, db)
                    
                    # Auditoría
                    email = payload.get("sub")
                    user = db.query(db.query(__import__('app.models', fromlist=['Usuario']).Usuario)).filter(
                        __import__('app.models', fromlist=['Usuario']).Usuario.correo_usuario == email
                    ).first()
                    if user:
                        AuditService.record_activity(
                            db,
                            id_usuario=user.id_usuario,
                            nombres_usuario=f"{user.nombres_usuario} {user.apellidos_usuario}".strip(),
                            tipo_accion="LOGOUT",
                            modulo="Autenticación",
                            descripcion="Cierre de sesión",
                            ip_origen=get_client_ip(request),
                            resultado="EXITOSO",
                        )
            except:
                pass

        response.delete_cookie(key="vextor_auth_token")
        return {"message": "Sesión cerrada correctamente"}
    except Exception as e:
        return {"message": "Sesión cerrada correctamente"}


@router.put("/profile")
def update_profile(
    name: str,
    email: str,
    phone: str = "",
    photo: str = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza el perfil del usuario"""
    try:
        user_info = AuthService.update_profile(
            current_user.id_usuario,
            name,
            email,
            phone,
            photo,
            db,
        )
        return user_info
    except HTTPException:
        raise


@router.get("/me")
def get_me(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene datos del usuario actual"""
    from app.models import Rol
    from app.utils import generate_avatar_initials
    
    rol = db.query(Rol).filter(Rol.id_rol == current_user.id_rol).first()
    role_name = rol.nombre_rol if rol else "Usuario"
    avatar = generate_avatar_initials(current_user.nombres_usuario, current_user.apellidos_usuario)

    return {
        "id": str(current_user.id_usuario),
        "name": f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip(),
        "email": current_user.correo_usuario,
        "role": role_name,
        "avatar": avatar,
        "phone": current_user.telefono_usuario or "",
        "photo": current_user.foto_perfil,
    }
