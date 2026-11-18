# README --- VEXTOR Conductor para Android

Guía para configurar, compilar, instalar y probar la APK de VEXTOR
Conductor en Windows 10/11.

> La APK se construye con el frontend React/Vite existente y Capacitor
> 8. No es una aplicación Android independiente del backend: necesita
> conectarse a la API FastAPI de VEXTOR.

## 1. Requisitos

Instala y verifica:

-   Git.
-   Node.js LTS compatible con Vite 6 y pnpm.
-   pnpm (si no lo tienes: `npm install -g pnpm`).
-   Android Studio, incluyendo Android SDK Platform 36, Android SDK
    Build-Tools y Platform-Tools (ADB).
-   JDK 21 (configura `JAVA_HOME` para que Android Studio/Gradle lo
    encuentre).
-   Docker Desktop, con los servicios backend y OSRM de VEXTOR
    funcionando.

El proyecto utiliza Capacitor 8, Android `compileSdkVersion=36`,
`targetSdkVersion=36`, `minSdkVersion=24` y Gradle Wrapper 8.14.3. El
wrapper descarga Gradle automáticamente la primera vez.

Verifica desde PowerShell:

``` powershell
node --version
pnpm --version
java -version
adb version
```

En Android Studio abre **More Actions \> SDK Manager** e instala Android
SDK Platform 36 y Android SDK Build-Tools correspondientes. En **SDK
Tools**, instala Android SDK Platform-Tools.

## 2. Preparar VEXTOR

Abre PowerShell y entra en la carpeta del repositorio:

``` powershell
cd C:\Users\TU_USUARIO\VEXTOR
```

Inicia los servicios del backend desde la raíz del proyecto:

``` powershell
docker compose up -d backend osrm
docker compose ps
```

El backend debe estar accesible en el puerto 8000. Comprueba desde el
PC:

``` powershell
Invoke-WebRequest http://localhost:8000/
```

Si el endpoint raíz no responde con HTTP 200 en tu configuración,
comprueba Swagger en `http://localhost:8000/docs` y los registros:

``` powershell
docker compose logs --tail=100 backend
```

## 3. Configurar la conexión del teléfono con el backend

**No configures `localhost` como API del APK para un teléfono físico.**
En Android, localhost apunta al propio teléfono, no al computador que
ejecuta Docker.

1.  Conecta el PC y el teléfono Android a la misma red Wi-Fi.
2.  En Windows ejecuta `ipconfig` y busca la dirección IPv4 del
    adaptador Wi-Fi (por ejemplo, `192.168.1.25`).
3.  Comprueba que el teléfono pueda alcanzar el backend usando esa IP y
    el puerto 8000. La dirección de Swagger sería
    `http://192.168.1.25:8000/docs`.
4.  Si Windows Firewall bloquea el acceso, permite TCP 8000 en el perfil
    de red privada o crea una regla de entrada para ese puerto. No
    desactives todo el firewall.

En PowerShell, dentro de `vextor_fe`, configura las variables para la
compilación:

``` powershell
cd .\vextor_fe
$env:VITE_API_BASE_URL="http://192.168.1.25:8000"
$env:VITE_WS_BASE_URL="ws://192.168.1.25:8000"
```

Reemplaza `192.168.1.25` por la IPv4 real de tu PC. Para un servidor
publicado, utiliza las URL HTTPS/WSS públicas reales.

Estas variables se incorporan al frontend durante el build. Si cambia la
IP o el dominio, vuelve a compilar la APK.

## 4. Instalar dependencias y generar APK Debug

Desde `vextor_fe`:

``` powershell
pnpm install --frozen-lockfile
pnpm run build:android
```

El script `scripts/build-android.mjs` realiza automáticamente:

1.  Validación de `VITE_API_BASE_URL` y `VITE_WS_BASE_URL`.
2.  Compilación del frontend con Vite.
3.  Sincronización de los recursos y plugins Android con
    `npx cap sync android`.
4.  Compilación de Android con Gradle `assembleDebug`.

El script se detiene si las URL están vacías o utilizan
localhost/127.0.0.1.

### Ubicación del archivo

Si la compilación termina correctamente, el archivo estará en:

``` text
vextor_fe\android\app\build\outputs\apk\debug\app-debug.apk
```

Puedes comprobarlo:

``` powershell
Test-Path .\android\app\build\outputs\apk\debug\app-debug.apk
```

Debe devolver `True`.

## 5. Instalar en un teléfono Android

### Opción A --- USB con ADB

1.  En el teléfono activa Opciones de desarrollador y Depuración USB.
2.  Conecta el teléfono al PC y acepta el diálogo de autorización.
3.  Desde PowerShell:

``` powershell
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Si ADB muestra el dispositivo como `unauthorized`, acepta el permiso en
el teléfono y repite.

### Opción B --- Instalación manual

1.  Copia `app-debug.apk` al teléfono por USB, Drive u otro medio.
2.  Abre el APK desde el gestor de archivos.
3.  Si Android lo solicita, permite instalar aplicaciones desde esa
    fuente.
4.  Pulsa **Instalar** y abre **VEXTOR Conductor**.

La APK Debug es para pruebas. No es la versión firmada de distribución
pública.

## 6. Inicio de sesión y prueba funcional

-   Inicia sesión con una cuenta VEXTOR cuyo rol sea **Conductor**.
-   La cuenta debe tener un conductor válido y rutas asignadas para que
    aparezcan recorridos.
-   Comprueba que se cargue **Mis rutas**.
-   Prueba iniciar una ruta y verificar que se solicite el permiso de
    ubicación.
-   Comprueba la actualización de ubicación y el seguimiento desde el
    panel web.
-   Finaliza el recorrido y confirma que el estado cambie correctamente.

Permisos declarados por el proyecto en AndroidManifest: Internet,
ubicación precisa/aproximada, ubicación en segundo plano, servicio de
primer plano de ubicación y notificaciones. Android puede solicitar
permisos en distintos momentos según la versión y el flujo; concede solo
los necesarios para la prueba.

## 7. Abrir el proyecto en Android Studio

Después de instalar dependencias y sincronizar Capacitor:

``` powershell
pnpm cap:open
```

También puedes abrir manualmente la carpeta `vextor_fe/android` desde
Android Studio. Espera a que termine Gradle Sync antes de ejecutar o
compilar.

## 8. Errores frecuentes

  -----------------------------------------------------------------------
  Problema                            Qué revisar
  ----------------------------------- -----------------------------------
  El script dice que faltan las URL   Define ambas variables en la misma
                                      ventana PowerShell antes de
                                      ejecutar `pnpm run build:android`.

  El script rechaza localhost         Usa la IPv4 LAN del PC o el dominio
                                      público, no localhost ni 127.0.0.1.

  El teléfono no conecta al backend   PC y teléfono en la misma Wi-Fi;
                                      revisa IPv4, Docker, puerto 8000 y
                                      Firewall de Windows.

  La APK instala pero no inicia       Comprueba la URL de API compilada,
  sesión                              disponibilidad del backend y
                                      credenciales del conductor.

  No aparecen rutas                   Verifica que el usuario tenga rol
                                      Conductor, registro de conductor y
                                      asignaciones vigentes.

  No hay GPS                          Revisa permisos de ubicación del
                                      sistema, GPS encendido y permisos
                                      concedidos a VEXTOR.

  Gradle falla                        Verifica JDK 21, SDK Platform 36,
                                      conexión para descargar
                                      Gradle/dependencias y sincroniza de
                                      nuevo.

  ADB no detecta el teléfono          Revisa depuración USB, cable con
                                      datos, autorización RSA y
                                      `adb devices`.
  -----------------------------------------------------------------------

Para revisar registros:

``` powershell
docker compose logs --tail=150 backend
adb logcat
```

## 9. Alcance y seguridad: estado que debes conocer

-   La aplicación Android comparte el frontend y backend del proyecto.
-   El control actual de rutas protegidas bloquea cuentas cuyo rol no
    sea Conductor cuando se ejecuta en una plataforma nativa.
-   **En la rama principal revisada, el control de frontend no garantiza
    todavía que un conductor quede limitado exclusivamente a las rutas
    `/driver/*`**: también debe completarse y probarse esa restricción
    antes de distribuir la APK como aplicación exclusivamente operativa.
-   La protección de pantallas en el frontend no sustituye la
    autorización del backend. Cada endpoint que lee o modifica rutas,
    vehículos y telemetría debe validar identidad, rol y asignación en
    el servidor.
-   El permiso de ubicación en segundo plano declarado en el Manifest no
    demuestra por sí solo que el seguimiento GPS continúe con la
    aplicación cerrada o en segundo plano. Eso requiere implementación y
    pruebas específicas en un dispositivo real.
-   Para producción, publica la API con HTTPS y WebSocket seguro (WSS).
    No distribuyas una APK configurada con una IP privada de desarrollo.

## 10. Archivos importantes

-   `capacitor.config.json`: identificador y nombre de la aplicación.
-   `scripts/build-android.mjs`: automatización del build APK.
-   `android/app/src/main/AndroidManifest.xml`: permisos y configuración
    Android.
-   `android/app/build.gradle`: identificador, SDK y configuración
    Gradle.
-   `src/config/api.js`: lectura de las URL de API y WebSocket.
-   `src/pages/Driver/`: pantallas operativas del conductor.
-   `src/routes/ProtectedRoute.jsx`: control de acceso del frontend.

------------------------------------------------------------------------

**Resumen rápido:** inicia backend y OSRM, configura la IPv4 del PC en
las variables Vite, ejecuta `pnpm install --frozen-lockfile` y
`pnpm run build:android`, y luego instala
`android/app/build/outputs/apk/debug/app-debug.apk`.
