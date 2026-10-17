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
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy import text
from app.services.audit_service import AuditService

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

MAX_BACKUP_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

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

        contents = await file.read()
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
        if not fname.lower().endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nombre de archivo inválido. Debe terminar en .sql",
            )

        # Buscar en carpetas conocidas si el archivo existe físicamente en el servidor
        possible_paths = [
            os.path.join(os.getcwd(), fname),
            os.path.join(os.getcwd(), "backups", fname),
            os.path.join("/tmp", fname),
        ]
        found_path = None
        for p in possible_paths:
            if os.path.exists(p) and os.path.isfile(p):
                found_path = p
                break

        if found_path:
            if os.path.getsize(found_path) > MAX_BACKUP_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El archivo excede el tamaño máximo permitido (50MB).",
                )
            with open(found_path, "r", encoding="utf-8", errors="replace") as f:
                sql_content = f.read()
            source_label = fname
        else:
            # Si no existe en disco local y tampoco se subió un archivo, requerir la subida
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se encontró el archivo '{fname}' en el servidor. Por favor, adjunte el archivo SQL directamente.",
            )
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

    # Verificación básica de sintaxis SQL
    sql_keywords = ["CREATE", "INSERT", "ALTER", "DROP", "UPDATE", "DELETE", "BEGIN", "COMMIT", "SELECT", "SET"]
    if not any(kw in stripped_sql.upper() for kw in sql_keywords):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo proporcionado no parece ser un script SQL válido.",
        )

    # Ejecución de la restauración
    psql_path = shutil.which("psql")
    from app.core.config import settings

    database_url = settings.DATABASE_URL
    restored_successfully = False

    if database_url.startswith("sqlite"):
        # Restauración en SQLite (principalmente entornos de prueba o desarrollo ligero)
        try:
            # Ejecutar script sobre la conexión SQLAlchemy
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
        # PostgreSQL restore
        if psql_path:
            # Si psql está disponible en el entorno
            parsed = urlparse(database_url.replace("postgresql+psycopg://", "postgresql://").replace("postgres://", "postgresql://"))
            db_host = parsed.hostname or "localhost"
            db_port = str(parsed.port or 5432)
            db_user = parsed.username or "postgres"
            db_pass = parsed.password or ""
            db_name = parsed.path.lstrip("/") or "vextor"

            tmp_file = None
            try:
                with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tf:
                    tf.write(stripped_sql)
                    tmp_file = tf.name

                env = os.environ.copy()
                if db_pass:
                    env["PGPASSWORD"] = db_pass

                cmd = [
                    psql_path,
                    "-h", db_host,
                    "-p", db_port,
                    "-U", db_user,
                    "-d", db_name,
                    "-f", tmp_file,
                ]

                proc = subprocess.run(
                    cmd,
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=120,
                )

                if proc.returncode == 0:
                    restored_successfully = True
                else:
                    logging.error(f"[RESTORE ERROR psql] {proc.stderr}")
                    # Reintento con fallback interno por si psql falló por argumentos o SSL
                    restored_successfully = False
            except Exception as proc_err:
                logging.error(f"[RESTORE EXCEPTION psql] {proc_err}")
                restored_successfully = False
            finally:
                if tmp_file and os.path.exists(tmp_file):
                    try:
                        os.remove(tmp_file)
                    except Exception:
                        pass

        if not restored_successfully:
            # Fallback a ejecución via cursor de conexión SQLAlchemy / Psycopg
            try:
                raw_conn = db.get_bind().raw_connection()
                cursor = raw_conn.cursor()
                cursor.execute(stripped_sql)
                raw_conn.commit()
                restored_successfully = True
            except Exception as pg_err:
                db.rollback()
                logging.error(f"[RESTORE ERROR DB CURSOR] {pg_err}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error interno al ejecutar la restauración en la base de datos PostgreSQL.",
                )

    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    try:
        AuditService.record_activity(
            db,
            id_usuario=current_user.id_usuario,
            nombres_usuario=user_name,
            tipo_accion="RESTAURACION",
            modulo="Configuración",
            descripcion=f"Restauración de base de datos ejecutada desde la copia: {source_label}",
            resultado="EXITOSO",
        )
    except Exception as audit_err:
        logging.warning(f"No se pudo registrar auditoría de restauración: {audit_err}")

    return {
        "status": "success",
        "message": f"Sistema y base de datos restaurados exitosamente desde {source_label}",
    }
