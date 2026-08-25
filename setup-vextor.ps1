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
# [2/6] Preparar y Validar Variables de Entorno (.env)
# --------------------------------------------------
Write-Host ""
Write-Host "[2/6] Verificando y configurando variables de entorno (.env)..." -ForegroundColor Yellow

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
    Write-Host " Archivo '.env' detectado. Validando y actualizando..." -ForegroundColor Green
}

# Parsear .env para validacion y actualizacion
$envMap = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $envMap[$key] = $val
    }
}

# --- VALIDACION DE DATABASE_URL (UNICA VARIABLE CRITICA) ---
if (-not $envMap.ContainsKey("DATABASE_URL") -or [string]::IsNullOrWhiteSpace($envMap["DATABASE_URL"])) {
    Write-Host " ERROR: La variable 'DATABASE_URL' no esta configurada en .env." -ForegroundColor Red
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "         VEXTOR NO ESTA LISTO             " -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "Por favor edita el archivo '.env' en la raiz del proyecto y configura DATABASE_URL con tus credenciales de Supabase o PostgreSQL, luego vuelve a ejecutar .\setup-vextor.ps1" -ForegroundColor Yellow
    exit 1
}

if ($envMap["DATABASE_URL"].Contains("tu_password") -or $envMap["DATABASE_URL"].Contains("reemplaza") -or $envMap["DATABASE_URL"].Contains("change-me")) {
    Write-Host " ERROR: DATABASE_URL aun contiene placeholders. Configurala con credenciales reales." -ForegroundColor Red
    exit 1
}

Write-Host " DATABASE_URL configurada correctamente." -ForegroundColor Green

# --- AUTO-GENERAR JWT_SECRET_KEY SI NO EXISTE O TIENE PLACEHOLDER ---
if (-not $envMap.ContainsKey("JWT_SECRET_KEY") -or [string]::IsNullOrWhiteSpace($envMap["JWT_SECRET_KEY"]) -or $envMap["JWT_SECRET_KEY"].Contains("reemplaza")) {
    Write-Host " Generando JWT_SECRET_KEY aleatorio..." -ForegroundColor Yellow
    $randomBytes = [byte[]]::new(32)
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($randomBytes)
    $jwtSecret = [Convert]::ToBase64String($randomBytes)
    
    # Actualizar en memoria y en el archivo
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match "JWT_SECRET_KEY=") {
        $envContent = $envContent -replace "JWT_SECRET_KEY=.*", "JWT_SECRET_KEY=$jwtSecret"
    } else {
        $envContent += "`nJWT_SECRET_KEY=$jwtSecret"
    }
    Set-Content $EnvFile $envContent
    $envMap["JWT_SECRET_KEY"] = $jwtSecret
    Write-Host " JWT_SECRET_KEY generada y guardada en .env" -ForegroundColor Green
}

# --- AUTO-CONFIGURAR SMTP SI ESTA VACIO O CON PLACEHOLDERS ---
$smtpKeys = @("MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM")
$needsSmtpUpdate = $false
foreach ($key in $smtpKeys) {
    if (-not $envMap.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envMap[$key]) -or $envMap[$key].Contains("tu-") -or $envMap[$key].Contains("reemplaza")) {
        $needsSmtpUpdate = $true
        break
    }
}

if ($needsSmtpUpdate) {
    Write-Host " Configurando SMTP con valores por defecto (deshabilitado)..." -ForegroundColor Yellow
    $envContent = Get-Content $EnvFile -Raw
    
    $smtpDefaults = @{
        "MAIL_HOST" = "smtp.gmail.com"
        "MAIL_PORT" = "587"
        "MAIL_USERNAME" = "disabled@example.com"
        "MAIL_PASSWORD" = "disabled"
        "MAIL_FROM" = "VEXTOR Fleet <noreply@vextor.local>"
    }
    
    foreach ($smtpKey in $smtpDefaults.Keys) {
        $smtpValue = $smtpDefaults[$smtpKey]
        if ($envContent -match "$smtpKey=") {
            $envContent = $envContent -replace "$smtpKey=.*", "$smtpKey=$smtpValue"
        } else {
            $envContent += "`n$smtpKey=$smtpValue"
        }
        $envMap[$smtpKey] = $smtpValue
    }
    Set-Content $EnvFile $envContent
    Write-Host " SMTP configurado con valores por defecto (correos deshabilitados)." -ForegroundColor Green
    Write-Host " Nota: Para habilitar correos, edita .env con credenciales reales de SMTP/Gmail." -ForegroundColor DarkYellow
}

Write-Host " Variables de entorno configuradas correctamente." -ForegroundColor Green


# --------------------------------------------------
# [3/6] Preparar OSRM Colombia (Inteligente e Idempotente)
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
# [5/6] Verificación Determinista de Servicios y Health Checks
# --------------------------------------------------
Write-Host ""
Write-Host "[5/6] Verificando salud de los servicios de VEXTOR..." -ForegroundColor Yellow

$maxAttempts = 30
$osrmHealthy = $false
$backendHealthy = $false
$routingHealth = $false
$frontendHealthy = $false

Write-Host " Esperando disponibilidad de los servicios..." -ForegroundColor Yellow

for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep -Seconds 2

    if (-not $osrmHealthy) {
        try {
            $res = Invoke-WebRequest -Uri "http://localhost:5000/nearest/v1/driving/-74.0721,4.7110" -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -eq 200) { $osrmHealthy = $true }
        } catch {}
    }

    if (-not $backendHealthy) {
        try {
            $res = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -eq 200) { $backendHealthy = $true }
        } catch {}
    }

    if ($backendHealthy -and -not $routingHealth) {
        try {
            $res = Invoke-WebRequest -Uri "http://localhost:8000/api/routing/health" -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -eq 200) { $routingHealth = $true }
        } catch {}
    }

    if (-not $frontendHealthy) {
        try {
            $res = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -eq 200) { $frontendHealthy = $true }
        } catch {}
    }

    if ($osrmHealthy -and $backendHealthy -and $routingHealth -and $frontendHealthy) {
        break
    }
}

Write-Host "  OSRM Routing Engine (5000)     : $(if ($osrmHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($osrmHealthy) { 'Green' } else { 'Red' })
Write-Host "  FastAPI Backend (8000)         : $(if ($backendHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($backendHealthy) { 'Green' } else { 'Red' })
Write-Host "  Backend -> OSRM Routing Health : $(if ($routingHealth) { 'CONECTADO [OK]' } else { 'FALLO' })" -ForegroundColor $(if ($routingHealth) { 'Green' } else { 'Red' })
Write-Host "  Frontend React Web App (80)    : $(if ($frontendHealthy) { 'OPERATIVO [OK]' } else { 'DESCONECTADO' })" -ForegroundColor $(if ($frontendHealthy) { 'Green' } else { 'Red' })

$allHealthy = $osrmHealthy -and $backendHealthy -and $routingHealth -and $frontendHealthy

if (-not $allHealthy) {
    Write-Host ""
    Write-Host "Detalle de fallos detectados:" -ForegroundColor Red
    if (-not $osrmHealthy) {
        Write-Host " - Servidor OSRM no responde en http://localhost:5000. Revisa los logs con: docker compose logs osrm" -ForegroundColor Yellow
    }
    if (-not $backendHealthy) {
        Write-Host " - FastAPI Backend no responde en http://localhost:8000. Revisa los logs con: docker compose logs backend" -ForegroundColor Yellow
    }
    if (-not $routingHealth) {
        Write-Host " - Integracion Backend -> OSRM fallo en http://localhost:8000/api/routing/health. Revisa los logs con: docker compose logs backend" -ForegroundColor Yellow
    }
    if (-not $frontendHealthy) {
        Write-Host " - Frontend React no responde en http://localhost. Revisa los logs con: docker compose logs frontend" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "         VEXTOR NO ESTA LISTO             " -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    exit 1
}


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
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  Ver logs de la aplicacion : docker compose logs -f" -ForegroundColor White
Write-Host "  Detener VEXTOR            : docker compose down" -ForegroundColor White
Write-Host "  Reiniciar VEXTOR          : docker compose restart" -ForegroundColor White
Write-Host ""
Write-Host "Nota sobre correos (SMTP):" -ForegroundColor Yellow
Write-Host "  Actualmente los correos estan deshabilitados (credenciales dummy en .env)." -ForegroundColor DarkYellow
Write-Host "  Para habilitar recuperacion de contrasena y notificaciones, edita .env" -ForegroundColor DarkYellow
Write-Host "  con credenciales reales de Gmail o tu proveedor SMTP preferido." -ForegroundColor DarkYellow
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
exit 0
