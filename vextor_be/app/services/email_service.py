"""
Servicio de Email
Consolida email_service.py y email_utils.py en un solo lugar
Maneja envío de emails, templates HTML, y recuperación
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional

from app.core.config import settings
from app.core.exceptions import EmailError


class EmailService:
    """Servicio para enviar emails"""

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> Tuple[bool, Optional[str]]:
        """Envía un email genérico"""
        host = settings.MAIL_HOST
        port = settings.MAIL_PORT
        username = settings.MAIL_USERNAME
        password = settings.MAIL_PASSWORD
        from_email = settings.MAIL_FROM

        # Si no hay credenciales, log y retorna True (no falla)
        if not host or not username or not password:
            print(
                f"[EMAIL SERVICE NOTICE] SMTP no configurado. Email a '{to_email}' no será enviado."
            )
            return False, "SMTP no configurado"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"VEXTOR Fleet Management <{from_email}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            # Conectar a SMTP
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=15)
            else:
                server = smtplib.SMTP(host, port, timeout=15)
                server.starttls()

            server.login(username, password)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()

            print(f"[EMAIL SUCCESS] '{subject}' enviado a {to_email}")
            return True, None
        except Exception as e:
            error_msg = f"[EMAIL ERROR] Fallo al enviar a {to_email}: {str(e)}"
            print(error_msg)
            return False, str(e)

    @staticmethod
    def send_password_reset_email(to_email: str, raw_token: str) -> Tuple[bool, Optional[str]]:
        """Envía email de recuperación de contraseña"""
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        subject = "Restablecimiento de Contraseña - VEXTOR"

        text_body = f"""Hola,

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en VEXTOR.

Accede al siguiente enlace para restablecer tu clave:
{reset_link}

Este enlace expira en 30 minutos.
Si no realizaste esta solicitud, puedes ignorar este mensaje.

Atentamente,
Equipo de VEXTOR Fleet Management"""

        html_body = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }}
        .header {{ text-align: center; margin-bottom: 28px; }}
        .logo {{ font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: 3px; margin-bottom: 8px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; }}
        .body-text {{ color: #94a3b8; font-size: 14px; line-height: 1.6; margin-top: 16px; text-align: left; }}
        .btn {{ display: block; width: 100%; max-width: 280px; margin: 28px auto; padding: 14px 24px; background-color: #10b981; color: #090d16; font-weight: 800; text-align: center; text-decoration: none; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }}
        .warning {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 20px; line-height: 1.5; }}
        .footer {{ font-size: 11px; color: #475569; text-align: center; margin-top: 24px; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo">VEXTOR</div>
            <h1 class="title">Recuperación de Contraseña</h1>
        </div>
        <p class="body-text">
            Hola,
        </p>
        <p class="body-text">
            Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta en la plataforma <strong>VEXTOR Fleet Management</strong>.
        </p>
        <a href="{reset_link}" class="btn" target="_blank">Restablecer Contraseña</a>
        <p class="body-text" style="font-size: 12px; color: #64748b; text-align: center;">
            Este enlace es de un solo uso y expirará automáticamente en <strong>30 minutos</strong>.
        </p>
        <div class="warning">
            Si no solicitaste este cambio, puedes ignorar este mensaje con total seguridad. Tu contraseña actual no se modificará.
        </div>
        <div class="footer">
            © 2026 VEXTOR Technologies. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>"""

        return EmailService.send_email(to_email, subject, html_body, text_body)

    @staticmethod
    def send_critical_alert_email(
        to_email: str,
        title: str,
        description: str,
        category: str = "alerta",
    ) -> Tuple[bool, Optional[str]]:
        """Envía email de alerta crítica"""
        subject = f"Alerta Crítica VEXTOR: {title}"

        text_body = f"""Alerta de Flota VEXTOR

Tipo: {category.upper()}
Evento: {title}
Detalle: {description}

Ingresa al sistema para más información."""

        html_body = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; }}
        .badge {{ display: inline-block; padding: 4px 12px; background-color: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }}
        .title {{ font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }}
        .desc {{ color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }}
        .footer {{ font-size: 11px; color: #475569; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px; text-align: center; }}
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Alerta Crítica • {category}</span>
        <h2 class="title">{title}</h2>
        <p class="desc">{description}</p>
        <div class="footer">
            VEXTOR Fleet Management System • Notificación automática
        </div>
    </div>
</body>
</html>"""

        return EmailService.send_email(to_email, subject, html_body, text_body)
