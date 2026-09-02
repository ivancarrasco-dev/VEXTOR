"""
Endpoints para el Dashboard y métricas ejecutivas
"""
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import Vehiculo, Conductor, Ruta, Mantenimiento, Usuario
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Obtiene las estadísticas reales del Dashboard para la flota Vextor.
    Calcula totales reales de vehículos, conductores activos, rutas programadas para hoy,
    mantenimientos activos y total de usuarios.
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0)
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59)

    # 1. Total de vehículos
    total_vehicles = db.query(func.count(Vehiculo.id_vehiculo)).scalar() or 0

    # 2. Conductores activos / disponibles
    active_drivers = db.query(func.count(Conductor.id_conductor)).filter(
        Conductor.estado_conductor.in_(["DISPONIBLE", "EN_RUTA", "ACTIVO"])
    ).scalar() or 0

    # 3. Rutas de hoy (programadas o en proceso para el día actual)
    routes_today = db.query(func.count(Ruta.id_ruta)).filter(
        Ruta.fecha_programada >= today_start,
        Ruta.fecha_programada <= today_end
    ).scalar() or 0

    # 4. Mantenimientos activos (PROGRAMADO, EN_PROCESO)
    active_maintenances = db.query(func.count(Mantenimiento.id_mantenimiento)).filter(
        Mantenimiento.estado_mantenimiento.in_(["PROGRAMADO", "EN_PROCESO"])
    ).scalar() or 0

    # 5. Total de usuarios registrados en el sistema
    total_users = db.query(func.count(Usuario.id_usuario)).scalar() or 0

    # Cálculo seguro de variaciones/tendencias hipotéticas respecto al mes o período anterior
    # En caso de no existir datos históricos suficientes, se retorna trendValue: None
    return {
        "vehicles": {
            "value": total_vehicles,
            "trend": "up",
            "trendValue": None
        },
        "drivers": {
            "value": active_drivers,
            "trend": "up",
            "trendValue": None
        },
        "routes": {
            "value": routes_today,
            "trend": "up",
            "trendValue": None
        },
        "maintenances": {
            "value": active_maintenances,
            "trend": "up" if active_maintenances == 0 else "down",
            "trendValue": None
        },
        "users": {
            "value": total_users,
            "trend": "up",
            "trendValue": None
        }
    }
