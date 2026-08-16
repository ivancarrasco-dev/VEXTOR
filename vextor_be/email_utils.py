import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_recovery_email(email_to: str, reset_link: str) -> bool:
    """
    Sends a password recovery email if SMTP is configured in environment variables.
    If SMTP is not configured, logs the recovery link safely to the server console.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "noreply@vextor.com")

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Restablecimiento de Contraseña - VEXTOR Fleet Management"
            msg["From"] = f"VEXTOR Support <{smtp_from}>"
            msg["To"] = email_to

            text_content = f"Has solicitado restablecer tu contraseña en VEXTOR.\nAccede al siguiente enlace para continuar:\n{reset_link}\n\nEste enlace expira en 30 minutos."

            html_content = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 20px; margin: 0; }}
                    .card {{ max-width: 500px; margin: 20px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                    .logo {{ font-size: 24px; font-weight: 800; color: #10b981; text-align: center; margin-bottom: 24px; letter-spacing: 2px; }}
                    .btn {{ display: block; width: 100%; max-width: 280px; margin: 24px auto; padding: 14px 20px; background-color: #10b981; color: #090d16; font-weight: bold; text-align: center; text-decoration: none; border-radius: 12px; font-size: 15px; }}
                    .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">VEXTOR</div>
                    <h2 style="color: #ffffff; margin-top: 0; text-align: center;">Recuperación de Contraseña</h2>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en VEXTOR.
                    </p>
                    <a href="{reset_link}" class="btn">Restablecer Contraseña</a>
                    <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 16px;">
                        Si no solicitaste este cambio, puedes ignorar este correo de forma segura. El enlace expirará en 30 minutos.
                    </p>
                    <div class="footer">
                        © 2026 VEXTOR Fleet Management. Todos los derechos reservados.
                    </div>
                </div>
            </body>
            </html>
            """

            msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, port, timeout=10)
                server.starttls()

            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [email_to], msg.as_string())
            server.quit()
            print(f"[SMTP EMAIL SUCCESS] Recovery email sent to {email_to}")
            return True
        except Exception as e:
            print(f"[SMTP EMAIL ERROR] Failed to send email via SMTP: {e}")

    # Fallback log for dev mode
    print(f"\n=======================================================")
    print(f"[VEXTOR DEV RECOVERY LINK]")
    print(f"Destination Email: {email_to}")
    print(f"Recovery URL     : {reset_link}")
    print(f"=======================================================\n")
    return True
