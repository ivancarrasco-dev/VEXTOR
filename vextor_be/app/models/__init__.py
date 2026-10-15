"""
Modelos ORM - Exporta todos los modelos para que SQLAlchemy los registre
"""
from app.models.user import Rol, Usuario, SesionUsuario
from app.models.vehicle import Vehiculo, Marca, Modelo, DocumentoVehiculo
from app.models.driver import Conductor
from app.models.route import Ruta, RutaDefinicion, Viaje, AsignacionConductor, AsignacionVehiculo, Novedad
from app.models.maintenance import Mantenimiento
from app.models.report import Reporte
from app.models.tracking import SeguimientoRuta, HistorialUbicacion, HistorialUbicacionViaje
from app.models.audit import Actividad, Notificacion, NotificacionEnvio, InspeccionUnidad
from app.models.company import Empresa

__all__ = [
    "Rol",
    "Usuario",
    "SesionUsuario",
    "Vehiculo",
    "Marca",
    "Modelo",
    "DocumentoVehiculo",
    "Conductor",
    "Ruta",
    "RutaDefinicion",
    "Viaje",
    "AsignacionConductor",
    "AsignacionVehiculo",
    "Novedad",
    "Mantenimiento",
    "Reporte",
    "SeguimientoRuta",
    "HistorialUbicacion",
    "HistorialUbicacionViaje",
    "Actividad",
    "Notificacion",
    "NotificacionEnvio",
    "InspeccionUnidad",
    "Empresa",
]
