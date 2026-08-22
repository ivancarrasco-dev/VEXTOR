# Cleanup script para eliminar archivos viejos del backend VEXTOR
# Uso: .\cleanup-old-files.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 4: LIMPIEZA DE ARCHIVOS VIEJOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vextor_be = Join-Path $PSScriptRoot "vextor_be"

if (-not (Test-Path $vextor_be)) {
    Write-Host "ERROR: No se encontró directorio $vextor_be" -ForegroundColor Red
    exit 1
}

# Routers viejos a eliminar
$old_routers = @(
    "router_activities.py",
    "router_auth.py",
    "router_company.py",
    "router_drivers.py",
    "router_maintenance.py",
    "router_reports.py",
    "router_routes.py",
    "router_routing.py",
    "router_security.py",
    "router_users.py",
    "router_vehicles.py"
)

# Archivos monolíticos viejos
$old_monolithic = @(
    "models.py",
    "schemas.py",
    "database.py",
    "main.py",
    "email_utils.py",
    "email_service.py"
)

Write-Host "Eliminando routers viejos..." -ForegroundColor Yellow
foreach ($file in $old_routers) {
    $path = Join-Path $vextor_be $file
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Eliminando archivos monolíticos viejos..." -ForegroundColor Yellow
foreach ($file in $old_monolithic) {
    $path = Join-Path $vextor_be $file
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Eliminando osrm_client.py viejo..." -ForegroundColor Yellow
$osrm_path = Join-Path $vextor_be "services" "osrm_client.py"
if (Test-Path $osrm_path) {
    Remove-Item $osrm_path -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ services/osrm_client.py" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Limpieza completada exitosamente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Archivos restantes en vextor_be/:" -ForegroundColor Yellow
Get-ChildItem -Path $vextor_be -MaxDepth 1 -Force | Select-Object Name | Format-Table -HideTableHeaders

Write-Host ""
Write-Host "✅ PHASE 4 COMPLETADA" -ForegroundColor Green
Write-Host ""
