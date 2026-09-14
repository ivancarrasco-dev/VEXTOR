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
    def _coerce_uuid(val):
        if val is None:
            return None
        if isinstance(val, UUID):
            return val
        try:
            return UUID(str(val))
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def record_activity(
        db: Session,
        id_usuario = None,
        nombres_usuario: str = None,
        tipo_accion: str = None,
        modulo: str = None,
        descripcion: str = None,
        id_registro_afectado: str = None,
        ip_origen: str = None,
        resultado: str = "EXITOSO",
    ) -> Actividad:
        """Registra una actividad en la auditoría"""
        user_uuid = AuditService._coerce_uuid(id_usuario)
        if nombres_usuario:
            nombres_usuario = str(nombres_usuario)[:150]
        if tipo_accion:
            tipo_accion = str(tipo_accion)[:50]
        if modulo:
            modulo = str(modulo)[:50]
        if id_registro_afectado:
            id_registro_afectado = str(id_registro_afectado)[:100]
        if ip_origen:
            ip_origen = str(ip_origen)[:45]
        if resultado:
            resultado = str(resultado)[:20]

        try:
            activity = Actividad(
                id_usuario=user_uuid,
                nombres_usuario=nombres_usuario,
                tipo_accion=tipo_accion,
                modulo=modulo,
                descripcion=descripcion or "",
                id_registro_afectado=id_registro_afectado,
                ip_origen=ip_origen,
                resultado=resultado,
            )
            db.add(activity)
            db.commit()
            db.refresh(activity)
            return activity
        except Exception as e:
            db.rollback()
            print(f"Error grabando auditoría: {e}")
            return None

    @staticmethod
    def create_notification(
        db: Session,
        titulo: str,
        descripcion: str,
        tipo: str,
        id_usuario = None,
    ) -> Notificacion:
        """Crea una notificación"""
        user_uuid = AuditService._coerce_uuid(id_usuario)
        notification = Notificacion(
            id_usuario=user_uuid,
            titulo=titulo,
            descripcion=descripcion,
            tipo=tipo,
            leido=False,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
