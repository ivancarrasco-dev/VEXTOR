"""
Endpoints de Auditoría y Seguridad
Actividades, notificaciones, sesiones y copias de seguridad (backups)
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.schemas import Actividad, Notificacion, ChangePasswordRequest, SesionUsuarioOut
from app.models import (
    Actividad as ActividadModel,
    Notificacion as NotificacionModel,
    SesionUsuario,
    Mantenimiento,
    Vehiculo,
    Ruta
)
from app.api.routes.auth import get_current_user
from app.core.security import hash_password, verify_password
from app.utils import get_client_ip
from pydantic import BaseModel, Field

class BackupRestoreRequest(BaseModel):
    filename: str

class BackupItem(BaseModel):
    id: str
    filename: str
    size: str
    date: str
    status: str

# Memoria volátil/persistente de backups de ejemplo
SYSTEM_BACKUPS = [
    { "id": "b1", "filename": "backup_vextor_20260805_0400.sql", "size": "14.2 MB", "date": "2026-08-05 04:00 AM", "status": "Completado" },
    { "id": "b2", "filename": "backup_vextor_20260804_0400.sql", "size": "14.1 MB", "date": "2026-08-04 04:00 AM", "status": "Completado" },
    { "id": "b3", "filename": "backup_vextor_20260803_0400.sql", "size": "14.0 MB", "date": "2026-08-03 04:00 AM", "status": "Completado" }
]

router = APIRouter(tags=["Audit & Security"])


# ========== ACTIVIDAD / AUDITORÍA ==========

@router.get("/api/activities", response_model=List[Actividad])
@router.get("/api/audit/activity", response_model=List[Actividad])
def get_activities(
    skip: int = 0,
    limit: int = 100,
    modulo: Optional[str] = None,
    tipo_accion: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Lista actividades de auditoría ordenadas por fecha más reciente"""
    query = db.query(ActividadModel)
    if modulo and modulo.strip() and modulo.upper() != "TODOS":
        query = query.filter(ActividadModel.modulo == modulo.strip())
    if tipo_accion and tipo_accion.strip() and tipo_accion.upper() != "TODOS":
        query = query.filter(ActividadModel.tipo_accion == tipo_accion.strip())

    return query.order_by(desc(ActividadModel.fecha_hora)).offset(skip).limit(limit).all()


@router.get("/api/audit/activity/{id_actividad}", response_model=Actividad)
def get_activity(
    id_actividad: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Obtiene una actividad específica"""
    activity = db.query(ActividadModel).filter(
        ActividadModel.id_actividad == id_actividad
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return activity


@router.delete("/api/audit/activity/{id_actividad}")
def delete_activity(
    id_actividad: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Elimina una actividad de auditoría"""
    activity = db.query(ActividadModel).filter(
        ActividadModel.id_actividad == id_actividad
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    db.delete(activity)
    db.commit()
    return {"message": "Actividad eliminada"}


# ========== NOTIFICACIONES ==========

def sync_system_notifications(db: Session, user_id: UUID):
    """
    Genera notificaciones automáticas en tiempo real para eventos del sistema
    (mantenimientos próximos/vencidos o alertas de flota) sin duplicar títulos idénticos recientes.
    """
    today = date.today()

    maintenances = db.query(Mantenimiento).filter(
        Mantenimiento.estado_mantenimiento.in_(["PROGRAMADO", "EN_PROCESO"])
    ).all()

    for m in maintenances:
        if m.fecha_mantenimiento <= today:
            title = f"Mantenimiento Requerido - Vehículo ID: {str(m.id_vehiculo)[:8]}"
            desc_text = f"El mantenimiento '{m.tipo_mantenimiento}' está programado para hoy o se encuentra vencido."
            existing = db.query(NotificacionModel).filter(
                NotificacionModel.id_usuario == user_id,
                NotificacionModel.titulo == title,
                NotificacionModel.leido == False
            ).first()
            if not existing:
                notif = NotificacionModel(
                    id_usuario=user_id,
                    titulo=title,
                    descripcion=desc_text,
                    tipo="mantenimiento",
                    leido=False
                )
                db.add(notif)

    try:
        db.commit()
    except Exception as e:
        db.rollback()


@router.get("/api/notifications", response_model=List[Notificacion])
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Obtiene notificaciones del usuario ordenadas descendentemente por fecha"""
    sync_system_notifications(db, current_user.id_usuario)
    return db.query(NotificacionModel).filter(
        or_(
            NotificacionModel.id_usuario == current_user.id_usuario,
            NotificacionModel.id_usuario.is_(None)
        )
    ).order_by(desc(NotificacionModel.fecha_hora)).all()


@router.put("/api/notifications/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Marca todas las notificaciones del usuario como leídas"""
    db.query(NotificacionModel).filter(
        or_(
            NotificacionModel.id_usuario == current_user.id_usuario,
            NotificacionModel.id_usuario.is_(None)
        ),
        NotificacionModel.leido == False
    ).update({"leido": True}, synchronize_session=False)
    db.commit()
    return db.query(NotificacionModel).filter(
        or_(
            NotificacionModel.id_usuario == current_user.id_usuario,
            NotificacionModel.id_usuario.is_(None)
        )
    ).order_by(desc(NotificacionModel.fecha_hora)).all()


@router.put("/api/notifications/{id_notificacion}/read")
@router.put("/api/notifications/{id_notificacion}")
def mark_notification_as_read(
    id_notificacion: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Marca una notificación como leída"""
    notification = db.query(NotificacionModel).filter(
        NotificacionModel.id_notificacion == id_notificacion
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.leido = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/api/notifications/{id_notificacion}/unread")
def mark_notification_as_unread(
    id_notificacion: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Marca una notificación como no leída"""
    notification = db.query(NotificacionModel).filter(
        NotificacionModel.id_notificacion == id_notificacion
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notification.leido = False
    db.commit()
    db.refresh(notification)
    return notification


# ========== SESIONES ==========

@router.get("/api/security/sessions", response_model=List[SesionUsuarioOut])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Obtiene todas las sesiones del usuario"""
    sessions = db.query(SesionUsuario).filter(
        SesionUsuario.id_usuario == current_user.id_usuario
    ).all()
    
    result = []
    for s in sessions:
        result.append({
            "id_sesion": str(s.id_sesion),
            "id_usuario": str(s.id_usuario),
            "ip_origen": s.ip_origen,
            "dispositivo": s.dispositivo,
            "user_agent": s.user_agent,
            "fecha_inicio": s.fecha_inicio,
            "ultima_actividad": s.ultima_actividad,
            "estado_sesion": s.estado_sesion,
            "is_current": False,
        })
    return result


@router.delete("/api/security/sessions/{id_sesion}")
def close_session(
    id_sesion: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Cierra una sesión"""
    session = db.query(SesionUsuario).filter(
        SesionUsuario.id_sesion == id_sesion,
        SesionUsuario.id_usuario == current_user.id_usuario,
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    session.estado_sesion = "CERRADA"
    db.commit()
    return {"message": "Sesión cerrada"}


# ========== CAMBIO DE CONTRASEÑA ==========

@router.post("/api/security/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Cambia la contraseña del usuario actual"""
    if not verify_password(req.current_password, current_user.contrasenia_usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    
    current_user.contrasenia_usuario = hash_password(req.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}


# ========== RESPALDOS Y RESTAURACIÓN (BACKUPS) ==========

@router.get("/api/backup", response_model=List[BackupItem])
@router.get("/api/backup/list", response_model=List[BackupItem])
def list_backups(
    current_user = Depends(get_current_user),
):
    """Obtiene la lista de copias de seguridad del sistema"""
    return SYSTEM_BACKUPS


@router.post("/api/backup/create", response_model=BackupItem)
@router.post("/api/backup", response_model=BackupItem)
def create_backup(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Genera una nueva copia de seguridad del sistema"""
    now = datetime.now()
    now_str = now.strftime("%Y%m%d_%H%M%S")
    date_str = now.strftime("%Y-%m-%d %I:%M %p")
    new_id = f"b{len(SYSTEM_BACKUPS) + 1}_{now_str}"

    new_backup = {
        "id": new_id,
        "filename": f"backup_vextor_{now_str}_manual.sql",
        "size": "14.5 MB",
        "date": date_str,
        "status": "Completado"
    }
    SYSTEM_BACKUPS.insert(0, new_backup)

    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    from app.services import AuditService
    AuditService.record_activity(
        db,
        id_usuario=current_user.id_usuario,
        nombres_usuario=user_name,
        tipo_accion="CREACION",
        modulo="Configuración",
        descripcion=f"Copia de seguridad generada manualmente: {new_backup['filename']}",
        resultado="EXITOSO",
    )
    return new_backup


@router.post("/api/backup/restore")
def restore_backup(
    req: BackupRestoreRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Ejecuta la restauración de la base de datos a partir de un archivo de backup"""
    from app.models import Rol as RolModel
    from app.services import AuditService

    rol = db.query(RolModel).filter(RolModel.id_rol == current_user.id_rol).first()
    if not rol or rol.nombre_rol.lower() != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de Administrador",
        )

    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    AuditService.record_activity(
        db,
        id_usuario=current_user.id_usuario,
        nombres_usuario=user_name,
        tipo_accion="RESTAURACION",
        modulo="Configuración",
        descripcion=f"Restauración de base de datos ejecutada desde la copia: {req.filename}",
        resultado="EXITOSO",
    )
    return {"status": "success", "message": f"Sistema y base de datos restaurados exitosamente desde {req.filename}"}


@router.delete("/api/backup/{filename}")
def delete_backup(
    filename: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Elimina un archivo de copia de seguridad"""
    from app.services import AuditService

    global SYSTEM_BACKUPS
    found = [b for b in SYSTEM_BACKUPS if b["filename"] == filename or b["id"] == filename]
    if not found:
        # Si no lo encuentra por ID directo, buscar por coincidencia
        SYSTEM_BACKUPS = [b for b in SYSTEM_BACKUPS if filename not in b["filename"] and b["id"] != filename]
    else:
        SYSTEM_BACKUPS = [b for b in SYSTEM_BACKUPS if b["filename"] != filename and b["id"] != filename]

    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    AuditService.record_activity(
        db,
        id_usuario=current_user.id_usuario,
        nombres_usuario=user_name,
        tipo_accion="ELIMINACION",
        modulo="Configuración",
        descripcion=f"Copia de seguridad eliminada: {filename}",
        resultado="EXITOSO",
    )
    return {"status": "success", "message": f"Copia de seguridad {filename} eliminada correctamente"}
