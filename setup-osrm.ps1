$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       VEXTOR - INSTALADOR DE OSRM        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# 1. Verificar Docker e Instalacion
# --------------------------------------------------
Write-Host "[1/7] Verificando Docker y entorno..." -ForegroundColor Yellow

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host ""
    Write-Host "ERROR: Docker no esta instalado en este sistema." -ForegroundColor Red
    Write-Host "Por favor instala Docker Desktop para Windows desde:" -ForegroundColor Red
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    exit 1
}

try {
    docker info | Out-Null
}
catch {
    Write-Host ""
    Write-Host "ERROR: Docker Desktop esta instalado pero el motor (Engine) no esta ejecutandose." -ForegroundColor Red
    Write-Host "Pasos para solucionar:" -ForegroundColor Yellow
    Write-Host " 1. Abre la aplicacion 'Docker Desktop' desde el menu Inicio." -ForegroundColor White
    Write-Host " 2. Espera a que el icono de Docker en la barra de tareas indique 'Docker Desktop is running'." -ForegroundColor White
    Write-Host " 3. Vuelve a ejecutar este script." -ForegroundColor White
    exit 1
}

$composeCheck = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker Compose no esta disponible." -ForegroundColor Red
    Write-Host "Asegurate de tener activado Docker Compose en Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host " Docker Instalado: OK" -ForegroundColor Green
Write-Host " Docker Engine:    Ejecutandose" -ForegroundColor Green
Write-Host " Docker Compose:   OK" -ForegroundColor Green


# --------------------------------------------------
# 2. Preparar directorios
# --------------------------------------------------
Write-Host ""
Write-Host "[2/7] Preparando directorios de infraestructura..." -ForegroundColor Yellow

$OsrmDir = Join-Path $PSScriptRoot "infra\osrm"
$DataDir = Join-Path $OsrmDir "data"

if (-not (Test-Path $OsrmDir)) {
    Write-Host "ERROR: No se encontro el directorio '$OsrmDir'." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
Write-Host " Directorio OSRM listo: $DataDir" -ForegroundColor Green


# --------------------------------------------------
# 3. Descargar mapa de Colombia (.osm.pbf)
# --------------------------------------------------
$PbfFile = Join-Path $DataDir "colombia-latest.osm.pbf"
$sizeMB = 0

if (Test-Path $PbfFile) {
    $sizeMB = [math]::Round((Get-Item $PbfFile).Length / 1MB, 2)
    Write-Host ""
    Write-Host "[3/7] Archivo de datos de Colombia detectado ($sizeMB MB)." -ForegroundColor Green
    Write-Host " Reutilizando 'colombia-latest.osm.pbf' existente." -ForegroundColor DarkGray
}
else {
    Write-Host ""
    Write-Host "[3/7] Descargando datos geograficos de Colombia desde Geofabrik..." -ForegroundColor Yellow
    Write-Host " Esto puede tardar unos minutos segun la velocidad de tu internet." -ForegroundColor DarkGray
    Write-Host ""

    $url = "https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
    curl.exe -L -o $PbfFile $url

    if (-not (Test-Path $PbfFile) -or (Get-Item $PbfFile).Length -lt 10000) {
        Write-Host ""
        Write-Host "ERROR: No se pudo descargar el archivo colombia-latest.osm.pbf correctamente." -ForegroundColor Red
        exit 1
    }

    $sizeMB = [math]::Round((Get-Item $PbfFile).Length / 1MB, 2)
    Write-Host " Mapa de Colombia descargado correctamente ($sizeMB MB)." -ForegroundColor Green
}


# --------------------------------------------------
# 4. Verificar estado del Grafo OSRM
# --------------------------------------------------
Write-Host ""
Write-Host "[4/7] Verificando integridades del grafo OSRM..." -ForegroundColor Yellow

$RequiredFiles = @(
    "colombia-latest.osrm",
    "colombia-latest.osrm.properties",
    "colombia-latest.osrm.cells",
    "colombia-latest.osrm.partition",
    "colombia-latest.osrm.tls"
)

$MissingFiles = @()
foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $DataDir $file
    if (-not (Test-Path $filePath)) {
        $MissingFiles += $file
    }
}

$GraphReady = ($MissingFiles.Count -eq 0)

if ($GraphReady) {
    Write-Host " Grafo OSRM procesado e integro. Reutilizando archivos .osrm.* existentes." -ForegroundColor Green
}
else {
    Write-Host " El grafo OSRM esta incompleto o no ha sido procesado." -ForegroundColor Yellow
    Write-Host " Archivos faltantes detectados: $($MissingFiles -join ', ')" -ForegroundColor DarkGray
    Write-Host " Se iniciara el pipeline completo de procesamiento MLD (Extract -> Partition -> Customize)." -ForegroundColor Cyan
    Write-Host " Este proceso requiere memoria RAM y procesamiento CPU (puede tardar entre 3 y 10 minutos)." -ForegroundColor DarkYellow
    Write-Host ""

    # Pipeline Step 1: Extract
    Write-Host " Ejecutando osrm-extract..." -ForegroundColor Yellow
    docker compose -f "$OsrmDir\docker-compose.yml" --profile tools run --rm osrm-tools osrm-extract -p /opt/car.lua /data/colombia-latest.osm.pbf
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR durante osrm-extract." -ForegroundColor Red
        exit 1
    }
    Write-Host " Extract completado." -ForegroundColor Green

    # Pipeline Step 2: Partition
    Write-Host " Ejecutando osrm-partition..." -ForegroundColor Yellow
    docker compose -f "$OsrmDir\docker-compose.yml" --profile tools run --rm osrm-tools osrm-partition /data/colombia-latest.osrm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR durante osrm-partition." -ForegroundColor Red
        exit 1
    }
    Write-Host " Partition completado." -ForegroundColor Green

    # Pipeline Step 3: Customize
    Write-Host " Ejecutando osrm-customize..." -ForegroundColor Yellow
    docker compose -f "$OsrmDir\docker-compose.yml" --profile tools run --rm osrm-tools osrm-customize /data/colombia-latest.osrm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR durante osrm-customize." -ForegroundColor Red
        exit 1
    }
    Write-Host " Customize completado." -ForegroundColor Green
}


# --------------------------------------------------
# 5. Iniciar Servidor OSRM
# --------------------------------------------------
Write-Host ""
Write-Host "[5/7] Levantando contenedor del servidor OSRM..." -ForegroundColor Yellow

docker compose -f "$OsrmDir\docker-compose.yml" up -d osrm
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo iniciar el contenedor de OSRM." -ForegroundColor Red
    exit 1
}
Write-Host " Contenedor OSRM iniciado exitosamente." -ForegroundColor Green


# --------------------------------------------------
# 6. Esperar disponibilidad del servicio y prueba de ruta
# --------------------------------------------------
Write-Host ""
Write-Host "[6/7] Esperando a que OSRM responda en http://localhost:5000..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$healthy = $false
$testRouteSuccess = $false

$testUrl = "http://localhost:5000/route/v1/driving/-74.0721,4.7110;-75.5812,6.2442?overview=false"

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempt++

    try {
        $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            $json = $response.Content | ConvertFrom-Json
            if ($json.code -eq "Ok" -and $json.routes.Count -gt 0) {
                $testRouteSuccess = $true
            }
            break
        }
    }
    catch {
        Write-Host "." -NoNewline
    }
}

Write-Host ""

# --------------------------------------------------
# 7. Resumen Final
# --------------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     VEXTOR - RESUMEN INSTALACION OSRM    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker Instalado:   OK" -ForegroundColor Green
Write-Host "Docker Engine:      OK" -ForegroundColor Green
Write-Host "Docker Compose:     OK" -ForegroundColor Green
Write-Host "Colombia OSM PBF:   OK ($sizeMB MB)" -ForegroundColor Green
Write-Host "Grafo OSRM (MLD):   OK" -ForegroundColor Green
Write-Host "Contenedor OSRM:    OK (vextor-osrm-osrm-1)" -ForegroundColor Green

if ($healthy -and $testRouteSuccess) {
    Write-Host "Servidor Healthcheck: OK" -ForegroundColor Green
    Write-Host "Prueba Ruta Bogota-Medellin: OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "------------------------------------------" -ForegroundColor Green
    Write-Host " STATUS: OSRM LISTO Y OPERATIVO EN LOCAL  " -ForegroundColor Green
    Write-Host "------------------------------------------" -ForegroundColor Green
    Write-Host ""
    Write-Host " Endpoint OSRM: http://localhost:5000" -ForegroundColor White
    Write-Host " Prueba API:     $testUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Puedes iniciar FastAPI backend y la aplicacion VEXTOR." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Servidor Healthcheck: FALLO O EN ESPERA" -ForegroundColor Red
    Write-Host "Prueba Ruta Bogota-Medellin: NO COMPLETADA" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa el estado del contenedor ejecutando:" -ForegroundColor Yellow
    Write-Host "  docker compose -f infra\osrm\docker-compose.yml ps" -ForegroundColor White
    Write-Host "  docker compose -f infra\osrm\docker-compose.yml logs osrm" -ForegroundColor White
    Write-Host ""
    exit 1
}
