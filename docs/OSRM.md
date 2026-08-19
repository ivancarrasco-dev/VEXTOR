# Guía y Documentación de OSRM y Docker en VEXTOR

## 1. Conceptos Fundamentales

### ¿Qué es Docker?
[Docker](https://www.docker.com/) es una plataforma de contenedorización que permite ejecutar aplicaciones dentro de entornos aislados e independientes llamados **contenedores**. Incluye todo lo necesario para que el software se ejecute: código, dependencias, librerías del sistema y configuraciones.

### ¿Por qué VEXTOR utiliza Docker?
VEXTOR utiliza Docker para levantar **OSRM (Open Source Routing Machine)**. OSRM requiere un compilado C++ específico de alto rendimiento con dependencias nativas del sistema operativo. Mediante Docker, cualquier integrante del equipo puede levantar OSRM en Windows, Linux o macOS utilizando exactamente la misma versión (`ghcr.io/project-osrm/osrm-backend:v26.7.3-debian`) sin necesidad de compilar C++ ni instalar paquetes complejos en su máquina host.

### ¿Qué es OSRM?
[OSRM (Open Source Routing Machine)](https://project-osrm.org/) es un motor de enrutamiento vial de código abierto diseñado para calcular el camino más rápido sobre la red de carreteras de OpenStreetMap. VEXTOR lo utiliza para obtener:
1. **Geometría vial:** Coordenadas `LineString` exactas que siguen las calles reales de Colombia.
2. **Métricas:** Distancia proyectada en metros y tiempo estimado de viaje en segundos.
3. **Indicaciones giro a giro:** Pasos descriptivos ("Gira a la derecha por la Carrera 7", "Continúa por la Autopista Norte").

### ¿Por qué VEXTOR tiene su propio servidor OSRM local (`localhost:5000`)?
1. **Independencia y Disponibilidad:** El servidor demo público (`router.project-osrm.org`) no ofrece garantías de disponibilidad, impone límites de tasa de peticiones y puede caerse en cualquier momento.
2. **Privacidad y Control:** Las consultas de rutas de la flota no se comparten con servidores de terceros.
3. **Baja Latencia:** Las peticiones desde el backend local a `http://localhost:5000` responden en pocos milisegundos.

---

## 2. Arquitectura de Routing vs Base de Datos

Es fundamental comprender la separación clara entre la infraestructura de enrutamiento y la persistencia de datos en VEXTOR:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FLUJO DE ROUTING (MAPA)                          │
│                                                                             │
│   Frontend React ──► FastAPI (/api/routing/route) ──► OSRM Docker local     │
│   (Vite SPA)         (Python 3.12 Backend)           (http://localhost:5000)│
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS Y AUDITORÍA                         │
│                                                                             │
│   FastAPI Backend ───────────────► Supabase PostgreSQL                      │
│   (SQLAlchemy ORM)                 (Base de datos remota / en la nube)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Puntos Clave:**
- **Supabase contiene la Base de Datos PostgreSQL:** Almacena usuarios, vehículos, conductores, historiales, reportes, sesiones y asignación de rutas.
- **OSRM NO está en Supabase:** OSRM es un servicio independiente enfocado únicamente en algoritmos de grafos viales.
- **OSRM corre localmente mediante Docker:** Por este motivo, un desarrollador en un PC nuevo requiere instalar Docker Desktop y ejecutar la preparación de OSRM.
- **No se requiere instalar PostgreSQL localmente:** Si VEXTOR está configurado con la cadena de conexión de Supabase en `DATABASE_URL`, la base de datos ya está disponible en la nube.

---

## 3. Estructura de `infra/osrm/` y Archivos Generados

La carpeta `infra/osrm/` contiene la configuración de Docker y los datos procesados:

```text
infra/osrm/
├── docker-compose.yml       # Definición de servicios Docker (osrm y osrm-tools)
└── data/                    # Directorio de datos y grafo procesado (Ignorado en Git)
    ├── colombia-latest.osm.pbf          # Extracto crudo de OpenStreetMap para Colombia
    ├── colombia-latest.osrm              # Grafo de red vial extraído
    ├── colombia-latest.osrm.properties   # Propiedades y metadatos del grafo
    ├── colombia-latest.osrm.cells        # Particiones MLD
    ├── colombia-latest.osrm.partition    # Estructura jerárquica MLD
    └── colombia-latest.osrm.tls          # Tablas de giros y restricciones
```

### Explicación de los archivos:
- **`colombia-latest.osm.pbf`:** Es el archivo fuente descargado de Geofabrik que contiene la información geográfica abierta de carreteras de Colombia (~150 MB a ~200 MB).
- **Archivos `.osrm.*`:** Son los archivos binarios generados tras procesar el mapa con el algoritmo **MLD (Multi-Level Dijkstra)** (`osrm-extract`, `osrm-partition`, `osrm-customize`).
- **¿Por qué ocupan espacio?** El procesamiento convierte las calles y nodos de todo Colombia en estructuras de datos indexadas en memoria rápida, generando entre 1.5 GB y 3 GB de archivos binarios.
- **¿Por qué NO se suben a GitHub?** Ocupan gigabytes de espacio, son archivos binarios generados derivativamente y pueden ser regenerados automáticamente en cualquier equipo mediante el script `setup-osrm.ps1`. Por ello, están explícitamente incluidos en `.gitignore`.

---

## 4. Funcionamiento del Script `setup-osrm.ps1`

El script `setup-osrm.ps1` ubicado en la raíz del repositorio automatiza y simplifica la configuración de OSRM en cualquier PC con Windows/PowerShell.

### Lo que hace el script paso a paso:
1. **Verificación de Docker:** Comprueba que `docker` esté instalado y que Docker Desktop esté en ejecución (`docker info`). Si no lo está, le indica exactamente qué hacer al usuario.
2. **Verificación de Docker Compose:** Confirma que `docker compose` esté disponible.
3. **Directorio de datos:** Crea la carpeta `infra/osrm/data` si no existe.
4. **Descarga de mapa:** Comprueba si ya existe `colombia-latest.osm.pbf`. Si ya existe, **no lo vuelve a descargar** (idempotente). Si no existe, lo descarga desde Geofabrik.
5. **Verificación de Grafo Integro:** Comprueba la existencia de los múltiples archivos binarios del grafo (`.osrm`, `.properties`, `.cells`, `.partition`, `.tls`).
   - **Primera vez:** Detecta que faltan los archivos del grafo, explica lo que sucederá y ejecuta secuencialmente los tres comandos MLD (`osrm-extract`, `osrm-partition`, `osrm-customize`).
   - **Reejecuciones:** Detecta que el grafo ya está completo e íntegro, omite el procesamiento pesado y procede directamente a levantar el contenedor.
6. **Despliegue del contenedor:** Ejecuta `docker compose up -d osrm`.
7. **Prueba de Salud y Enrutamiento Real:** Realiza peticiones periódicas a `http://localhost:5000` con la ruta Bogotá-Medellín hasta que el servicio responda HTTP 200 OK con un JSON de ruta válido (`code: "Ok"`).
8. **Resumen visual:** Imprime una tabla consolidada del estado del entorno.

---

## 5. Comandos Útiles y Gestión de OSRM

### Verificar estado del contenedor
```powershell
docker compose -f infra/osrm/docker-compose.yml ps
```

### Ver logs del servidor OSRM en tiempo real
```powershell
docker compose -f infra/osrm/docker-compose.yml logs -f osrm
```

### Detener OSRM sin eliminar los datos
```powershell
docker compose -f infra/osrm/docker-compose.yml stop osrm
```

### Volver a iniciar OSRM (cuando los datos ya están procesados)
```powershell
docker compose -f infra/osrm/docker-compose.yml start osrm
```

### Probar el endpoint directamente desde PowerShell
```powershell
Invoke-RestMethod 'http://localhost:5000/route/v1/driving/-74.0721,4.7110;-75.5812,6.2442?overview=false'
```

---

## 6. Solución de Problemas Frecuentes (Troubleshooting)

### Problema 1: "ERROR: Docker Desktop no esta ejecutandose" o `docker info` falla
- **Síntoma:** El script `setup-osrm.ps1` se detiene en el paso 1 indicando error de Docker Engine.
- **Causa:** La aplicación Docker Desktop está cerrada o el motor Docker aún se está iniciando.
- **Solución:** Abre Docker Desktop desde el menú Inicio, espera a que la barra inferior indique "Docker Desktop is running" (ícono ballena azul estático) y vuelve a ejecutar el script.

### Problema 2: "El puerto 5000 está ocupado" (`port is already allocated`)
- **Síntoma:** Docker Compose reporta un conflicto de puertos al intentar levantar `osrm`.
- **Causa:** Otra aplicación (como AirPlay en macOS o un servicio local en Windows) está utilizando el puerto 5000.
- **Solución:**
  1. Para identificar qué proceso usa el puerto en Windows: `netstat -ano | findstr :5000`
  2. Si deseas cambiar el puerto de OSRM en VEXTOR, modifica el mapeo en `infra/osrm/docker-compose.yml` (por ejemplo `"5001:5000"`) y actualiza `OSRM_URL=http://localhost:5001` en `vextor_be/.env`.

### Problema 3: OSRM se detiene al iniciar (`exit 1`)
- **Síntoma:** El contenedor OSRM se crea pero se apaga inmediatamente.
- **Causa:** Los archivos binarios en `infra/osrm/data/` están corruptos, incompletos o fueron procesados con una versión diferente de OSRM.
- **Solución:** Elimina los archivos binarios de `infra/osrm/data/` (conservando `colombia-latest.osm.pbf`) y vuelve a ejecutar `setup-osrm.ps1` para forzar la regeneración del grafo.
