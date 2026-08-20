# Guía y Documentación de OSRM y Docker en VEXTOR

## 1. Conceptos Fundamentales

### ¿Qué es Docker?
[Docker](https://www.docker.com/) es una plataforma de contenedorización que permite ejecutar aplicaciones dentro de entornos aislados e independientes llamados **contenedores**. Incluye todo lo necesario para que el software se ejecute: código, dependencias, librerías del sistema y configuraciones.

### ¿Por qué VEXTOR utiliza Docker?
VEXTOR utiliza Docker para orquestar toda la plataforma: **Frontend (React + Nginx)**, **Backend (FastAPI)** y **OSRM (Open Source Routing Machine)**.
OSRM requiere un compilado C++ específico de alto rendimiento con dependencias nativas del sistema operativo. Mediante Docker, cualquier integrante del equipo o estudiante del SENA puede levantar la plataforma completa en Windows, Linux o macOS utilizando exactamente las mismas versiones (`ghcr.io/project-osrm/osrm-backend:v26.7.3-debian`) sin necesidad de compilar C++ ni instalar paquetes complejos en su máquina host.

### ¿Qué es OSRM?
[OSRM (Open Source Routing Machine)](https://project-osrm.org/) es un motor de enrutamiento vial de código abierto diseñado para calcular el camino más rápido sobre la red de carreteras de OpenStreetMap. VEXTOR lo utiliza para obtener:
1. **Geometría vial:** Coordenadas `LineString` exactas que siguen las calles reales de Colombia.
2. **Métricas:** Distancia proyectada en metros y tiempo estimado de viaje en segundos.
3. **Indicaciones giro a giro:** Pasos descriptivos ("Gira a la derecha por la Carrera 7", "Continúa por la Autopista Norte").

### ¿Por qué VEXTOR tiene su propio servidor OSRM local?
1. **Independencia y Disponibilidad:** El servidor demo público (`router.project-osrm.org`) no ofrece garantías de disponibilidad, impone límites de tasa de peticiones y puede caerse en cualquier momento.
2. **Privacidad y Control:** Las consultas de rutas de la flota no se comparten con servidores de terceros.
3. **Baja Latencia:** Las peticiones desde el backend local a la instancia OSRM responden en pocos milisegundos.

---

## 2. Arquitectura de Routing vs Base de Datos en Docker

Es fundamental comprender la separación clara entre la infraestructura de enrutamiento y la persistencia de datos en VEXTOR:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FLUJO DE ROUTING (MAPA)                          │
│                                                                             │
│   Frontend React ──► FastAPI (/api/routing/route) ──► OSRM Docker local     │
│   (Port 80)          (Port 8000)                     (http://osrm:5000)     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS Y AUDITORÍA                         │
│                                                                             │
│   FastAPI Backend ───────────────► Supabase PostgreSQL                      │
│   (SQLAlchemy ORM)                 (Base de datos remota / en la nube)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Puntos Clave:**
- **Dentro de Docker Compose:** El backend FastAPI se comunica con OSRM mediante la URL interna del servicio `http://osrm:5000` (definida en `docker-compose.yml`).
- **Desde el Host/Navegador:** OSRM está expuesto en `http://localhost:5000`, Backend en `http://localhost:8000` y Frontend en `http://localhost`.
- **Supabase contiene la Base de Datos PostgreSQL:** Almacena usuarios, vehículos, conductores, historiales, reportes, sesiones y asignación de rutas. OSRM es un servicio totalmente independiente enfocado únicamente en algoritmos de grafos viales.

---

## 3. Estructura de `infra/osrm/` y Generación Local (Opción B)

La carpeta `infra/osrm/` contiene la configuración de Docker y los datos procesados:

```text
infra/osrm/
├── docker-compose.yml       # Definición standalone de servicios OSRM
└── data/                    # Directorio de datos y grafo procesado (Ignorado en Git)
    ├── .gitignore                       # Garantiza que archivos pesados no se suban a GitHub
    ├── colombia-latest.osm.pbf          # Extracto crudo de OpenStreetMap para Colombia
    ├── colombia-latest.osrm              # Grafo de red vial extraído
    ├── colombia-latest.osrm.properties   # Propiedades y metadatos del grafo
    ├── colombia-latest.osrm.cells        # Particiones MLD
    ├── colombia-latest.osrm.partition    # Estructura jerárquica MLD
    └── colombia-latest.osrm.tls          # Tablas de giros y restricciones
```

### ¿Por qué NO se suben a GitHub los datos de Colombia?
- **Opciones de Diseño (Opción B Elegida):** Los datos procesados ocupan gigabytes de espacio. Subirlos a GitHub ralentizaría el repositorio y consumiría límites de almacenamiento.
- **Procesamiento Inteligente Local:** `setup-vextor.ps1` descarga automáticamente `colombia-latest.osm.pbf` de Geofabrik si no existe y ejecuta la pipeline MLD (`osrm-extract`, `osrm-partition`, `osrm-customize`) utilizando Docker.
- **Idempotencia:** Si el archivo PBF y el grafo ya existen en la máquina del desarrollador, el script los reutiliza al instante sin descargar ni procesar de nuevo.

---

## 4. Scripts Automatizados: `setup-vextor.ps1` vs `setup-osrm.ps1`

- **`setup-vextor.ps1` (Instalador Principal):**
  Alista la plataforma VEXTOR completa en un computador nuevo:
  1. Comprueba Docker Engine y Docker Compose.
  2. Inicializa `.env` desde `.env.example`.
  3. Prepara los datos de OSRM (descarga PBF + procesa MLD si hace falta).
  4. Construye y levanta Frontend, Backend y OSRM con `docker compose up -d --build`.
  5. Ejecuta Health Checks en todos los endpoints (`http://localhost`, `http://localhost:8000`, `http://localhost:5000`, `/api/routing/health`).

- **`setup-osrm.ps1` (Instalador Standalone de OSRM):**
  Uso exclusivo si se desea preparar o probar únicamente el servidor de mapas OSRM de forma aislada sin levantar Frontend/Backend.

---

## 5. Comandos Útiles y Gestión de Contenedores

### Ver estado de los contenedores
```powershell
docker compose ps
```

### Ver logs del servidor OSRM en tiempo real
```powershell
docker compose logs -f osrm
```

### Probar el endpoint de routing directamente desde PowerShell
```powershell
Invoke-RestMethod 'http://localhost:5000/route/v1/driving/-74.0721,4.7110;-75.5812,6.2442?overview=false'
```

### Probar la salud de la integración Backend -> OSRM
```powershell
Invoke-RestMethod 'http://localhost:8000/api/routing/health'
```

---

## 6. Solución de Problemas Frecuentes (Troubleshooting)

### Problema 1: "Docker Desktop no está ejecutándose"
- **Solución:** Abre Docker Desktop desde el menú Inicio, espera a que el ícono de la ballena azul esté estático ("Docker Desktop is running") y vuelve a ejecutar `.\setup-vextor.ps1`.

### Problema 2: Conflicto de Puertos (5000 / 8000 / 80)
- **Solución:** Verifica qué aplicación usa el puerto (`netstat -ano | findstr :5000` en Windows) o ajusta los puertos mapeados en `docker-compose.yml`.

### Problema 3: Grafo OSRM corrupto o versión incompatible
- **Solución:** Borra los archivos binarios de `infra/osrm/data/` (conservando `colombia-latest.osm.pbf`) y vuelve a ejecutar `.\setup-vextor.ps1` para forzar la regeneración del grafo OSRM.
