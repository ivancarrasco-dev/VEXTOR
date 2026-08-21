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
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        profile: str = "driving",
    ) -> dict:
        """
        Calcula una ruta entre dos puntos.
        
        Retorna:
            - distance: distancia en metros
            - duration: duración en segundos
            - geometry: GeoJSON LineString
            - instructions: instrucciones de navegación
        """
        try:
            route = self.client.route(
                origin_lat,
                origin_lng,
                destination_lat,
                destination_lng,
                profile,
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
