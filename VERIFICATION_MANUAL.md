# PHASE 3: VERIFICACIÓN MANUAL - INSTRUCCIONES

## Estado Actual

✅ Refactorización completada 100%
✅ Compilación de Python verificada
✅ Estructura profesional creada
⏳ Runtime tests pendientes (ejecutar localmente)

## Verificaciones que Completar Localmente

### 1. Verificar Backend Inicia Correctamente

```bash
cd vextor_be

# Asegurar que .env existe (debe tener DATABASE_URL)
# Si no existe, copiar .env.test como .env o ejecutar setup-vextor.ps1

# Iniciar backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Resultado esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 2. Verificar Swagger UI (Documentación Automática)

```bash
# En navegador o curl
curl http://localhost:8000/docs
```

**Resultado esperado:**
- Swagger UI accesible
- Todos los endpoints listados
- Health check endpoint visible

### 3. Probar Endpoint Básico

```bash
curl http://localhost:8000/
```

**Resultado esperado:**
```json
{
  "message": "Vextor API funcionando correctamente",
  "status": "online",
  "version": "2.0.0"
}
```

### 4. Probar Registro de Usuario

```bash
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User"
  }'
```

**Resultado esperado:**
```json
{
  "message": "Usuario creado correctamente"
}
```

### 5. Probar Login

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

**Resultado esperado:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "Administrador",
    "avatar": "TU",
    "phone": "",
    "photo": null
  }
}
```

### 6. Probar CRUD de Vehículos

```bash
# GET todos los vehículos
curl http://localhost:8000/api/vehicles \
  -b cookies.txt
```

**Resultado esperado:**
```json
[]  # Lista vacía (no hay vehículos aún)
```

### 7. Probar Health Check de OSRM

```bash
curl http://localhost:8000/api/routing/health
```

**Resultado esperado:**
```json
{
  "status": "available"
}
```
(Si OSRM está corriendo; si no, dará error 503)

### 8. Probar WebSocket de Tracking

Usar cliente WebSocket (ej: WebSocket King en VS Code):
```
URL: ws://localhost:8000/ws/tracking
```

Enviar mensaje:
```json
{
  "type": "ping"
}
```

Recibir respuesta:
```json
{
  "type": "pong"
}
```

### 9. Probar Docker Build

```bash
cd vextor_be
docker build -t vextor-backend:test .
```

**Resultado esperado:**
```
Successfully built [image-id]
```

### 10. Probar Stack Completo con Docker Compose

```bash
cd ..  # Volver a raíz VEXTOR-1
.\setup-vextor.ps1
```

**Resultado esperado:**
```
✅ OSRM Routing Engine (5000): OPERATIVO [OK]
✅ FastAPI Backend (8000): OPERATIVO [OK]
✅ Backend -> OSRM Routing Health: CONECTADO [OK]
✅ Frontend React Web App (80): OPERATIVO [OK]
```

## Checklist de Verificación

- [ ] Backend inicia sin errores
- [ ] Swagger UI es accesible
- [ ] Endpoint GET / responde
- [ ] POST /register funciona
- [ ] POST /login funciona y retorna token
- [ ] GET /api/vehicles funciona (requiere auth)
- [ ] GET /api/routing/health responde
- [ ] WebSocket /ws/tracking acepta conexiones
- [ ] docker build completa sin errores
- [ ] docker compose up levanta todos los servicios
- [ ] Frontend accesible en http://localhost
- [ ] Backend API accesible en http://localhost:8000
- [ ] OSRM accesible en http://localhost:5000

## Troubleshooting

### Backend no inicia
1. Verificar que DATABASE_URL está en .env
2. Verificar que JWT_SECRET_KEY está en .env
3. Revisar logs: `docker compose logs backend`
4. Verificar puerto 8000 no esté en uso

### Swagger UI no carga
1. Verificar que backend está running
2. Intentar http://localhost:8000/openapi.json
3. Revisar que CORS está habilitado

### Endpoints retornan 401
1. Asegurar que token está siendo pasado en headers
2. Verificar que cookie vextor_auth_token está siendo enviada
3. Comprobar que JWT_SECRET_KEY es el mismo en todo el sistema

### WebSocket no conecta
1. Verificar que ws:// (not http://) es usado
2. Revisar logs para errores de conexión
3. Comprobar firewall no bloquea WebSocket

## Notas Importantes

1. **DATABASE_URL**: El setup-vextor.ps1 debe auto-generar esto si no existe
2. **JWT_SECRET_KEY**: Debe ser auto-generado por setup-vextor.ps1
3. **SMTP**: Configurado con valores dummy por setup-vextor.ps1, correos deshabilitados
4. **OSRM**: Debe estar corriendo (levantado por docker-compose)
5. **Frontend**: Accesible en http://localhost (no http://localhost:80)

## Resultado Esperado Final

Todos los tests deben PASAR:
- ✅ Backend running
- ✅ Swagger UI responsive
- ✅ Auth flow working
- ✅ CRUD operations working
- ✅ WebSocket connected
- ✅ Docker build successful
- ✅ Docker compose stack healthy

Si todos los tests pasan → **Refactorización exitosa, lista para producción**
