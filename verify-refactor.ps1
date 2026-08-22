# Script de verificación completa para VEXTOR Backend
# Uso: .\verify-refactor.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PHASE 5: VERIFICACIÓN COMPLETA DEL BACKEND VEXTOR     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Variables
$vextor_be = Join-Path $PSScriptRoot "vextor_be"
$tests_passed = 0
$tests_failed = 0

function Test-Item {
    param(
        [string]$name,
        [scriptblock]$test
    )
    
    Write-Host "Testing: $name..." -ForegroundColor Cyan -NoNewline
    try {
        $result = & $test
        if ($result) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $global:tests_passed++
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            $global:tests_failed++
        }
    } catch {
        Write-Host " ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $global:tests_failed++
    }
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "1. ESTRUCTURA DE CARPETAS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Test-Item "app/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app")
}

Test-Item "app/core/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "core")
}

Test-Item "app/database/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "database")
}

Test-Item "app/models/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "models")
}

Test-Item "app/schemas/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "schemas")
}

Test-Item "app/services/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "services")
}

Test-Item "app/api/routes/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "api" "routes")
}

Test-Item "app/websocket/ directorio existe" {
    Test-Path (Join-Path $vextor_be "app" "websocket")
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "2. ARCHIVOS PRINCIPALES EXISTEN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Test-Item "app/main.py existe" {
    Test-Path (Join-Path $vextor_be "app" "main.py")
}

Test-Item "app/core/config.py existe" {
    Test-Path (Join-Path $vextor_be "app" "core" "config.py")
}

Test-Item "app/core/security.py existe" {
    Test-Path (Join-Path $vextor_be "app" "core" "security.py")
}

Test-Item "app/database/connection.py existe" {
    Test-Path (Join-Path $vextor_be "app" "database" "connection.py")
}

Test-Item "app/services/auth_service.py existe" {
    Test-Path (Join-Path $vextor_be "app" "services" "auth_service.py")
}

Test-Item "app/api/routes/auth.py existe" {
    Test-Path (Join-Path $vextor_be "app" "api" "routes" "auth.py")
}

Test-Item "app/websocket/tracking.py existe" {
    Test-Path (Join-Path $vextor_be "app" "websocket" "tracking.py")
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "3. ARCHIVOS VIEJOS ELIMINADOS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Test-Item "router_auth.py NO existe (eliminado)" {
    -not (Test-Path (Join-Path $vextor_be "router_auth.py"))
}

Test-Item "models.py NO existe (eliminado)" {
    -not (Test-Path (Join-Path $vextor_be "models.py"))
}

Test-Item "schemas.py NO existe (eliminado)" {
    -not (Test-Path (Join-Path $vextor_be "schemas.py"))
}

Test-Item "database.py NO existe (eliminado)" {
    -not (Test-Path (Join-Path $vextor_be "database.py"))
}

Test-Item "main.py viejo NO existe (eliminado)" {
    -not (Test-Path (Join-Path $vextor_be "main.py"))
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "4. ARCHIVOS CONTIENEN CONTENIDO" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Test-Item "main.py contiene FastAPI" {
    $content = Get-Content (Join-Path $vextor_be "app" "main.py") -Raw
    $content -match "FastAPI"
}

Test-Item "auth_service.py contiene clase AuthService" {
    $content = Get-Content (Join-Path $vextor_be "app" "services" "auth_service.py") -Raw
    $content -match "class AuthService"
}

Test-Item "config.py contiene clase Settings" {
    $content = Get-Content (Join-Path $vextor_be "app" "core" "config.py") -Raw
    $content -match "class Settings"
}

Test-Item "tracking.py contiene WebSocket" {
    $content = Get-Content (Join-Path $vextor_be "app" "websocket" "tracking.py") -Raw
    $content -match "websocket"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "5. IMPORTS VÁLIDOS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Test-Item "main.py contiene imports correctos" {
    $content = Get-Content (Join-Path $vextor_be "app" "main.py") -Raw
    ($content -match "from app.api") -and ($content -match "from app.websocket")
}

Test-Item "auth_service.py contiene imports correctos" {
    $content = Get-Content (Join-Path $vextor_be "app" "services" "auth_service.py") -Raw
    ($content -match "from app.") -and ($content -match "from app.core")
}

Test-Item "Dockerfile actualizado con app.main" {
    $content = Get-Content (Join-Path $vextor_be "Dockerfile") -Raw
    $content -match "app.main:app"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "6. CANTIDAD DE ARCHIVOS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

$py_files_old = @(Get-ChildItem -Path $vextor_be -MaxDepth 1 -Filter "*.py" -Force -ErrorAction SilentlyContinue).Count
$py_files_app = @(Get-ChildItem -Path (Join-Path $vextor_be "app") -Recurse -Filter "*.py" -Force -ErrorAction SilentlyContinue).Count

Write-Host "Archivos .py en raíz vextor_be/: $py_files_old (máximo 3)" -ForegroundColor Cyan
Write-Host "Archivos .py en app/: $py_files_app (debe ser 50+)" -ForegroundColor Cyan

if ($py_files_old -le 3) {
    Write-Host "  ✅ PASS - Raíz limpia" -ForegroundColor Green
    $global:tests_passed++
} else {
    Write-Host "  ❌ FAIL - Raíz contiene archivos antiguos" -ForegroundColor Red
    $global:tests_failed++
}

if ($py_files_app -ge 50) {
    Write-Host "  ✅ PASS - app/ contiene estructura modular" -ForegroundColor Green
    $global:tests_passed++
} else {
    Write-Host "  ❌ FAIL - app/ no tiene suficientes archivos" -ForegroundColor Red
    $global:tests_failed++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "RESUMEN DE VERIFICACIÓN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host ""
Write-Host "Tests pasados:  ✅ $tests_passed" -ForegroundColor Green
Write-Host "Tests fallidos: ❌ $tests_failed" -ForegroundColor $(if ($tests_failed -eq 0) { "Green" } else { "Red" })

if ($tests_failed -eq 0) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                   ✅ TODOS LOS TESTS PASARON ✅            ║" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "║           Backend VEXTOR listo para producción            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║               ❌ ALGUNOS TESTS FALLARON ❌               ║" -ForegroundColor Red
    Write-Host "║          Revisa los errores de arriba e intenta          ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
