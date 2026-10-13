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
        """Registra una actividad en la auditoría de forma defensiva sin interrumpir la transacción principal"""
        try:
            if isinstance(id_usuario, str):
                try:
                    id_usuario = UUID(id_usuario)
                except ValueError:
                    id_usuario = None

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
        except Exception as e:
            db.rollback()
            print(f"Advertencia: No se pudo registrar la actividad de auditoría: {e}")
            return None

    @staticmethod
    def create_notification(
        db: Session,
        titulo: str,
        descripcion: str,
        tipo: str = "general",
        id_usuario = None,
    ) -> Notificacion:
        """Crea una notificación de forma defensiva reconociendo restricciones de base de datos"""
        try:
            user_uuid = AuditService._coerce_uuid(id_usuario)
            if user_uuid is None:
                from app.models import Usuario, Rol
                from sqlalchemy import func
                admin_user = (
                    db.query(Usuario)
                    .join(Rol)
                    .filter(func.lower(Rol.nombre_rol) == "administrador")
                    .first()
                )
                if admin_user:
                    user_uuid = admin_user.id_usuario
                else:
                    any_user = db.query(Usuario).first()
                    if any_user:
                        user_uuid = any_user.id_usuario

            if user_uuid is None:
                return None

            kwargs = {
                "id_usuario": user_uuid,
                "titulo": titulo,
                "descripcion": descripcion,
                "leido": False,
            }
            if hasattr(Notificacion, "__table__") and "tipo" in Notificacion.__table__.c:
                kwargs["tipo"] = tipo

            notification = Notificacion(**kwargs)
            db.add(notification)
            db.commit()
            db.refresh(notification)
            return notification
        except Exception as e:
            db.rollback()
            print(f"Advertencia: No se pudo crear la notificación: {e}")
            return None
