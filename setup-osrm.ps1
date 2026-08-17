$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       VEXTOR - INSTALADOR DE OSRM" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# 1. Verificar Docker
# --------------------------------------------------

Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow

try {
    docker info | Out-Null
}
catch {
    Write-Host ""
    Write-Host "ERROR: Docker Desktop no esta ejecutandose." -ForegroundColor Red
    Write-Host "Abre Docker Desktop y vuelve a ejecutar este script." -ForegroundColor Red
    exit 1
}

Write-Host "Docker esta funcionando." -ForegroundColor Green


# --------------------------------------------------
# 2. Preparar directorios
# --------------------------------------------------

Write-Host ""
Write-Host "[2/6] Preparando directorios..." -ForegroundColor Yellow

$OsrmDir = Join-Path $PSScriptRoot "infra\osrm"
$DataDir = Join-Path $OsrmDir "data"

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

Write-Host "Directorio OSRM listo." -ForegroundColor Green


# --------------------------------------------------
# 3. Descargar mapa de Colombia
# --------------------------------------------------

$PbfFile = Join-Path $DataDir "colombia-latest.osm.pbf"

if (Test-Path $PbfFile) {

    $sizeMB = [math]::Round(
        (Get-Item $PbfFile).Length / 1MB,
        2
    )

    Write-Host ""
    Write-Host "[3/6] Ya existe el mapa de Colombia ($sizeMB MB)." -ForegroundColor Green
    Write-Host "No se volvera a descargar." -ForegroundColor DarkGray

}
else {

    Write-Host ""
    Write-Host "[3/6] Descargando datos de Colombia..." -ForegroundColor Yellow
    Write-Host "Esto puede tardar dependiendo de tu internet." -ForegroundColor DarkGray
    Write-Host ""

    $url = "https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"

    curl.exe -L `
        -o $PbfFile `
        $url

    if (-not (Test-Path $PbfFile)) {
        Write-Host ""
        Write-Host "ERROR: No se pudo descargar Colombia." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Mapa descargado correctamente." -ForegroundColor Green
}


# --------------------------------------------------
# 4. Verificar si OSRM ya fue procesado
# --------------------------------------------------

$OsrmProperties = Join-Path $DataDir "colombia-latest.osrm.properties"

if (Test-Path $OsrmProperties) {

    Write-Host ""
    Write-Host "[4/6] Los datos OSRM ya estan procesados." -ForegroundColor Green
    Write-Host "Se reutilizaran los datos existentes." -ForegroundColor DarkGray

}
else {

    Write-Host ""
    Write-Host "[4/6] Preparando grafo OSRM..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Esta parte puede tardar varios minutos." -ForegroundColor DarkGray
    Write-Host "NO cierres Docker Desktop ni esta consola." -ForegroundColor DarkYellow
    Write-Host ""

    docker compose `
        -f "$OsrmDir\docker-compose.yml" `
        --profile tools `
        run --rm osrm-tools `
        osrm-extract `
        -p /opt/car.lua `
        /data/colombia-latest.osm.pbf

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR durante osrm-extract." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Extract completado." -ForegroundColor Green


    # --------------------------------------------------
    # 5. Partition
    # --------------------------------------------------

    Write-Host ""
    Write-Host "[5/6] Ejecutando OSRM partition..." -ForegroundColor Yellow

    docker compose `
        -f "$OsrmDir\docker-compose.yml" `
        --profile tools `
        run --rm osrm-tools `
        osrm-partition `
        /data/colombia-latest.osrm

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR durante osrm-partition." -ForegroundColor Red
        exit 1
    }

    Write-Host "Partition completado." -ForegroundColor Green


    # --------------------------------------------------
    # 6. Customize
    # --------------------------------------------------

    Write-Host ""
    Write-Host "[6/6] Ejecutando OSRM customize..." -ForegroundColor Yellow

    docker compose `
        -f "$OsrmDir\docker-compose.yml" `
        --profile tools `
        run --rm osrm-tools `
        osrm-customize `
        /data/colombia-latest.osrm

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR durante osrm-customize." -ForegroundColor Red
        exit 1
    }

    Write-Host "Customize completado." -ForegroundColor Green
}


# --------------------------------------------------
# Levantar OSRM
# --------------------------------------------------

Write-Host ""
Write-Host "Iniciando servidor OSRM..." -ForegroundColor Yellow

docker compose `
    -f "$OsrmDir\docker-compose.yml" `
    up -d osrm

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: No se pudo iniciar OSRM." -ForegroundColor Red
    exit 1
}


# --------------------------------------------------
# Esperar servidor
# --------------------------------------------------

Write-Host ""
Write-Host "Esperando a que OSRM este disponible..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {

    Start-Sleep -Seconds 2
    $attempt++

    try {

        $response = Invoke-WebRequest `
            -Uri "http://localhost:5000/route/v1/driving/-74.0721,4.7110;-75.5812,6.2442?overview=false" `
            -UseBasicParsing `
            -TimeoutSec 5

        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }

    }
    catch {
        Write-Host "." -NoNewline
    }
}


# --------------------------------------------------
# Resultado
# --------------------------------------------------

Write-Host ""
Write-Host ""

if ($healthy) {

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "       OSRM DE VEXTOR ESTA LISTO" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "OSRM:     http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Ruta API: http://localhost:5000/route/v1/driving/..." -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Puedes iniciar VEXTOR normalmente." -ForegroundColor Green

}
else {

    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "       OSRM NO RESPONDE TODAVIA" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""

    Write-Host "Revisa el contenedor con:" -ForegroundColor Yellow
    Write-Host "docker compose -f infra\osrm\docker-compose.yml ps"
    Write-Host ""

    Write-Host "Y los logs con:" -ForegroundColor Yellow
    Write-Host "docker compose -f infra\osrm\docker-compose.yml logs osrm"
}