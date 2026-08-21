# Guía de Instalación y Despliegue de VEXTOR

Esta guía está diseñada para que cualquier persona (desarrolladores o estudiantes del SENA) pueda clonar el repositorio de **VEXTOR** en un computador nuevo con Docker Desktop instalado y poner a funcionar toda la plataforma ejecutando **únicamente un comando**:

```powershell
.\setup-vextor.ps1
```

---

## 1. Requisitos Previos

Antes de comenzar, asegúrate de contar con lo siguiente en tu computador:

1. **Git:** Control de versiones ([https://git-scm.com/](https://git-scm.com/)).
2. **Docker Desktop:** Entorno de contenedores para Windows/macOS/Linux ([https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)).
   - Asegúrate de abrir Docker Desktop y verificar que la barra inferior indique **"Docker Desktop is running"**.

---

## 2. Instalación Automática en un Comando (Recomendado)

### Paso 1: Clonar el Repositorio
Abre PowerShell o tu terminal preferida y clona VEXTOR:

```powershell
git clone <URL_DEL_REPOSITORIO_VEXTOR>
cd VEXTOR
```

### Paso 2: Ejecutar el Instalador Automático
En PowerShell desde la raíz del proyecto, ejecuta:

```powershell
.\setup-vextor.ps1
```

---

## 3. Flujo Interno de `setup-vextor.ps1`

Cuando ejecutas `.\setup-vextor.ps1`, el script realiza automáticamente todas las siguientes etapas:

```text
  PC NUEVO
     │
     ▼
Git clone VEXTOR
     │
     ▼
.\setup-vextor.ps1
     │
     ├─► [1/6] Verificar Docker Engine y Docker Compose
     │
     ├─► [2/6] Verificación y Validación de Variables de Entorno (.env)
     │
     ├─► [3/6] Preparar OSRM Colombia (Descarga PBF + Pipeline MLD si no existe)
     │
     ├─► [4/6] Construir e Iniciar Contenedores con Docker Compose (Frontend, Backend, OSRM)
     │
     ├─► [5/6] Verificación Determinista de Salud (Frontend, Backend, OSRM, /api/routing/health)
     │
     └─► [6/6] Confirmación de Estado de Despliegue (exit 0 si OK, exit 1 si falla)
     │
     ▼
VEXTOR FUNCIONANDO DOCKERIZADO
```

---

## 4. Acceso a los Servicios

Una vez finalizado el setup, accede a los servicios en tu navegador:

- 💻 **Frontend Web App:** `http://localhost` (o `http://localhost:5173`)
- ⚙️ **Backend REST & WebSockets:** `http://localhost:8000`
- 📖 **Documentación Swagger API:** `http://localhost:8000/docs`
- 🗺️ **Motor OSRM Local:** `http://localhost:5000`

---

## 5. Gestión y Comandos Útiles de Docker

No necesitas memorizar comandos complejos, pero si deseas administrar los contenedores:

### Ver estado de los contenedores
```powershell
docker compose ps
```

### Ver logs en tiempo real de todos los servicios
```powershell
docker compose logs -f
```

### Ver logs de un servicio específico (ej: backend u osrm)
```powershell
docker compose logs -f backend
docker compose logs -f osrm
```

### Detener VEXTOR
```powershell
docker compose down
```

### Reiniciar VEXTOR
```powershell
docker compose restart
```

### Reconstruir contenedores tras modificar el código
```powershell
docker compose up -d --build
```

---

## 6. Explicación de la Arquitectura Docker y OSRM

```text
                  ┌───────────────┐
                  │   FRONTEND    │ (React 19 + Nginx en Puerto 80)
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    BACKEND    │ (FastAPI en Puerto 8000)
                  │    FASTAPI    │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │     OSRM      │ (Motor de Ruteo Colombia MLD en Puerto 5000)
                  └───────────────┘

                  BACKEND
                     │
                     ▼
                  SUPABASE (PostgreSQL Persistente en la Nube)
```

### ¿Por qué los datos pesados de OSRM NO están en GitHub?
El procesamiento del mapa de Colombia genera entre 1.5 GB y 3 GB de archivos binarios (`colombia-latest.osrm*`). Para mantener el repositorio de Git liviano y rápido:
1. **NO subimos archivos pesados a GitHub:** `.gitignore` ignora todos los datos de `infra/osrm/data/`.
2. **Generación Local:** `setup-vextor.ps1` descarga el mapa original PBF de Colombia y procesa el grafo localmente la primera vez mediante Docker.
3. **Reutilización:** En ejecuciones posteriores, el script detecta los archivos procesados y los reutiliza al instante sin descargar ni procesar de nuevo.

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

### 1. "Docker no está ejecutándose"
- **Causa:** La aplicación Docker Desktop está cerrada.
- **Solución:** Abre Docker Desktop desde el menú Inicio, espera a que el ícono de la ballena esté estático y vuelve a ejecutar `.\setup-vextor.ps1`.

### 2. "Puerto en uso" (80, 8000 o 5000)
- **Causa:** Otra aplicación (como Skype, IIS, Apache u otro proyecto) está ocupando uno de los puertos.
- **Solución:** Cierra la aplicación en conflicto o cambia el mapeo de puertos en `docker-compose.yml`.

### 3. "DATABASE_URL requiere ser configurada"
- **Causa:** `.env` no tiene las credenciales válidas de la base de datos PostgreSQL de Supabase.
- **Solución:** Abre el archivo `.env` en la raíz del proyecto y asigna tu cadena de conexión real de Supabase en `DATABASE_URL`.

### 4. OSRM no responde o da timeout
- **Solución:** Revisa los logs de OSRM con `docker compose logs osrm` o vuelve a generar el grafo borrando los archivos dentro de `infra/osrm/data/` (dejando `.gitignore`).
