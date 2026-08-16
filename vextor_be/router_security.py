import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from router_auth import get_current_user, verify_password, hash_password, get_client_ip
from router_activities import record_activity

router = APIRouter(prefix="/api/security", tags=["Security"])

@router.get("/sessions", response_model=List[schemas.SesionUsuarioOut])
def get_active_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    current_sid = getattr(request.state, "current_session_id", None)

    sessions = db.query(models.SesionUsuario).filter(
        models.SesionUsuario.id_usuario == current_user.id_usuario,
        models.SesionUsuario.estado_sesion == "ACTIVA"
    ).order_by(models.SesionUsuario.ultima_actividad.desc()).all()

    result = []
    for s in sessions:
        is_current = (str(s.id_sesion) == str(current_sid)) if current_sid else False
        res_item = schemas.SesionUsuarioOut(
            id_sesion=s.id_sesion,
            id_usuario=s.id_usuario,
            ip_origen=s.ip_origen,
            dispositivo=s.dispositivo,
            user_agent=s.user_agent,
            fecha_inicio=s.fecha_inicio,
            ultima_actividad=s.ultima_actividad,
            estado_sesion=s.estado_sesion,
            is_current=is_current
        )
        result.append(res_item)

    return result

@router.delete("/sessions/{id_sesion}")
def revoke_session(
    id_sesion: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    session_to_revoke = db.query(models.SesionUsuario).filter(models.SesionUsuario.id_sesion == id_sesion).first()
    if not session_to_revoke:
        raise HTTPException(status_code=404, detail="La sesión especificada no fue encontrada.")

    # Security check: User can only revoke their own sessions
    if session_to_revoke.id_usuario != current_user.id_usuario:
        client_ip = get_client_ip(request)
        user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
        record_activity(
            db,
            current_user.id_usuario,
            user_name,
            "REVOCAR_SESION",
            "Seguridad",
            f"Intento no autorizado de revocar sesión de otro usuario ({session_to_revoke.id_usuario}).",
            str(id_sesion),
            ip_origen=client_ip,
            resultado="FALLIDO"
        )
        raise HTTPException(status_code=403, detail="No tiene permisos para revocar esta sesión.")

    if session_to_revoke.estado_sesion != "ACTIVA":
        raise HTTPException(status_code=400, detail="La sesión ya no se encuentra activa.")

    session_to_revoke.estado_sesion = "REVOCADA"
    db.commit()

    client_ip = get_client_ip(request)
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "REVOCAR_SESION",
        "Seguridad",
        f"Revocó la sesión activa en '{session_to_revoke.dispositivo}' (IP: {session_to_revoke.ip_origen}).",
        str(id_sesion),
        ip_origen=client_ip,
        resultado="EXITOSO"
    )

    return {"message": "Sesión revocada correctamente"}

@router.delete("/sessions-others/all")
def revoke_all_other_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    current_sid = getattr(request.state, "current_session_id", None)

    query = db.query(models.SesionUsuario).filter(
        models.SesionUsuario.id_usuario == current_user.id_usuario,
        models.SesionUsuario.estado_sesion == "ACTIVA"
    )

    if current_sid:
        try:
            query = query.filter(models.SesionUsuario.id_sesion != uuid.UUID(current_sid))
        except ValueError:
            pass

    other_sessions = query.all()
    revoked_count = len(other_sessions)

    for s in other_sessions:
        s.estado_sesion = "REVOCADA"

    db.commit()

    client_ip = get_client_ip(request)
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "REVOCAR_SESION",
        "Seguridad",
        f"Cerró {revoked_count} otras sesiones activas de su cuenta.",
        None,
        ip_origen=client_ip,
        resultado="EXITOSO"
    )

    return {"message": "Todas las demás sesiones fueron cerradas con éxito", "count": revoked_count}

@router.post("/change-password")
def change_password(
    req: schemas.ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    client_ip = get_client_ip(request)
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()

    if not verify_password(req.current_password, current_user.contrasenia_usuario):
        record_activity(
            db,
            current_user.id_usuario,
            user_name,
            "CAMBIO_CONTRASENA",
            "Seguridad",
            "Intento fallido de cambio de contraseña (contraseña actual incorrecta).",
            str(current_user.id_usuario),
            ip_origen=client_ip,
            resultado="FALLIDO"
        )
        raise HTTPException(status_code=400, detail="La contraseña actual ingresada no es correcta.")

    # Validate new password policy
    if (
        len(req.new_password) < 8
        or not any(c.isupper() for c in req.new_password)
        or not any(c.islower() for c in req.new_password)
        or not any(c.isdigit() for c in req.new_password)
    ):
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña debe tener al menos 8 caracteres, e incluir letras mayúsculas, minúsculas y un número."
        )

    current_user.contrasenia_usuario = hash_password(req.new_password)

    # Invalidate other active sessions upon password change
    current_sid = getattr(request.state, "current_session_id", None)
    sess_query = db.query(models.SesionUsuario).filter(
        models.SesionUsuario.id_usuario == current_user.id_usuario,
        models.SesionUsuario.estado_sesion == "ACTIVA"
    )
    if current_sid:
        try:
            sess_query = sess_query.filter(models.SesionUsuario.id_sesion != uuid.UUID(current_sid))
        except ValueError:
            pass

    for s in sess_query.all():
        s.estado_sesion = "REVOCADA"

    db.commit()

    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "CAMBIO_CONTRASENA",
        "Seguridad",
        "Cambió exitosamente la contraseña de su cuenta y revocó otras sesiones activas.",
        str(current_user.id_usuario),
        ip_origen=client_ip,
        resultado="EXITOSO"
    )

    return {"message": "Contraseña actualizada correctamente"}
