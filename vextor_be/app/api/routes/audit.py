"""
Endpoints de Auditoría y Seguridad
Actividades, notificaciones, sesiones
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
from pydantic import BaseModel

import os
import shutil
import tempfile
import subprocess
import logging
import re
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy import text
from app.services.audit_service import AuditService
from app.core.config import settings
from app.services.backup_service import BackupOperationError, restore_postgres_sql
from app.services.backup_storage import BackupStorageError, download_backup

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

    # Check 1: Mantenimientos próximos o vencidos
    maintenances = db.query(Mantenimiento).filter(
        Mantenimiento.estado_mantenimiento.in_(["PROGRAMADO", "EN_PROCESO"])
    ).all()

    for m in maintenances:
        if m.fecha_mantenimiento <= today:
            title = f"Mantenimiento Requerido - Vehículo ID: {str(m.id_vehiculo)[:8]}"
            desc_text = f"El mantenimiento '{m.tipo_mantenimiento}' está programado para hoy o se encuentra vencido."
            # Evitar duplicados no leídos
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


# ========== RESPALDOS Y RESTAURACIÓN ==========

MAX_BACKUP_SIZE_BYTES = settings.BACKUP_MAX_SIZE_BYTES

@router.post("/api/backup/restore")
async def restore_backup(
    request: Request,
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Ejecuta la restauración de la base de datos a partir de un archivo de backup SQL"""
    from app.models import Rol as RolModel
    rol = db.query(RolModel).filter(RolModel.id_rol == current_user.id_rol).first()
    if not rol or "admin" not in (rol.nombre_rol or "").strip().lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de Administrador",
        )

    # Fallback JSON parsing if no form fields provided
    if file is None and not filename:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                body = await request.json()
                filename = body.get("filename")
            except Exception:
                pass

    sql_content = ""
    source_label = ""

    if file is not None:
        fname = file.filename or "backup.sql"
        if not fname.lower().endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de archivo no permitido. Debe ser un archivo .sql",
            )

        contents = await file.read(MAX_BACKUP_SIZE_BYTES + 1)
        if len(contents) > MAX_BACKUP_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo excede el tamaño máximo permitido (50MB).",
            )

        try:
            sql_content = contents.decode("utf-8")
        except UnicodeDecodeError:
            try:
                sql_content = contents.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El archivo no tiene una codificación de texto válida.",
                )
        source_label = fname

    elif filename:
        fname = filename.strip()
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.sql", fname, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nombre de archivo inválido. Debe ser un nombre .sql seguro.",
            )

        if os.path.basename(fname) != fname or "/" in fname or "\\" in fname:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nombre de archivo inválido.",
            )

        # Compatibilidad con respaldos antiguos en disco y respaldos nuevos en Storage.
        possible_paths = [
            os.path.join(os.getcwd(), fname),
            os.path.join(os.getcwd(), "backups", fname),
            os.path.join("/tmp", fname),
        ]
        found_path = next(
            (path for path in possible_paths if os.path.isfile(path)),
            None,
        )
        if found_path:
            if os.path.getsize(found_path) > MAX_BACKUP_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El archivo excede el tamaño máximo permitido (50MB).",
                )
            with open(found_path, "r", encoding="utf-8", errors="replace") as backup_file:
                sql_content = backup_file.read()
            source_label = fname
        else:
            try:
                stored_content = download_backup(fname)
                if not isinstance(stored_content, bytes):
                    raise HTTPException(status_code=404, detail="No se encontró el respaldo solicitado.")
                if len(stored_content) > MAX_BACKUP_SIZE_BYTES:
                    raise HTTPException(status_code=400, detail="El archivo excede el tamaño máximo permitido (50MB).")
                sql_content = stored_content.decode("utf-8")
                source_label = fname
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="El respaldo no contiene texto UTF-8 válido.") from None
            except BackupStorageError:
                raise HTTPException(status_code=404, detail="No se encontró el respaldo en Supabase Storage.") from None
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar un archivo SQL para restaurar.",
        )

    # Validar que el contenido SQL sea válido y no esté vacío
    stripped_sql = sql_content.strip()
    if not stripped_sql:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo SQL está vacío.",
        )

    # Validación básica y bloqueo de comandos interactivos de psql que podrían
    # ejecutar procesos o leer archivos locales del contenedor.
    sql_keywords = ["CREATE", "INSERT", "ALTER", "DROP", "UPDATE", "DELETE", "BEGIN", "COMMIT", "SELECT", "SET", "COPY"]
    if not any(kw in stripped_sql.upper() for kw in sql_keywords):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo proporcionado no parece ser un script SQL válido.",
        )
    for line in stripped_sql.splitlines():
        command = line.lstrip()
        if command.startswith("\\"):
            if command == "\\." or re.match(r"^\\(?:restrict|unrestrict)\\b", command):
                continue
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo contiene comandos interactivos de psql no permitidos.",
            )

    # Capturar los datos de auditoría antes de que la restauración pueda reemplazar tablas.
    restoring_user_id = current_user.id_usuario
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()

    # Ejecución de la restauración
    pre_restore_backup = None

    if settings.DATABASE_URL.startswith("sqlite"):
        # SQLite se conserva para pruebas y desarrollo local aislado.
        try:
            connection = db.connection().connection
            connection.executescript(stripped_sql)
            db.commit()
            restored_successfully = True
        except Exception as sq_err:
            db.rollback()
            logging.error(f"[RESTORE ERROR SQLite] {sq_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al ejecutar la restauración en la base de datos SQLite.",
            )
    else:
        # Cerrar la transacción de autorización antes de reemplazar tablas:
        # evita que los SELECT previos bloqueen los DROP del dump.
        db.rollback()
        # PostgreSQL exige una copia previa subida y verificada en Storage.
        try:
            pre_restore_backup = restore_postgres_sql(stripped_sql)
            restored_successfully = True
        except Exception as restore_err:
            db.rollback()
            logging.error("[RESTORE ERROR PostgreSQL] La restauración protegida no pudo completarse.")
            if isinstance(restore_err, BackupOperationError):
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=str(restore_err),
                ) from None
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="La restauración PostgreSQL falló. Si se alcanzó a crear, la copia previa está guardada en Supabase Storage.",
            ) from None


    try:
        AuditService.record_activity(
            db,
            id_usuario=restoring_user_id,
            nombres_usuario=user_name,
            tipo_accion="RESTAURACION",
            modulo="Configuración",
            descripcion=f"Restauración de base de datos ejecutada desde la copia: {source_label}" + (f". Copia previa: {pre_restore_backup}" if pre_restore_backup else ""),
            resultado="EXITOSO",
        )
    except Exception as audit_err:
        logging.warning(f"No se pudo registrar auditoría de restauración: {audit_err}")

    return {
        "status": "success",
        "message": f"Sistema y base de datos restaurados exitosamente desde {source_label}" + (f". Copia previa verificada: {pre_restore_backup}" if pre_restore_backup else ""),
    }
