"""Cliente HTTP aislado para la instancia propia de OSRM."""

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from app.core.config import settings
from app.core.exceptions import OsrmError


class OsrmConfigurationError(OsrmError):
    """La URL configurada para OSRM no es utilizable."""


class OsrmUnavailableError(OsrmError):
    """La instancia OSRM no respondió a tiempo o no es alcanzable."""


class OsrmRouteError(OsrmError):
    """OSRM respondió, pero no pudo calcular la ruta solicitada."""


@dataclass(frozen=True)
class OsrmSettings:
    base_url: str
    timeout_seconds: float

    @classmethod
    def from_config(cls) -> "OsrmSettings":
        """Crea OsrmSettings desde la configuración central"""
        base_url = settings.OSRM_URL
        parsed = urlparse(base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise OsrmConfigurationError("OSRM_URL debe ser una URL HTTP(S) válida.")

        timeout_seconds = settings.OSRM_TIMEOUT_SECONDS
        if not 1 <= timeout_seconds <= 60:
            raise OsrmConfigurationError("OSRM_TIMEOUT_SECONDS debe estar entre 1 y 60 segundos.")

        return cls(base_url=base_url, timeout_seconds=timeout_seconds)


class OsrmClient:
    """Encapsula el contrato de la API HTTP de OSRM Route Service."""

    def __init__(self, osrm_settings: OsrmSettings | None = None):
        self.settings = osrm_settings or OsrmSettings.from_config()

    def route(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        profile: str = "driving",
    ) -> dict[str, Any]:
        """Calcula una ruta entre dos puntos"""
        coordinates = f"{origin_lng},{origin_lat};{destination_lng},{destination_lat}"
        query = urlencode(
            {
                "overview": "full",
                "steps": "true",
                "geometries": "geojson",
                "alternatives": "false",
            }
        )
        payload = self._get(f"/route/v1/{profile}/{coordinates}?{query}")

        if payload.get("code") != "Ok" or not payload.get("routes"):
            message = payload.get("message") or "OSRM no encontró una ruta para los puntos indicados."
            raise OsrmRouteError(message)

        return payload["routes"][0]

    def health(self) -> dict[str, Any]:
        """Comprueba que OSRM esté disponible"""
        coordinates = settings.OSRM_HEALTHCHECK_COORDINATES
        return self._get(f"/nearest/v1/driving/{coordinates}?number=1")

    def _get(self, path: str) -> dict[str, Any]:
        """Realiza una petición GET a OSRM"""
        request = Request(
            f"{self.settings.base_url}{path}",
            headers={"Accept": "application/json", "User-Agent": "VEXTOR/1.0"},
            method="GET",
        )
        try:
            with urlopen(request, timeout=self.settings.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                payload = json.loads(exc.read().decode("utf-8"))
                message = payload.get("message") or "OSRM rechazó la solicitud."
            except (UnicodeDecodeError, json.JSONDecodeError):
                message = "OSRM rechazó la solicitud."
            raise OsrmRouteError(message) from exc
        except (URLError, TimeoutError, OSError) as exc:
            raise OsrmUnavailableError("No fue posible conectar con la instancia OSRM configurada.") from exc
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise OsrmUnavailableError("La instancia OSRM respondió con un formato inválido.") from exc

        if not isinstance(payload, dict):
            raise OsrmUnavailableError("La instancia OSRM respondió con un formato inválido.")
        return payload
