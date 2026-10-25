# VEXTOR — Aplicación Android APK para Conductores

Este documento detalla la arquitectura, configuración, proceso de compilación, seguridad e instalación de la aplicación móvil Android exclusiva para los conductores de la flota VEXTOR.

---

## 1. Arquitectura de la Aplicación Móvil

La aplicación móvil **VEXTOR Conductor** está construida integrando **Capacitor 8** con el frontend React + Vite existente (`vextor_fe`).

- **Identificador de Aplicación**: `com.vextor.driver`
- **Nombre Visible**: `VEXTOR Conductor`
- **Motor Web Nativo**: Android WebView (Capacitor Android Runtime con esquema HTTPS seguro `https://localhost`).
- **Autenticación**: Token JWT enviado mediante cabecera `Authorization: Bearer <token>` y cookies HttpOnly.
- **Rastreo GPS en Tiempo Real**: Protocolo WebSocket (`/ws/tracking?token=<token>`) con fallback HTTP (`POST /api/routes/{id_ruta}/location`) mediante la API nativa de geolocalización (`@capacitor/geolocation`).
- **Exclusividad de Rol**: Restricción nativa a nivel de enrutamiento y backend para cuentas con rol **Conductor**. Las cuentas administrativas y de usuario son bloqueadas automáticamente con un mensaje informativo indicando acceder desde la plataforma web.

---

## 2. Dependencias y Requisitos de Instalación

### Dependencias agregadas en `vextor_fe/package.json`:

```json
"dependencies": {
  "@capacitor/app": "^8.1.2",
  "@capacitor/core": "^8.5.3",
  "@capacitor/geolocation": "^8.2.4",
  "@capacitor/preferences": "^8.0.1",
  "@capacitor/splash-screen": "^8.0.2",
  "@capacitor/status-bar": "^8.0.4"
},
"devDependencies": {
  "@capacitor/android": "^8.5.3",
  "@capacitor/cli": "^8.5.3"
}
```

---

## 3. Configuración de URLs de API y WebSocket

En desarrollo y producción, las URLs se gestionan de forma centralizada en `vextor_fe/src/config/api.js` mediante variables de entorno:

- `VITE_API_BASE_URL`: Dirección base del backend (ejemplo en producción: `https://api.vextor.com` o en red local: `http://10.0.2.2:8000` / `http://192.168.1.X:8000`).
- `VITE_WS_BASE_URL`: Dirección WebSocket en vivo (ejemplo en producción: `wss://api.vextor.com` o en red local: `ws://10.0.2.2:8000`).

### Configuración CORS en Backend (`vextor_be/app/core/config.py`):
El servidor FastAPI incluye en sus orígenes permitidos:
- `https://localhost` (Esquema por defecto de Capacitor Android)
- `capacitor://localhost`
- Orígenes de desarrollo web local (`http://localhost:5173`, `http://localhost:3000`, etc.)

---

## 4. Requisitos de Android Studio y Android SDK

Para compilar la APK en tu máquina de desarrollo o servidor de CI/CD:

- **JDK**: OpenJDK 17 u OpenJDK 21.
- **Android SDK**: API Level 34 o superior (Android 14).
- **Android SDK Build-Tools**: 34.0.0+.
- **Variable de Entorno**:
  ```bash
  export ANDROID_HOME=/opt/android-sdk # O la ruta de tu SDK local
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
  ```

---

## 5. Comandos de Compilación y Sincronización

Ejecuta los siguientes comandos desde el directorio `vextor_fe`:

```bash
# 1. Instalar dependencias del frontend
cd vextor_fe
pnpm install

# 2. Compilar la aplicación React/Vite para producción
pnpm build

# 3. Sincronizar los activos web y plugins de Capacitor con la plataforma Android
pnpm cap:sync
```

---

## 6. Procedimiento para Generar la APK Debug

Para compilar la APK de prueba/depuración sin necesidad de abrir Android Studio:

```bash
cd vextor_fe
pnpm cap:build
```

O directamente mediante Gradle:

```bash
cd vextor_fe/android
./gradlew assembleDebug
```

---

## 7. Ubicación Exacta de la APK Generada

Tras una compilación exitosa, la APK ejecutable se genera en la siguiente ruta:

```
vextor_fe/android/app/build/outputs/apk/debug/app-debug.apk
```

*(Tamaño aproximado: ~16.5 MB)*.

---

## 8. Procedimiento de Instalación en Dispositivos Android

### Método A: Instalación mediante ADB (Conexión USB o Wi-Fi)

```bash
adb install -r vextor_fe/android/app/build/outputs/apk/debug/app-debug.apk
```

### Método B: Instalación Manual en Teléfono

1. Transfiere el archivo `app-debug.apk` al teléfono (vía correo, Telegram, Google Drive o USB).
2. En el teléfono, abre el archivo APK.
3. Si el sistema lo solicita, habilita la opción **"Instalar aplicaciones de fuentes desconocidas"** para el explorador de archivos utilizado.
4. Presiona **Instalar** y luego **Abrir**.

---

## 9. Permisos GPS y Prueba Operativa de Rutas

### Permisos Android Declarados (`AndroidManifest.xml`):
- `ACCESS_FINE_LOCATION` (Ubicación precisa GPS).
- `ACCESS_COARSE_LOCATION` (Ubicación aproximada).
- `ACCESS_BACKGROUND_LOCATION` (Ubicación en segundo plano durante recorridos activos).
- `FOREGROUND_SERVICE` y `FOREGROUND_SERVICE_LOCATION` (Servicio de rastreo en primer plano).
- `POST_NOTIFICATIONS` (Notificaciones del estado de ruta activa).

### Flujo de Prueba de una Ruta para el Conductor:
1. **Inicio de Sesión**: Inicia sesión en la APK con una cuenta que posea el rol **Conductor** (ejemplo: `juan.conductor@vextor.com`).
2. **Listado de Rutas**: La APK solicitará las rutas asignadas al endpoint `/api/routes/driver/my-routes`.
3. **Inicio de Ruta**: Presiona **"Iniciar Ruta"** en una ruta programada.
4. **Concesión de Permisos**: La aplicación solicitará automáticamente permiso para acceder a la ubicación GPS. Selecciona **"Mientras la app está en uso"** o **"Permitir siempre"**.
5. **Navegación y Telemetría**: La pantalla de la ruta activa mostrará la ubicación actual, velocidad y ruta en el mapa. Coordenadas se transmitirán vía WebSocket en tiempo real.
6. **Finalizar Ruta**: Al llegar al destino, presiona **"Finalizar"**. El rastreo GPS se detendrá inmediatamente y tu estado cambiará a disponible.

---

## 10. Procedimiento para Generar una APK de Lanzamiento (Signed Release APK)

Para generar una APK firmada para producción o distribución formal:

1. **Crear KeyStore (Llave de Firma)**:
   ```bash
   keytool -genkey -v -keystore vextor-driver-release.keystore -alias vextor-key -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Configurar variables en `vextor_fe/android/key.properties`**:
   ```properties
   storePassword=TU_PASSWORD_KEYSTORE
   keyPassword=TU_PASSWORD_LLAVE
   keyAlias=vextor-key
   storeFile=../vextor-driver-release.keystore
   ```
3. **Compilar Release APK**:
   ```bash
   cd vextor_fe/android
   ./gradlew assembleRelease
   ```
4. **Ubicación de la APK de Release**:
   ```
   vextor_fe/android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 11. Requisitos de Configuración del Servidor para Producción

Para que la APK funcione fuera de la red local (vía datos móviles 4G/5G):

1. **Dominio con SSL / HTTPS Valido**:
   Configura un proxy inverso (Nginx, Caddy o Cloudflare) apuntando al backend FastAPI en la nube con un certificado SSL válido (Let's Encrypt).
2. **Soporte WebSocket (WSS)**:
   Asegúrate de que Nginx redireccione los encabezados de WebSocket en `/ws/tracking`:
   ```nginx
   location /ws/ {
       proxy_pass http://backend:8000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
       proxy_set_header Host $host;
   }
   ```
3. **Variables de Entorno para la APK**:
   Compila la APK configurando las variables públicas en `.env.production` de `vextor_fe`:
   ```env
   VITE_API_BASE_URL=https://tu-dominio-vextor.com
   VITE_WS_BASE_URL=wss://tu-dominio-vextor.com
   ```

---

## 12. Limitaciones Conocidas y Pruebas Ejecutadas

### Pruebas Ejecutadas:
- Compilación del frontend React/Vite (`pnpm build`).
- Sincronización y vinculación del runtime de Capacitor Android (`npx cap sync android`).
- Compilación completa de la APK de depuración usando Gradle (`./gradlew assembleDebug`).
- Pruebas unitarias y de integración del backend FastAPI en Python 3.12 (`pytest vextor_be/tests`).
- Validación de restricciones de seguridad de roles (usuarios no conductores bloqueados en la APK).

### Limitaciones Conocidas:
- En emuladores de Android Studio sin Google Play Services o sensores GPS habilitados, se deben simular las coordenadas utilizando las herramientas de ubicación del emulador.
- Las notificaciones push remotas requieren configurar una cuenta de Firebase Cloud Messaging (FCM) y adjuntar el archivo `google-services.json` en `vextor_fe/android/app/`.
