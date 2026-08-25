"""
Servicio de Auditoría
Registra actividades y crea notificaciones
"""
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Actividad, Notificacion


class AuditService:
    """Servicio para auditoría y notificaciones"""

    @staticmethod
    def record_activity(
        db: Session,
        id_usuario: UUID = None,
        nombres_usuario: str = None,
        tipo_accion: str = None,
        modulo: str = None,
        descripcion: str = None,
        id_registro_afectado: str = None,
        ip_origen: str = None,
        resultado: str = "EXITOSO",
    ) -> Actividad:
        """Registra una actividad en la auditoría"""
        activity = Actividad(
            id_usuario=id_usuario,
            nombres_usuario=nombres_usuario,
            tipo_accion=tipo_accion,
            modulo=modulo,
            descripcion=descripcion,
            id_registro_afectado=id_registro_afectado,
            ip_origen=ip_origen,
            resultado=resultado,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity

    @staticmethod
    def create_notification(
        db: Session,
        titulo: str,
        descripcion: str,
        tipo: str,
        id_usuario: UUID = None,
    ) -> Notificacion:
        """Crea una notificación"""
        notification = Notificacion(
            id_usuario=id_usuario,
            titulo=titulo,
            descripcion=descripcion,
            tipo=tipo,
            leido=False,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
