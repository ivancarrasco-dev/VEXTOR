$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       VEXTOR - SETUP & INSTALADOR        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# [1/6] Verificar Docker y Entorno
# --------------------------------------------------
Write-Host "[1/6] Verificando Docker y entorno de contenedores..." -ForegroundColor Yellow

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
    Write-Host " 2. Espera a que el icono de Docker indique 'Docker Desktop is running'." -ForegroundColor White
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
# [2/6] Preparar Variables de Entorno (.env)
# --------------------------------------------------
Write-Host ""
Write-Host "[2/6] Verificando archivo de variables de entorno (.env)..." -ForegroundColor Yellow

$EnvFile = Join-Path $PSScriptRoot ".env"
$EnvExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Host " Se creo el archivo '.env' basado en '.env.example'." -ForegroundColor Green
    } else {
        Write-Host "ERROR: No se encontro '.env.example' para inicializar '.env'." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host " Archivo '.env' detectado. Manteniendo configuracion existente." -ForegroundColor Green
}

# Leer .env para validaciones clave
$envContent = Get-Content $EnvFile -Raw
if ($envContent -match "DATABASE_URL=(.*)") {
    $dbUrl = $Matches[1].Trim()
    if ([string]::IsNullOrWhiteSpace($dbUrl) -or $dbUrl.Contains("tu_password") -or $dbUrl.Contains("tu_ref")) {
        Write-Host " AVISO: DATABASE_URL requiere ser configurada con credenciales reales de Supabase en .env" -ForegroundColor Yellow
    }
}


# --------------------------------------------------
# [3/6] Preparar OSRM Colombia (Inteligente)
# --------------------------------------------------
Write-Host ""
Write-Host "[3/6] Preparando datos de mapas de OSRM Colombia..." -ForegroundColor Yellow

$OsrmDir = Join-Path $PSScriptRoot "infra\osrm"
$DataDir = Join-Path $OsrmDir "data"

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
}

$PbfFile = Join-Path $DataDir "colombia-latest.osm.pbf"
$sizeMB = 0

if (Test-Path $PbfFile) {
    $sizeMB = [math]::Round((Get-Item $PbfFile).Length / 1MB, 2)
    Write-Host " Archivo 'colombia-latest.osm.pbf' detectado ($sizeMB MB)." -ForegroundColor Green
} else {
    Write-Host " Descargando datos geograficos de Colombia desde Geofabrik..." -ForegroundColor Yellow
    Write-Host " Esto puede tardar un par de minutos segun tu velocidad de internet." -ForegroundColor DarkGray

    $url = "https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
    curl.exe -L -o $PbfFile $url

    if (-not (Test-Path $PbfFile) -or (Get-Item $PbfFile).Length -lt 10000) {
        Write-Host "ERROR: Fallo la descarga de colombia-latest.osm.pbf." -ForegroundColor Red
        exit 1
    }

    $sizeMB = [math]::Round((Get-Item $PbfFile).Length / 1MB, 2)
    Write-Host " Mapa de Colombia descargado exitosamente ($sizeMB MB)." -ForegroundColor Green
}

# Verificación de los 5 archivos binarios del Grafo OSRM MLD
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

if ($MissingFiles.Count -eq 0) {
    Write-Host " Grafo OSRM procesado e integro. Reutilizando datos MLD existentes." -ForegroundColor Green
} else {
    Write-Host " Grafo OSRM no procesado o incompleto. Archivos faltantes: $($MissingFiles -join ', ')" -ForegroundColor Yellow
    Write-Host " Iniciando Pipeline OSRM MLD (Extract -> Partition -> Customize) mediante Docker..." -ForegroundColor Cyan
    Write-Host " Este proceso puede demorar entre 3 y 8 minutos segun la CPU." -ForegroundColor DarkYellow

    Write-Host " [1/3] Ejecutando osrm-extract..." -ForegroundColor Yellow
    docker compose run --rm osrm-tools osrm-extract -p /opt/car.lua /data/colombia-latest.osm.pbf
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en osrm-extract." -ForegroundColor Red; exit 1 }

    Write-Host " [2/3] Ejecutando osrm-partition..." -ForegroundColor Yellow
    docker compose run --rm osrm-tools osrm-partition /data/colombia-latest.osrm
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en osrm-partition." -ForegroundColor Red; exit 1 }

    Write-Host " [3/3] Ejecutando osrm-customize..." -ForegroundColor Yellow
    docker compose run --rm osrm-tools osrm-customize /data/colombia-latest.osrm
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en osrm-customize." -ForegroundColor Red; exit 1 }

    Write-Host " Grafo OSRM procesado exitosamente." -ForegroundColor Green
}


# --------------------------------------------------
# [4/6] Construir e Iniciar Contenedores Docker
# --------------------------------------------------
Write-Host ""
Write-Host "[4/6] Construyendo e iniciando contenedores de VEXTOR..." -ForegroundColor Yellow

docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Fallo al levantar los contenedores con 'docker compose up'." -ForegroundColor Red
    Write-Host "Verifica si hay puertos en uso (80, 5000, 8000) o errores en el build." -ForegroundColor Yellow
    exit 1
}

Write-Host " Contenedores iniciados correctamente." -ForegroundColor Green


# --------------------------------------------------
# [5/6] Verificacion de Servicios y Health Checks
# --------------------------------------------------
Write-Host ""
Write-Host "[5/6] Verificando salud de los servicios de VEXTOR..." -ForegroundColor Yellow

$maxAttempts = 30
$osrmHealthy = $false
$backendHealthy = $false
$routingHealth = $false
$frontendHealthy = $false

# 1. Comprobar OSRM Directo
Write-Host " Esperando disponibilidad de OSRM (http://localhost:5000)..." -NoNewline
for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:5000/nearest/v1/driving/-74.0721,4.7110" -UseBasicParsing -TimeoutSec 3
        if ($res.StatusCode -eq 200) {
            $osrmHealthy = $true
            break
        }
    } catch { Write-Host "." -NoNewline }
}
if ($osrmHealthy) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FALLO" -ForegroundColor Red }

# 2. Comprobar Backend FastAPI Root
Write-Host " Esperando disponibilidad del Backend FastAPI (http://localhost:8000)..." -NoNewline
for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 3
        if ($res.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch { Write-Host "." -NoNewline }
}
if ($backendHealthy) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FALLO" -ForegroundColor Red }

# 3. Comprobar Backend -> OSRM Routing Health Endpoint
Write-Host " Comprobando integracion Backend -> OSRM (/api/routing/health)..." -NoNewline
try {
    $res = Invoke-WebRequest -Uri "http://localhost:8000/api/routing/health" -UseBasicParsing -TimeoutSec 5
    if ($res.StatusCode -eq 200) {
        $routingHealth = $true
    }
} catch { }
if ($routingHealth) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FALLO / REVISAR LOGS" -ForegroundColor Yellow }

# 4. Comprobar Frontend React (Nginx)
Write-Host " Esperando disponibilidad del Frontend (http://localhost)..." -NoNewline
for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 3
        if ($res.StatusCode -eq 200) {
            $frontendHealthy = $true
            break
        }
    } catch { Write-Host "." -NoNewline }
}
if ($frontendHealthy) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FALLO" -ForegroundColor Red }


# --------------------------------------------------
# [6/6] Resumen Final de Despliegue
# --------------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       VEXTOR DESPLEGADO Y LISTO          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Frontend (React / Nginx) : http://localhost" -ForegroundColor White
Write-Host " Backend API (FastAPI)    : http://localhost:8000" -ForegroundColor White
Write-Host " Documentacion Swagger    : http://localhost:8000/docs" -ForegroundColor White
Write-Host " Servidor OSRM Local      : http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Estado de Servicios:" -ForegroundColor Yellow
Write-Host "  OSRM Routing Engine     : $(if ($osrmHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($osrmHealthy) { 'Green' } else { 'Red' })
Write-Host "  FastAPI Backend         : $(if ($backendHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($backendHealthy) { 'Green' } else { 'Red' })
Write-Host "  Backend -> OSRM Routing : $(if ($routingHealth) { 'CONECTADO [OK]' } else { 'NO RESPOMDE' })" -ForegroundColor $(if ($routingHealth) { 'Green' } else { 'Yellow' })
Write-Host "  Frontend React Web App  : $(if ($frontendHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($frontendHealthy) { 'Green' } else { 'Red' })
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  Ver logs de la aplicacion : docker compose logs -f" -ForegroundColor White
Write-Host "  Detener VEXTOR            : docker compose down" -ForegroundColor White
Write-Host "  Reiniciar VEXTOR          : docker compose restart" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
