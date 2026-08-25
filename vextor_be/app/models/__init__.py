"""
Modelos ORM - Exporta todos los modelos para que SQLAlchemy los registre
"""
from app.models.user import Rol, Usuario, SesionUsuario
from app.models.vehicle import Vehiculo
from app.models.driver import Conductor
from app.models.route import Ruta, AsignacionConductor, AsignacionVehiculo, Novedad
from app.models.maintenance import Mantenimiento
from app.models.report import Reporte
from app.models.tracking import SeguimientoRuta, HistorialUbicacion
from app.models.audit import Actividad, Notificacion
from app.models.company import Empresa

__all__ = [
    "Rol",
    "Usuario",
    "SesionUsuario",
    "Vehiculo",
    "Conductor",
    "Ruta",
    "AsignacionConductor",
    "AsignacionVehiculo",
    "Novedad",
    "Mantenimiento",
    "Reporte",
    "SeguimientoRuta",
    "HistorialUbicacion",
    "Actividad",
    "Notificacion",
    "Empresa",
]
