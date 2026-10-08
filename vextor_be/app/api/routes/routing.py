"""
Endpoints de Routing / OSRM
Cálculo de rutas y health check
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RoutingRouteRequest, RoutingRouteResponse, RoutingHealth
from app.services.osrm_service import OsrmService
from app.core.exceptions import OsrmError

router = APIRouter(prefix="/api/routing", tags=["Routing"])
osrm_service = OsrmService()


def _generate_instruction_text(
    maneuver_type: str,
    modifier: str,
    street_name: str,
    exit_number: int | None = None,
) -> str:
    """Genera texto descriptivo en español para una indicación de navegación basada en OSRM."""
    modifier_map = {
        "right": "a la derecha",
        "left": "a la izquierda",
        "slight right": "levemente a la derecha",
        "slight left": "levemente a la izquierda",
        "sharp right": "pronunciadamente a la derecha",
        "sharp left": "pronunciadamente a la izquierda",
        "straight": "de frente",
        "uturn": "en U",
    }
    direction = modifier_map.get(modifier, "")

    if maneuver_type == "depart":
        if street_name:
            return f"Inicia el recorrido por {street_name}"
        return "Inicia el recorrido"

    if maneuver_type == "arrive":
        if street_name:
            return f"Has llegado a tu destino en {street_name}"
        return "Has llegado a tu destino"

    if maneuver_type in ("turn", "on ramp", "off ramp", "ramp"):
        if maneuver_type == "on ramp":
            action = f"Toma la rampa {direction}" if direction else "Toma la rampa"
        elif maneuver_type == "off ramp":
            action = f"Toma la salida {direction}" if direction else "Toma la salida"
        elif modifier == "uturn":
            action = "Haz un giro en U"
        else:
            action = f"Gira {direction}" if direction else "Gira"

        if street_name:
            return f"{action} hacia {street_name}" if maneuver_type in ("on ramp", "off ramp") else f"{action} por {street_name}"
        return action

    if maneuver_type in ("continue", "new name", "notification"):
        if modifier in ("slight right", "slight left", "right", "left"):
            action = f"Mantente {direction}"
        else:
            action = "Continúa de frente"

        if street_name:
            return f"{action} por {street_name}"
        return action

    if maneuver_type == "fork":
        if modifier in ("left", "slight left", "sharp left"):
            action = "En la bifurcación, mantente a la izquierda"
        else:
            action = "En la bifurcación, mantente a la derecha"
        if street_name:
            return f"{action} hacia {street_name}"
        return action

    if maneuver_type == "merge":
        if modifier in ("left", "slight left"):
            action = "Incorpórate a la izquierda"
        else:
            action = "Incorpórate a la derecha"
        if street_name:
            return f"{action} en {street_name}"
        return action

    if maneuver_type in ("roundabout", "rotary", "roundabout turn"):
        if exit_number:
            action = f"En la rotonda, toma la salida {exit_number}"
        else:
            action = "Ingresa a la rotonda"
        if street_name:
            return f"{action} hacia {street_name}"
        return action

    if maneuver_type == "end of road":
        if modifier in ("left", "slight left", "sharp left"):
            action = "Al final de la vía, gira a la izquierda"
        elif modifier in ("right", "slight right", "sharp right"):
            action = "Al final de la vía, gira a la derecha"
        else:
            action = "Al final de la vía, continúa"
        if street_name:
            return f"{action} por {street_name}"
        return action

    if direction:
        action = f"Gira {direction}"
        if street_name:
            return f"{action} por {street_name}"
        return action

    if street_name:
        return f"Continúa por {street_name}"

    return "Continúa por la ruta"


@router.get("/health", response_model=RoutingHealth)
def health_check(db: Session = Depends(get_db)):
    """Verifica que OSRM esté disponible"""
    try:
        if osrm_service.health_check():
            return {"status": "available"}
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OSRM no está disponible",
            )
    except OsrmError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OSRM error: {str(e)}",
        )


@router.post("/route", response_model=RoutingRouteResponse)
def calculate_route(req: RoutingRouteRequest, db: Session = Depends(get_db)):
    """Calcula una ruta entre dos o más puntos"""
    try:
        waypoints = []
        if req.waypoints and len(req.waypoints) >= 2:
            waypoints = [(p.lat, p.lng) for p in req.waypoints]
        elif req.origin and req.destination:
            waypoints = [(req.origin.lat, req.origin.lng), (req.destination.lat, req.destination.lng)]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe proporcionar origen y destino o una lista de waypoints.",
            )

        route = osrm_service.calculate_route(
            waypoints=waypoints,
            profile=req.profile,
        )
        
        # Convertir formato OSRM al schema esperado
        instructions = []
        if "legs" in route:
            for leg in route["legs"]:
                for step in leg.get("steps", []):
                    maneuver = step.get("maneuver", {})
                    m_type = maneuver.get("type", "")
                    m_modifier = maneuver.get("modifier", "")
                    m_exit = maneuver.get("exit")
                    street_name = step.get("name", "").strip()
                    distance = step.get("distance", 0)
                    duration = step.get("duration", 0)

                    existing_text = maneuver.get("instruction") or ""
                    if existing_text.strip():
                        text = existing_text.strip()
                    else:
                        text = _generate_instruction_text(m_type, m_modifier, street_name, m_exit)

                    instructions.append({
                        "text": text,
                        "distance": distance,
                        "duration": duration,
                        "type": m_type,
                    })
        
        return {
            "distance": route.get("distance", 0),
            "duration": route.get("duration", 0),
            "geometry": route.get("geometry", {"type": "LineString", "coordinates": []}),
            "instructions": instructions,
        }
    except OsrmError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error calculando ruta: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
