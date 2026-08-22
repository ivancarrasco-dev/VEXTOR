@echo off
REM Cleanup script para eliminar archivos viejos del backend VEXTOR

echo.
echo ========================================
echo PHASE 4: LIMPIEZA DE ARCHIVOS VIEJOS
echo ========================================
echo.

cd /d "%~dp0vextor_be" || goto ERROR

echo Eliminando routers viejos...
del /Q router_activities.py 2>nul
del /Q router_auth.py 2>nul
del /Q router_company.py 2>nul
del /Q router_drivers.py 2>nul
del /Q router_maintenance.py 2>nul
del /Q router_reports.py 2>nul
del /Q router_routes.py 2>nul
del /Q router_routing.py 2>nul
del /Q router_security.py 2>nul
del /Q router_users.py 2>nul
del /Q router_vehicles.py 2>nul

echo Eliminando archivos monoliticos viejos...
del /Q models.py 2>nul
del /Q schemas.py 2>nul
del /Q database.py 2>nul
del /Q main.py 2>nul
del /Q email_utils.py 2>nul
del /Q email_service.py 2>nul

echo Eliminando osrm_client.py viejo de services/...
del /Q services\osrm_client.py 2>nul

echo.
echo ========================================
echo Limpieza completada exitosamente
echo ========================================
echo.
echo Estado de vextor_be/:
dir /B
echo.
pause

goto SUCCESS

:ERROR
echo ERROR: No se pudo cambiar a directorio vextor_be
pause
exit /b 1

:SUCCESS
exit /b 0
