"""
Servicio de OSRM
Orquesta el cliente de OSRM y proporciona lógica de negocio
"""
import time
from typing import Any
from app.external.osrm_client import OsrmClient, OsrmSettings
from app.core.exceptions import OsrmError


class OsrmService:
    """Servicio de integración con OSRM con caché TTL en memoria"""

    def __init__(self, ttl_seconds: int = 300, max_cache_size: int = 500):
        self.client = OsrmClient()
        self.ttl_seconds = ttl_seconds
        self.max_cache_size = max_cache_size
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def _make_cache_key(
        self,
        origin_lat: float | None,
        origin_lng: float | None,
        destination_lat: float | None,
        destination_lng: float | None,
        waypoints: list[tuple[float, float]] | None,
        profile: str,
    ) -> str:
        if waypoints:
            formatted_wps = ",".join(f"{round(lat, 5)}:{round(lng, 5)}" for lat, lng in waypoints)
            return f"{profile}|wps:{formatted_wps}"
        o_lat = round(origin_lat, 5) if origin_lat is not None else "none"
        o_lng = round(origin_lng, 5) if origin_lng is not None else "none"
        d_lat = round(destination_lat, 5) if destination_lat is not None else "none"
        d_lng = round(destination_lng, 5) if destination_lng is not None else "none"
        return f"{profile}|o:{o_lat},{o_lng}|d:{d_lat},{d_lng}"

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
        Calcula una ruta entre dos o más puntos con soporte de caché TTL en memoria.
        
        Retorna la estructura de la ruta de OSRM (distance, duration, geometry, legs).
        """
        cache_key = self._make_cache_key(
            origin_lat, origin_lng, destination_lat, destination_lng, waypoints, profile
        )
        now = time.time()

        if cache_key in self._cache:
            timestamp, cached_route = self._cache[cache_key]
            if now - timestamp < self.ttl_seconds:
                return cached_route
            else:
                del self._cache[cache_key]

        try:
            route = self.client.route(
                origin_lat=origin_lat,
                origin_lng=origin_lng,
                destination_lat=destination_lat,
                destination_lng=destination_lng,
                waypoints=waypoints,
                profile=profile,
            )

            if len(self._cache) >= self.max_cache_size:
                oldest_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k][0])[: self.max_cache_size // 2]
                for k in oldest_keys:
                    self._cache.pop(k, None)

            self._cache[cache_key] = (now, route)
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
