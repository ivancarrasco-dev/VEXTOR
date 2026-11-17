# VEXTOR — Aplicación Android APK para Conductores

Guía operativa para compilar, localizar, transferir e instalar **VEXTOR Conductor** en Android desde Windows 10/11. La aplicación está construida con React + Vite y Capacitor 8; no es una aplicación Expo/React Native.

## 1. Requisitos previos

- Windows 10/11 de 64 bits.
- Node.js LTS compatible con el proyecto.
- pnpm (la carpeta del frontend contiene `package.json`).
- JDK 17 o 21 configurado en `JAVA_HOME`.
- Android Studio con Android SDK instalado (SDK Platform y Build-Tools compatibles con el proyecto).
- Docker Desktop ejecutándose si el backend se levanta con Docker Compose.
- Conexión a Internet durante la primera compilación: Gradle Wrapper debe descargar Gradle y Android puede descargar dependencias.

Comprueba las herramientas en PowerShell:

```powershell
node --version
pnpm --version
java -version
$env:JAVA_HOME
```

En Android Studio abre **SDK Manager** y verifica que exista el Android SDK. Configura `ANDROID_HOME` o `ANDROID_SDK_ROOT` apuntando a la ruta real del SDK. Por ejemplo (ajusta el usuario/ruta):

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
```

## 2. Configurar la dirección del backend

El APK se instala en un teléfono; por eso **no debes compilarlo con `localhost` ni `127.0.0.1`**. Esas direcciones apuntarían al propio teléfono.

### Prueba en la misma red Wi-Fi

1. Conecta PC y teléfono a la misma red Wi-Fi.
2. En Windows ejecuta `ipconfig` y busca la IPv4 del adaptador Wi-Fi/Ethernet activo (por ejemplo `192.168.1.25`).
3. Verifica que el backend esté disponible desde el PC en el puerto 8000.
4. Permite TCP 8000 en Firewall de Windows para redes privadas.
5. Desde el navegador del teléfono comprueba `http://IP_DEL_PC:8000/`.

En PowerShell, reemplaza la IP de ejemplo por la real:

```powershell
cd C:\Users\TU_USUARIO\VEXTOR\vextor_fe
$env:VITE_API_BASE_URL="http://192.168.1.25:8000"
$env:VITE_WS_BASE_URL="ws://192.168.1.25:8000"
```

Si usas un backend publicado en Internet, utiliza su URL HTTPS y su WebSocket seguro WSS. No distribuyas un APK configurado con una IP privada que solo funciona en tu Wi-Fi.

> La URL de API y WebSocket se incorporan al bundle durante la compilación de Vite. Si cambias esas variables, vuelve a compilar y sincronizar Capacitor.

## 3. Generar el APK Debug en Windows

Abre PowerShell en la carpeta del frontend:

```powershell
cd C:\Users\TU_USUARIO\VEXTOR\vextor_fe
pnpm install
```

Configura las URLs de la sección anterior y ejecuta:

```powershell
pnpm run build:android
```

El script `scripts/build-android.mjs` realiza estos pasos automáticamente:

1. Comprueba que las variables `VITE_API_BASE_URL` y `VITE_WS_BASE_URL` estén definidas y no sean localhost.
2. Ejecuta `pnpm run build` para generar `dist`.
3. Ejecuta `npx cap sync android`.
4. Ejecuta Gradle `assembleDebug`.

La ruta esperada del archivo generado es:

```
vextor_fe\android\app\build\outputs\apk\debug\app-debug.apk
```

Comprueba que exista:

```powershell
Test-Path .\android\app\build\outputs\apk\debug\app-debug.apk
Get-Item .\android\app\build\outputs\apk\debug\app-debug.apk | Select-Object FullName, Length, LastWriteTime
```

### Compilar directamente con Gradle

Si el frontend ya fue compilado y sincronizado:

```powershell
cd .\android
.\gradlew.bat assembleDebug
```

## 4. Solución al error de descarga de Gradle

Si aparece:

```
Downloading https://services.gradle.org/distributions/gradle-8.14.3-...
java.net.ConnectException: Connection timed out
```

Gradle no ha podido descargar su propia distribución. Esto ocurre antes de compilar el código Android; no significa por sí solo que el proyecto tenga errores de Java/Kotlin.

Prueba en este orden:

1. Comprueba que Windows tenga Internet y que una VPN, proxy, firewall corporativo o antivirus no esté bloqueando `services.gradle.org`.
2. Abre en el navegador: `https://services.gradle.org/distributions/gradle-8.14.3-bin.zip`.
3. Cierra y vuelve a abrir PowerShell/VS Code después de cambiar VPN o proxy.
4. Reintenta:

```powershell
cd .\android
.\gradlew.bat --version
.\gradlew.bat assembleDebug --stacktrace
```

5. Si la descarga se interrumpe, vuelve a ejecutar el comando: Gradle Wrapper puede reanudar/reintentar la obtención de la distribución.
6. Si estás detrás de un proxy institucional, configura sus datos en el archivo `%USERPROFILE%\.gradle\gradle.properties` (no publiques credenciales del proxy).

El Wrapper del repositorio utiliza Gradle 8.14.3. Se ha configurado la distribución `bin` (más pequeña que `all`) y un timeout de red mayor. No descargues un Gradle distinto ni cambies versiones de plugins al azar.

## 5. ¿Dónde se descarga el APK?

El script de compilación **no publica ni descarga el APK desde una página web**. Lo construye localmente en tu computador. Cuando termine correctamente, abre esta ruta desde el Explorador de Windows:

```
VEXTOR\vextor_fe\android\app\build\outputs\apk\debug\app-debug.apk
```

Para copiarlo a una carpeta fácil de encontrar:

```powershell
Copy-Item .\android\app\build\outputs\apk\debug\app-debug.apk "$HOME\Desktop\VEXTOR-Conductor-debug.apk"
```

Para distribuirlo a los conductores, transfiere el archivo por USB, Drive o un canal privado. No envíes el archivo `.env`, claves JWT, contraseñas SMTP ni archivos de firma.

## 6. Instalar en un teléfono Android

### Método A — instalación manual

1. Copia `VEXTOR-Conductor-debug.apk` al teléfono.
2. Abre el APK desde Archivos/Descargas.
3. Si Android lo solicita, permite temporalmente **Instalar aplicaciones desconocidas** para la aplicación que abrió el archivo (Archivos, Chrome, Drive, etc.).
4. Pulsa **Instalar** y después **Abrir**.
5. Inicia sesión con una cuenta cuyo rol sea **Conductor**.
6. Acepta los permisos de ubicación cuando la aplicación los solicite.

### Método B — ADB por USB

1. Activa Opciones de desarrollador y Depuración USB en el teléfono.
2. Conecta el teléfono al PC y acepta la autorización RSA.
3. Ejecuta desde PowerShell:

```powershell
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Si `adb` no se reconoce, ejecuta desde la carpeta `platform-tools` del Android SDK o agrega esa carpeta al PATH.

## 7. Prueba funcional mínima

- Comprueba que el teléfono puede abrir la URL del backend.
- Inicia sesión con un usuario de rol Conductor.
- Verifica que aparecen únicamente las rutas asignadas a ese conductor.
- Inicia una ruta y concede permisos GPS.
- Comprueba que la ubicación se actualiza y que el backend recibe la telemetría.
- Finaliza la ruta y verifica que el rastreo se detiene.

La app móvil no reemplaza la plataforma web administrativa. Los usuarios Administrador y Usuario deben continuar utilizando la versión web.

## 8. Recuperación de contraseña y enlaces desde el móvil

El correo de recuperación construye un enlace con `FRONTEND_URL`. Esa URL debe ser accesible desde el dispositivo donde se abre el correo:

- Si se abre en el mismo PC: usa la URL local que realmente publica el frontend.
- Si se abre en un teléfono en la misma Wi-Fi: usa la IPv4 LAN del PC y el puerto publicado por Docker.
- Si el sistema está desplegado públicamente: usa el dominio HTTPS real.

No uses `localhost` en un enlace que se abrirá desde otro dispositivo. Para Docker Compose de este repositorio, el frontend publica el puerto 80 y también el 5173 del host hacia Nginx.

Después de cambiar variables del archivo `.env` raíz, recrea el backend:

```powershell
docker compose up -d --build --force-recreate backend
docker compose logs --tail 100 backend
```

Prueba primero SMTP de forma independiente:

```powershell
docker compose exec backend python scripts/test_smtp.py TU_CORREO_DESTINO@gmail.com
```

Configura Gmail con una contraseña de aplicación (no la contraseña normal de Google). Las variables que lee el backend son `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` y `MAIL_FROM`. En Gmail, el remitente efectivo se ajusta a `MAIL_USERNAME`.

El endpoint `POST /api/auth/forgot-password` responde intencionalmente con un mensaje genérico para no revelar si un correo está registrado. Si el envío falla, revisa los logs del backend; una respuesta HTTP exitosa del endpoint no garantiza que Gmail haya aceptado el correo.

## 9. APK de lanzamiento (Release)

El APK Debug es para pruebas. Para distribuir una versión de lanzamiento, debe generarse y protegerse una llave de firma (keystore), configurar la firma Release en Gradle y compilar `assembleRelease`. Conserva una copia segura del keystore y sus contraseñas: sin la misma llave no podrás actualizar normalmente la aplicación instalada. No subas el keystore ni sus contraseñas al repositorio.

## 10. Seguridad

- Rota cualquier contraseña de aplicación Gmail o secreto JWT que haya aparecido en capturas, chats o commits.
- Mantén el archivo `.env` fuera de Git.
- No compartas APKs configurados con endpoints de desarrollo que no sean accesibles al conductor.
- La distribución de producción debe usar HTTPS/WSS y una APK firmada.
