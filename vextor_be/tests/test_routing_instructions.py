from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.api.routes.routing import _generate_instruction_text

client = TestClient(app)

def test_generate_instruction_text_variations():
    assert _generate_instruction_text("depart", "", "Calle 100") == "Inicia el recorrido por Calle 100"
    assert _generate_instruction_text("depart", "", "") == "Inicia el recorrido"
    assert _generate_instruction_text("turn", "right", "Avenida Caracas") == "Gira a la derecha por Avenida Caracas"
    assert _generate_instruction_text("turn", "left", "Carrera 15") == "Gira a la izquierda por Carrera 15"
    assert _generate_instruction_text("continue", "straight", "Autopista Norte") == "Continúa de frente por Autopista Norte"
    assert _generate_instruction_text("roundabout", "right", "Glorieta Calle 80", 2) == "En la rotonda, toma la salida 2 hacia Glorieta Calle 80"
    assert _generate_instruction_text("arrive", "", "Portal Norte") == "Has llegado a tu destino en Portal Norte"


@patch("app.api.routes.routing.osrm_service.calculate_route")
def test_calculate_route_endpoint_formats_instructions(mock_calculate):
    mock_calculate.return_value = {
        "distance": 1500.0,
        "duration": 180.0,
        "geometry": {"type": "LineString", "coordinates": [[-74.05, 4.65], [-74.06, 4.66]]},
        "legs": [
            {
                "steps": [
                    {
                        "name": "Calle 26",
                        "distance": 500.0,
                        "duration": 60.0,
                        "maneuver": {"type": "depart", "modifier": ""}
                    },
                    {
                        "name": "Avenida Carrera 30",
                        "distance": 1000.0,
                        "duration": 120.0,
                        "maneuver": {"type": "turn", "modifier": "right"}
                    }
                ]
            }
        ]
    }

    res = client.post(
        "/api/routing/route",
        json={
            "origin": {"lat": 4.65, "lng": -74.05},
            "destination": {"lat": 4.66, "lng": -74.06},
            "profile": "driving"
        }
    )

    assert res.status_code == 200
    data = res.json()
    assert data["distance"] == 1500.0
    assert len(data["instructions"]) == 2
    assert data["instructions"][0]["text"] == "Inicia el recorrido por Calle 26"
    assert data["instructions"][1]["text"] == "Gira a la derecha por Avenida Carrera 30"
