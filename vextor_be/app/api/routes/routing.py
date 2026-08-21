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
    """Calcula una ruta entre dos puntos"""
    try:
        route = osrm_service.calculate_route(
            origin_lat=req.origin.lat,
            origin_lng=req.origin.lng,
            destination_lat=req.destination.lat,
            destination_lng=req.destination.lng,
            profile=req.profile,
        )
        
        # Convertir formato OSRM al schema esperado
        instructions = []
        if "legs" in route:
            for leg in route["legs"]:
                for step in leg.get("steps", []):
                    for instruction in step.get("intersections", []):
                        instructions.append({
                            "text": step.get("maneuver", {}).get("instruction", ""),
                            "distance": step.get("distance", 0),
                            "duration": step.get("duration", 0),
                            "type": step.get("maneuver", {}).get("type", ""),
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
