# OSRM propio para VEXTOR

## Propósito y arquitectura

[OSRM (Open Source Routing Machine)](https://project-osrm.org/) calcula recorridos sobre datos de OpenStreetMap. VEXTOR lo usa para obtener geometría vial, distancia, duración e indicaciones de una ruta de vehículos. No construye un motor de rutas propio.

```text
React + Leaflet -> FastAPI (/api/routing/route) -> OSRM local -> datos OSM de Colombia
                         |
                         +-> PostgreSQL: rutas, asignaciones y telemetría

GPS del conductor -> WebSocket /ws/tracking -> FastAPI -> mapa administrativo
```

El navegador nunca conoce la dirección de OSRM: `MapComponent` pide la ruta a FastAPI y solo renderiza el GeoJSON recibido con Leaflet. Esto reemplaza Leaflet Routing Machine para evitar controles imperativos duplicados y el error de desmontaje `removeLayer` asociado.

No se usa `router.project-osrm.org`: es un servidor demo compartido, no una dependencia adecuada para producción ni una garantía de capacidad o disponibilidad.

## Datos y pipeline

El extracto inicial es [`colombia-latest.osm.pbf` de Geofabrik](https://download.geofabrik.de/south-america/colombia.html), que contiene datos abiertos de OpenStreetMap para Colombia. La fuente se descarga bajo demanda y no se versiona en Git.

La configuración utiliza el pipeline MLD recomendado actualmente por el proyecto OSRM: `osrm-extract`, `osrm-partition`, `osrm-customize` y `osrm-routed --algorithm mld`. Es la alternativa moderna a `osrm-contract`; no incorpora tráfico ni datos sintéticos. Los tiempos provienen de los atributos y perfiles de conducción de OSM.

## Requisitos locales

- Docker Desktop con contenedores Linux habilitados y al menos 15 GB libres en SSD.
- Como punto de partida: 4 CPU y 8 GB de RAM disponibles para Docker. Ajusta al alza si habrá varias consultas concurrentes.
- Conexión a Internet solo para descargar la imagen de OSRM y el extracto OSM. La operación normal del routing local no requiere un proveedor de rutas externo.

## Preparar Colombia por primera vez

Desde la raíz del repositorio, en PowerShell:

```powershell
New-Item -ItemType Directory -Force infra/osrm/data
Invoke-WebRequest `
  -Uri 'https://download.geofabrik.de/south-america/colombia-latest.osm.pbf' `
  -OutFile 'infra/osrm/data/colombia-latest.osm.pbf'

docker compose -f infra/osrm/docker-compose.yml run --rm osrm-tools `
  osrm-extract -p /opt/car.lua /data/colombia-latest.osm.pbf
docker compose -f infra/osrm/docker-compose.yml run --rm osrm-tools `
  osrm-partition /data/colombia-latest.osrm
docker compose -f infra/osrm/docker-compose.yml run --rm osrm-tools `
  osrm-customize /data/colombia-latest.osrm
```

El primer procesamiento puede tardar varios minutos y crear varios GB de archivos `colombia-latest.osrm*` en `infra/osrm/data/`. Deben prepararse siempre con la misma versión de imagen con la que se inicia `osrm-routed`.

## Iniciar, detener y actualizar

Inicia OSRM:

```powershell
docker compose -f infra/osrm/docker-compose.yml up -d osrm
```

Comprueba el servidor directamente:

```powershell
Invoke-RestMethod 'http://localhost:5000/nearest/v1/driving/-74.0721,4.7110?number=1'
Invoke-RestMethod 'http://localhost:5000/route/v1/driving/-74.0721,4.7110;-75.5812,6.2442?overview=false'
```

Deténlo sin borrar datos:

```powershell
docker compose -f infra/osrm/docker-compose.yml stop osrm
```

Para actualizar OSM, detén el servicio, sustituye `colombia-latest.osm.pbf`, vuelve a ejecutar los tres comandos del pipeline y levanta `osrm` de nuevo. No borres los archivos procesados mientras el contenedor esté corriendo.

## Configurar VEXTOR

En `vextor_be/.env` (o en el entorno que inicia Uvicorn) configura:

```env
# Desarrollo local: FastAPI se conecta al puerto publicado por Docker.
OSRM_URL=http://localhost:5000
OSRM_TIMEOUT_SECONDS=10
```

En producción `OSRM_URL` debe apuntar a la dirección privada o al nombre DNS interno de la instancia administrada por VEXTOR, por ejemplo `http://osrm:5000`. La variable solo la utiliza el backend en `services/osrm_client.py`; no existe una variable `VITE_*` para OSRM.

`main.py` carga `vextor_be/.env` al arrancar mediante `python-dotenv`; instala o actualiza las dependencias del backend con `python -m pip install -r requirements.txt`. El archivo `.env` está ignorado por Git y no debe contener credenciales en archivos versionados.

`DATABASE_URL` también es obligatoria para iniciar FastAPI. Los archivos `.env.example` solo contienen valores de ejemplo y no incluyen credenciales reutilizables.

Inicia FastAPI y comprueba la integración:

```powershell
cd vextor_be
uvicorn main:app --reload --port 8000

Invoke-RestMethod http://localhost:8000/api/routing/health
Invoke-RestMethod -Method Post http://localhost:8000/api/routing/route `
  -ContentType 'application/json' `
  -Body '{"origin":{"lat":4.7110,"lng":-74.0721},"destination":{"lat":6.2442,"lng":-75.5812},"profile":"driving"}'
```

La respuesta contiene distancia y duración en metros/segundos, geometría `LineString` GeoJSON e indicaciones. La interfaz convierte las unidades solo para mostrarlas.

## Pruebas funcionales

1. Levanta OSRM y espera a que `/api/routing/health` responda `available`.
2. Ejecuta la solicitud Bogotá–Medellín anterior y confirma `distance`, `duration` y `geometry.coordinates`.
3. Inicia frontend y backend, selecciona origen/destino colombianos y comprueba la línea vial, métricas e indicaciones.
4. Inicia/finaliza una ruta como conductor; verifica que GPS y `/ws/tracking` siguen actualizando la posición real, que es independiente de la geometría planificada.
5. Recarga, cambia origen/destino y revisa la consola: ya no debe aparecer `Cannot read properties of null (reading 'removeLayer')` de Leaflet Routing Machine.

## Problemas comunes

- **`503 No fue posible conectar`**: inicia el contenedor, confirma que el puerto 5000 está libre y revisa `docker compose ... logs osrm`.
- **`422 OSRM no encontró una ruta`**: verifica que ambos puntos estén en Colombia y cerca de una vía enrutable; OSRM no puede rutear tramos no conectados.
- **El contenedor sale al iniciar**: faltan archivos `.osrm*` o fueron generados con otra versión. Repite el pipeline con la imagen declarada en `docker-compose.yml`.
- **Memoria insuficiente**: aumenta la memoria asignada a Docker, cierra aplicaciones pesadas y usa SSD para `infra/osrm/data`.
- **Las direcciones no autocompletan**: el autocompletado y la geocodificación inversa actuales siguen usando Nominatim público y son independientes de OSRM.

## Dependencias externas que permanecen

- OpenStreetMap/Geofabrik: descarga periódica de datos.
- Nominatim público: búsqueda y geocodificación de direcciones actual.
- Proveedores de teselas Carto, OpenStreetMap, OpenTopoMap y Esri: representación base del mapa.

Ninguno proporciona el cálculo de rutas de VEXTOR después de esta integración. El tráfico en tiempo real no está implementado ni simulado; requerirá una fuente de datos real y una fase de diseño separada.
