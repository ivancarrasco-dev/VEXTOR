import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from router_auth import get_current_user

router = APIRouter(tags=["Activities and Notifications"])

# Helper function to record activity
def record_activity(
    db: Session,
    user_id: Optional[uuid.UUID],
    nombres_usuario: Optional[str],
    tipo_accion: str,
    modulo: str,
    descripcion: str,
    id_registro_afectado: Optional[str] = None,
    ip_origen: Optional[str] = None,
    resultado: str = "EXITOSO"
):
    try:
        new_activity = models.Actividad(
            id_actividad=uuid.uuid4(),
            id_usuario=user_id,
            nombres_usuario=nombres_usuario,
            tipo_accion=tipo_accion,
            modulo=modulo,
            descripcion=descripcion,
            fecha_hora=datetime.now(),
            id_registro_afectado=id_registro_afectado,
            ip_origen=ip_origen,
            resultado=resultado
        )
        db.add(new_activity)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error recording activity: {e}")

# Helper function to create notification
def create_notification(
    db: Session,
    titulo: str,
    descripcion: str,
    tipo: str,
    user_id: Optional[uuid.UUID] = None
):
    try:
        new_notif = models.Notificacion(
            id_notificacion=uuid.uuid4(),
            id_usuario=user_id,
            titulo=titulo,
            descripcion=descripcion,
            fecha_hora=datetime.now(),
            leido=False,
            tipo=tipo
        )
        db.add(new_notif)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error creating notification: {e}")

# Cleanup older activities based on retention days
def cleanup_old_activities(db: Session):
    try:
        company = db.query(models.Empresa).first()
        retention = company.retention_days if (company and company.retention_days) else 30
        limit_date = datetime.now() - timedelta(days=retention)
        db.query(models.Actividad).filter(models.Actividad.fecha_hora < limit_date).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error cleaning up old activities: {e}")

@router.get("/api/activities")
def get_activities(
    search: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    tipo_accion: Optional[str] = None,
    modulo: Optional[str] = None,
    resultado: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    page: Optional[int] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # Run cleanup of old activities first
    cleanup_old_activities(db)

    # Base query
    query = db.query(models.Actividad)

    # Role check: Standard users only see their own activity records
    user_role = current_user.rol.nombre_rol if current_user.rol else ""
    if user_role not in ["Administrador"]:
        query = query.filter(models.Actividad.id_usuario == current_user.id_usuario)
    elif user_id:
        query = query.filter(models.Actividad.id_usuario == user_id)

    # Search filter
    if search and search.strip():
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (models.Actividad.descripcion.ilike(s_term)) |
            (models.Actividad.nombres_usuario.ilike(s_term)) |
            (models.Actividad.tipo_accion.ilike(s_term)) |
            (models.Actividad.modulo.ilike(s_term))
        )

    # Specific filters
    if tipo_accion and tipo_accion != "TODOS":
        query = query.filter(models.Actividad.tipo_accion == tipo_accion)

    if modulo and modulo != "TODOS":
        query = query.filter(models.Actividad.modulo == modulo)

    if resultado and resultado != "TODOS":
        query = query.filter(models.Actividad.resultado == resultado)

    if fecha_inicio:
        try:
            d_start = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(models.Actividad.fecha_hora >= d_start)
        except ValueError:
            pass

    if fecha_fin:
        try:
            d_end = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(models.Actividad.fecha_hora < d_end)
        except ValueError:
            pass

    query = query.order_by(models.Actividad.fecha_hora.desc())

    if page is not None and limit is not None:
        total = query.count()
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        import math
        pages = math.ceil(total / limit) if limit > 0 else 1
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "items": [schemas.Actividad.model_validate(i) for i in items]
        }

    return [schemas.Actividad.model_validate(i) for i in query.all()]

@router.get("/api/notifications", response_model=List[schemas.Notificacion])
def get_notifications(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    return db.query(models.Notificacion).filter(
        (models.Notificacion.id_usuario == current_user.id_usuario) | (models.Notificacion.id_usuario == None)
    ).order_by(models.Notificacion.fecha_hora.desc()).all()

@router.put("/api/notifications/{id_notificacion}/read", response_model=schemas.Notificacion)
def mark_notification_read(id_notificacion: uuid.UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    notif = db.query(models.Notificacion).filter(models.Notificacion.id_notificacion == id_notificacion).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.leido = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/api/notifications/{id_notificacion}/unread", response_model=schemas.Notificacion)
def mark_notification_unread(id_notificacion: uuid.UUID, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    notif = db.query(models.Notificacion).filter(models.Notificacion.id_notificacion == id_notificacion).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.leido = False
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/api/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    notifs = db.query(models.Notificacion).filter(
        (models.Notificacion.id_usuario == current_user.id_usuario) | (models.Notificacion.id_usuario == None)
    ).all()
    for notif in notifs:
        notif.leido = True
    db.commit()
    return {"message": "Todas las notificaciones marcadas como leídas"}

class LogReportRequest(schemas.BaseModel):
    report_name: str
    format: str

@router.post("/api/reports/log")
def log_report_generation(req: LogReportRequest, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "REPORTE",
        "Reportes",
        f"Generó y exportó el reporte '{req.report_name}' en formato {req.format.upper()}.",
        None
    )
    return {"status": "success"}

@router.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    from datetime import datetime, timedelta, date

    now_datetime = datetime.now()
    now_date = now_datetime.date()

    # 1. VEHICLES STATS
    total_vehicles = db.query(models.Vehiculo).filter(models.Vehiculo.estado_vehiculo != "INACTIVO").count()

    seven_days_ago = now_datetime - timedelta(days=7)
    fourteen_days_ago = now_datetime - timedelta(days=14)

    curr_veh_assignments = db.query(models.AsignacionVehiculo.id_vehiculo).filter(
        models.AsignacionVehiculo.fecha_asignacion >= seven_days_ago
    ).distinct().count()

    prev_veh_assignments = db.query(models.AsignacionVehiculo.id_vehiculo).filter(
        models.AsignacionVehiculo.fecha_asignacion >= fourteen_days_ago,
        models.AsignacionVehiculo.fecha_asignacion < seven_days_ago
    ).distinct().count()

    if prev_veh_assignments == 0:
        veh_trend = "up"
        veh_trend_value = None
    else:
        diff = curr_veh_assignments - prev_veh_assignments
        veh_trend_value = round((diff / prev_veh_assignments) * 100)
        veh_trend = "up" if diff >= 0 else "down"

    # 2. DRIVERS STATS
    total_drivers = db.query(models.Conductor).filter(models.Conductor.estado_conductor == "ACTIVO").count()

    thirty_days_ago = now_date - timedelta(days=30)
    sixty_days_ago = now_date - timedelta(days=60)

    prev_drivers_count = db.query(models.Conductor).filter(
        models.Conductor.fecha_ingreso <= thirty_days_ago,
        models.Conductor.estado_conductor == "ACTIVO"
    ).count()

    if prev_drivers_count == 0:
        drv_trend = "up"
        drv_trend_value = None
    else:
        diff = total_drivers - prev_drivers_count
        drv_trend_value = round((diff / prev_drivers_count) * 100)
        drv_trend = "up" if diff >= 0 else "down"

    # 3. ROUTES STATS
    total_routes = db.query(models.Ruta).filter(
        models.Ruta.estado_ruta.in_(["PROGRAMADA", "EN_PROCESO"])
    ).count()

    curr_routes_count = db.query(models.Ruta).filter(
        models.Ruta.fecha_programada >= seven_days_ago
    ).count()

    prev_routes_count = db.query(models.Ruta).filter(
        models.Ruta.fecha_programada >= fourteen_days_ago,
        models.Ruta.fecha_programada < seven_days_ago
    ).count()

    if prev_routes_count == 0:
        rt_trend = "up"
        rt_trend_value = None
    else:
        diff = curr_routes_count - prev_routes_count
        rt_trend_value = round((diff / prev_routes_count) * 100)
        rt_trend = "up" if diff >= 0 else "down"

    # 4. MAINTENANCE STATS
    total_maint = db.query(models.Mantenimiento).filter(
        models.Mantenimiento.estado_mantenimiento.in_(["PROGRAMADO", "EN_PROCESO"])
    ).count()

    curr_maint_count = db.query(models.Mantenimiento).filter(
        models.Mantenimiento.fecha_mantenimiento >= thirty_days_ago
    ).count()

    prev_maint_count = db.query(models.Mantenimiento).filter(
        models.Mantenimiento.fecha_mantenimiento >= sixty_days_ago,
        models.Mantenimiento.fecha_mantenimiento < thirty_days_ago
    ).count()

    if prev_maint_count == 0:
        maint_trend = "up"
        maint_trend_value = None
    else:
        diff = curr_maint_count - prev_maint_count
        maint_trend_value = round((diff / prev_maint_count) * 100)
        maint_trend = "up" if diff >= 0 else "down"

    return {
        "vehicles": {
            "value": total_vehicles,
            "trend": veh_trend,
            "trendValue": veh_trend_value
        },
        "drivers": {
            "value": total_drivers,
            "trend": drv_trend,
            "trendValue": drv_trend_value
        },
        "routes": {
            "value": total_routes,
            "trend": rt_trend,
            "trendValue": rt_trend_value
        },
        "maintenances": {
            "value": total_maint,
            "trend": maint_trend,
            "trendValue": maint_trend_value
        }
    }
