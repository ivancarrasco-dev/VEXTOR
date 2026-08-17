"""API de routing de VEXTOR: adapta OSRM para el frontend sin exponer su URL."""

from fastapi import APIRouter, HTTPException, status

import schemas
from services.osrm_client import (
    OsrmClient,
    OsrmConfigurationError,
    OsrmRouteError,
    OsrmUnavailableError,
)


router = APIRouter(prefix="/api/routing", tags=["Routing"])


def _format_instruction(step: dict) -> str:
    """Genera una indicación breve con los datos abiertos de OSRM."""
    maneuver = step.get("maneuver") or {}
    maneuver_type = maneuver.get("type", "continue")
    modifier = maneuver.get("modifier")
    street_name = step.get("name") or "la vía indicada"

    labels = {
        "depart": "Inicia",
        "arrive": "Llegaste al destino",
        "turn": "Gira",
        "continue": "Continúa",
        "new name": "Continúa",
        "merge": "Incorpórate",
        "on ramp": "Toma la entrada",
        "off ramp": "Toma la salida",
        "roundabout": "En la rotonda continúa",
        "rotary": "En la rotonda continúa",
        "fork": "Toma la bifurcación",
        "end of road": "Al final de la vía gira",
        "notification": "Continúa",
    }
    instruction = labels.get(maneuver_type, "Continúa")
    if modifier and maneuver_type not in {"arrive", "depart"}:
        instruction = f"{instruction} hacia {modifier}"

    if maneuver_type == "arrive":
        return instruction
    return f"{instruction} por {street_name}"


@router.get("/health", response_model=schemas.RoutingHealth)
def get_routing_health():
    """Estado de la conexión backend -> OSRM para diagnóstico local."""
    try:
        payload = OsrmClient().health()
    except OsrmConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except (OsrmUnavailableError, OsrmRouteError) as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if payload.get("code") != "Ok":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=payload.get("message") or "OSRM no está disponible.",
        )
    return schemas.RoutingHealth(status="available")


@router.post("/route", response_model=schemas.RoutingRouteResponse)
def calculate_route(request: schemas.RoutingRouteRequest):
    """Calcula una ruta real en OSRM y devuelve una respuesta estable para VEXTOR."""
    try:
        route = OsrmClient().route(
            origin_lat=request.origin.lat,
            origin_lng=request.origin.lng,
            destination_lat=request.destination.lat,
            destination_lng=request.destination.lng,
            profile=request.profile,
        )
    except OsrmConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except OsrmUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except OsrmRouteError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    geometry = route.get("geometry") or {}
    coordinates = geometry.get("coordinates")
    if geometry.get("type") != "LineString" or not isinstance(coordinates, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OSRM no devolvió una geometría de ruta válida.",
        )

    steps = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            steps.append(
                schemas.RoutingInstruction(
                    text=_format_instruction(step),
                    distance=round(float(step.get("distance", 0)), 2),
                    duration=round(float(step.get("duration", 0)), 2),
                    type=(step.get("maneuver") or {}).get("type", "continue"),
                )
            )

    return schemas.RoutingRouteResponse(
        distance=round(float(route.get("distance", 0)), 2),
        duration=round(float(route.get("duration", 0)), 2),
        geometry=schemas.RoutingGeometry(type="LineString", coordinates=coordinates),
        instructions=steps,
    )
