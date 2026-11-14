"""Prueba manual de entrega SMTP sin exponer credenciales.

Uso dentro del contenedor:
    python scripts/test_smtp.py destinatario@gmail.com
"""
import sys

from app.services.email_service import EmailService


def main() -> int:
    if len(sys.argv) != 2 or "@" not in sys.argv[1]:
        print("Uso: python scripts/test_smtp.py destinatario@gmail.com")
        return 2

    recipient = sys.argv[1].strip()
    success, error = EmailService.send_email(
        to_email=recipient,
        subject="Prueba de correo VEXTOR",
        html_content="<p>La configuración SMTP de VEXTOR está enviando correos correctamente.</p>",
        text_content="La configuración SMTP de VEXTOR está enviando correos correctamente.",
    )
    if not success:
        print(f"FALLO SMTP: {error}")
        return 1

    print(f"CORREO ENVIADO: revisa la bandeja de entrada y spam de {recipient}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
