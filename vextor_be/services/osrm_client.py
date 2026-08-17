"""Cliente HTTP aislado para la instancia propia de OSRM."""

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


class OsrmConfigurationError(Exception):
    """La URL configurada para OSRM no es utilizable."""


class OsrmUnavailableError(Exception):
    """La instancia OSRM no respondió a tiempo o no es alcanzable."""


class OsrmRouteError(Exception):
    """OSRM respondió, pero no pudo calcular la ruta solicitada."""


@dataclass(frozen=True)
class OsrmSettings:
    base_url: str
    timeout_seconds: float

    @classmethod
    def from_environment(cls) -> "OsrmSettings":
        base_url = os.getenv("OSRM_URL", "http://localhost:5000").rstrip("/")
        parsed = urlparse(base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise OsrmConfigurationError("OSRM_URL debe ser una URL HTTP(S) válida.")

        try:
            timeout_seconds = float(os.getenv("OSRM_TIMEOUT_SECONDS", "10"))
        except ValueError as exc:
            raise OsrmConfigurationError("OSRM_TIMEOUT_SECONDS debe ser numérico.") from exc

        if not 1 <= timeout_seconds <= 60:
            raise OsrmConfigurationError("OSRM_TIMEOUT_SECONDS debe estar entre 1 y 60 segundos.")

        return cls(base_url=base_url, timeout_seconds=timeout_seconds)


class OsrmClient:
    """Encapsula el contrato de la API HTTP de OSRM Route Service."""

    def __init__(self, settings: OsrmSettings | None = None):
        self.settings = settings or OsrmSettings.from_environment()

    def route(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        profile: str,
    ) -> dict[str, Any]:
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
        """Comprueba OSRM con un punto por defecto en Bogotá sin exponer su URL al cliente."""
        coordinates = os.getenv("OSRM_HEALTHCHECK_COORDINATES", "-74.0721,4.7110")
        return self._get(f"/nearest/v1/driving/{coordinates}?number=1")

    def _get(self, path: str) -> dict[str, Any]:
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
