# Guía de Instalación Paso a Paso de VEXTOR desde Cero

Esta guía está diseñada para que cualquier integrante del equipo o desarrollador pueda clonar el proyecto **VEXTOR** en una máquina totalmente nueva y ponerlo a funcionar paso a paso sin complicaciones.

---

## 1. Requisitos del Sistema

Antes de comenzar, asegúrate de contar con los siguientes programas instalados en tu computadora:

- **Sistema Operativo:** Windows 10/11 (64-bit), macOS o Linux.
- **Git:** Control de versiones ([https://git-scm.com/](https://git-scm.com/)).
- **Node.js:** Versión 20 o superior ([https://nodejs.org/](https://nodejs.org/)).
- **pnpm:** Gestor de paquetes de Node (`npm install -g pnpm`).
- **Python:** Versión 3.12 o superior ([https://www.python.org/](https://www.python.org/)).
- **Docker Desktop:** Para ejecutar el servidor de mapas OSRM local ([https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)).

---

## 2. Paso a Paso para la Instalación

### Paso 1: Clonar el Repositorio
Abre tu terminal (PowerShell en Windows, CMD o Bash) y clona el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO_VEXTOR>
cd VEXTOR
```

---

### Paso 2: Iniciar Docker Desktop
1. Abre la aplicación **Docker Desktop** desde el menú de inicio de tu sistema operativo.
2. Espera unos segundos a que el ícono de Docker muestre que el motor está activo ("Docker Desktop is running").

---

### Paso 3: Configurar el Servidor de Mapas OSRM
VEXTOR utiliza su propio servidor OSRM local para calcular rutas sobre el mapa de Colombia. Ejecuta el script automatizado desde la raíz del repositorio en PowerShell:

```powershell
.\setup-osrm.ps1
```

> **¿Qué hace este script?**
> - Verifica que Docker y Docker Compose estén listos.
> - Descarga los datos geográficos de Colombia de Geofabrik (`colombia-latest.osm.pbf`).
> - Procesa el grafo vial MLD si es la primera vez.
> - Levanta el contenedor de OSRM en `http://localhost:5000`.
> - Realiza una prueba de ruta Bogotá - Medellín para validar que el servidor esté activo.

Si ves el mensaje `STATUS: OSRM LISTO Y OPERATIVO EN LOCAL`, puedes continuar.

---

### Paso 4: Configurar Variables de Entorno (`.env`)

Crea un archivo `.env` en la carpeta `vextor_be/` utilizando como plantilla `.env.example`:

1. En Windows PowerShell:
   ```powershell
   Copy-Item .env.example vextor_be\.env
   ```
2. Abre `vextor_be\.env` y verifica que contenga las siguientes variables esenciales:

```env
# URL de conexión a la Base de Datos PostgreSQL de Supabase
DATABASE_URL=postgresql+psycopg://vextor_user:Vextor7.!<>@localhost:5432/vextor_db

# Clave secreta para la firma de tokens JWT
JWT_SECRET_KEY=clave-secreta-de-desarrollo-vextor-2025

# URL del servidor OSRM local
OSRM_URL=http://localhost:5000
OSRM_TIMEOUT_SECONDS=10

# URL del frontend
FRONTEND_URL=http://localhost:5173
```

> **Nota:** La base de datos PostgreSQL se encuentra alojada en **Supabase**. No necesitas instalar PostgreSQL localmente si utilizas la URL remota de Supabase provista por el equipo.

---

### Paso 5: Instalar Dependencias del Backend (`vextor_be`)

Navega al directorio del backend, crea un entorno virtual e instala los paquetes de Python:

```bash
cd vextor_be

# Crear entorno virtual de Python
python -m venv venv

# Activar entorno virtual
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# En Linux/macOS:
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

---

### Paso 6: Instalar Dependencias del Frontend (`vextor_fe`)

Abre una nueva terminal, navega a la carpeta del frontend e instala las dependencias con `pnpm`:

```bash
cd vextor_fe
pnpm install
```

---

### Paso 7: Iniciar el Servidor Backend (FastAPI)

En la terminal con el entorno virtual activado de `vextor_be`:

```bash
uvicorn main:app --reload --port 8000
```

El backend quedará disponible en: `http://localhost:8000`
Documentación interactiva de API: `http://localhost:8000/docs`

---

### Paso 8: Iniciar el Cliente Frontend (React + Vite)

En la terminal de `vextor_fe`:

```bash
pnpm run dev
```

El cliente web abrirá en: `http://localhost:5173`

---

## 3. Comprobación Final del Sistema

1. Abre tu navegador web e ingresa a `http://localhost:5173`.
2. Inicia sesión con las credenciales de prueba o de tu usuario asignado.
3. Dirígete a la sección **Rutas** (`/rutas`).
4. Selecciona un punto de Origen (ej: Bogotá) y un Destino (ej: Medellín).
5. Verifica que el mapa dibuje la línea azul de la carretera y muestre la distancia en kilómetros y el tiempo estimado en horas/minutos.

Si la ruta se dibuja correctamente, **VEXTOR está 100% instalado y funcional en tu equipo**.
