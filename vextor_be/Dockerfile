# =============================================================================
# VEXTOR BACKEND FASTAPI DOCKERFILE
# =============================================================================

FROM python:3.12-slim

# Evitar búferes de salida en Python y archivos .pyc
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de requerimientos e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . .

# Puerto por defecto de FastAPI/Uvicorn
EXPOSE 8000

# Comando de inicio del servidor FastAPI
# Ahora apunta a app.main:app debido a la reestructuración
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
