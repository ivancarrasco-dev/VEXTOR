"""
Servicio de OSRM
Orquesta el cliente de OSRM y proporciona lógica de negocio
"""
from app.external.osrm_client import OsrmClient, OsrmSettings
from app.core.exceptions import OsrmError


class OsrmService:
    """Servicio de integración con OSRM"""

    def __init__(self):
        self.client = OsrmClient()

    def calculate_route(
        self,
        origin_lat: float | None = None,
        origin_lng: float | None = None,
        destination_lat: float | None = None,
        destination_lng: float | None = None,
        waypoints: list[tuple[float, float]] | None = None,
        profile: str = "driving",
    ) -> dict:
        """
        Calcula una ruta entre dos o más puntos.
        
        Retorna la estructura de la ruta de OSRM (distance, duration, geometry, legs).
        """
        try:
            route = self.client.route(
                origin_lat=origin_lat,
                origin_lng=origin_lng,
                destination_lat=destination_lat,
                destination_lng=destination_lng,
                waypoints=waypoints,
                profile=profile,
            )
            return route
        except OsrmError as e:
            raise OsrmError(f"Error calculando ruta: {str(e)}")

    def health_check(self) -> bool:
        """Verifica que OSRM esté disponible"""
        try:
            result = self.client.health()
            return result.get("code") == "Ok"
        except OsrmError:
            return False
