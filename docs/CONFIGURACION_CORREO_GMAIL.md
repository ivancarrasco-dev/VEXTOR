# Configuración de correo Gmail para VEXTOR

## Por qué no basta con iniciar sesión con Gmail

El correo de la cuenta de un usuario es el destinatario del restablecimiento. El backend necesita además una **cuenta emisora SMTP** para poder enviar el mensaje. La sesión de VEXTOR y la contraseña de inicio de sesión del usuario no proporcionan esas credenciales.

En el archivo `.env` de la raíz del repositorio configura las variables siguientes:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=cuenta-emisora@gmail.com
MAIL_PASSWORD=CONTRASENA_DE_APLICACION_DE_GOOGLE
MAIL_FROM=VEXTOR <cuenta-emisora@gmail.com>
FRONTEND_URL=https://tu-dominio-publico
```

- `MAIL_USERNAME`: Gmail que enviará los mensajes. Puede ser distinto del Gmail que el usuario registra en VEXTOR.
- `MAIL_PASSWORD`: contraseña de aplicación de Google de 16 caracteres; no uses la contraseña normal de Gmail.
- `MAIL_FROM`: dirección visible del remitente. Para Gmail debe corresponder a la cuenta autenticada.
- `FRONTEND_URL`: dirección pública desde la que el usuario abrirá el formulario de nueva contraseña. No uses `localhost` para usuarios que abrirán el enlace desde otro dispositivo.

## Crear la contraseña de aplicación

1. Inicia sesión en la cuenta Gmail emisora.
2. Activa la verificación en dos pasos en la cuenta Google.
3. Abre https://myaccount.google.com/apppasswords.
4. Genera una contraseña de aplicación y copia el valor generado.
5. Pégalo en `MAIL_PASSWORD` del archivo `.env`, sin publicarlo en GitHub.

Si Google no muestra la opción de contraseñas de aplicación, revisa las restricciones de seguridad o administración de esa cuenta.

## Reiniciar el backend

Docker Compose carga las variables de `.env` al crear el contenedor. Después de editar el archivo, recrea el backend:

```powershell
docker compose up -d --build backend
```

## Probar el envío antes de probar recuperación

Ejecuta desde la raíz del proyecto:

```powershell
docker compose exec backend python scripts/test_smtp.py TU_CORREO_DESTINO@gmail.com
```

El script debe terminar con `CORREO ENVIADO`. Comprueba también Spam/Correo no deseado. Si falla, revisa el mensaje SMTP que imprime el script y los registros:

```powershell
docker compose logs --tail=200 backend
```

Después prueba `¿Olvidaste tu contraseña?` desde VEXTOR.

## Cómo funciona la protección

La API responde con un mensaje genérico tanto si el correo existe como si no, para evitar revelar qué cuentas están registradas. Por eso la pantalla puede mostrar el mensaje de confirmación aunque SMTP haya fallado. El resultado real del envío queda registrado en los logs del backend como `AUTH RECOVERY ERROR` o `AUTH RECOVERY SUCCESS`.

El token de recuperación se almacena como hash, expira a los 30 minutos y se invalida después de utilizarse. No compartas tokens ni contraseñas SMTP en incidencias o capturas.
