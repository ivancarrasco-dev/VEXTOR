"""
Modelos ORM - Exporta todos los modelos para que SQLAlchemy los registre
"""
from app.models.user import Rol, Usuario, SesionUsuario
from app.models.vehicle import Marca, Modelo, Vehiculo, DocumentoVehiculo, InspeccionUnidad
from app.models.driver import Conductor
from app.models.route import RutaDefinicion, Ruta, Viaje, AsignacionConductor, AsignacionVehiculo, Novedad
from app.models.maintenance import Mantenimiento
from app.models.report import Reporte
from app.models.tracking import SeguimientoRuta, HistorialUbicacionViaje, HistorialUbicacion
from app.models.audit import Actividad, NotificacionEnvio, Notificacion
from app.models.company import Empresa

__all__ = [
    "Rol",
    "Usuario",
    "SesionUsuario",
    "Marca",
    "Modelo",
    "Vehiculo",
    "DocumentoVehiculo",
    "InspeccionUnidad",
    "Conductor",
    "RutaDefinicion",
    "Ruta",
    "Viaje",
    "AsignacionConductor",
    "AsignacionVehiculo",
    "Novedad",
    "Mantenimiento",
    "Reporte",
    "SeguimientoRuta",
    "HistorialUbicacionViaje",
    "HistorialUbicacion",
    "Actividad",
    "NotificacionEnvio",
    "Notificacion",
    "Empresa",
]
