"""
Pruebas unitarias para el EmailService
Prueba los escenarios de configuración ausente, errores de autenticación SMTP,
errores de red/SMTP, puerto SSL vs STARTTLS, y formateo de cabeceras.
"""
import pytest
import smtplib
from unittest.mock import patch, MagicMock

from app.services.email_service import EmailService
from app.core.config import settings


def test_parse_sender_address():
    """Verifica la extracción limpia del nombre descriptivo y correo de remitente"""
    # Solo email
    name, addr = EmailService._parse_sender_address("user@domain.com")
    assert name == "VEXTOR Fleet Management"
    assert addr == "user@domain.com"

    # Formato completo con comillas/flechas
    name, addr = EmailService._parse_sender_address("VEXTOR Fleet <noreply@vextor.com>")
    assert name == "VEXTOR Fleet"
    assert addr == "noreply@vextor.com"

    # Vacío
    name, addr = EmailService._parse_sender_address("")
    assert name == "VEXTOR Fleet Management"
    assert addr == "noreply@vextor.com"


def test_send_email_missing_configuration():
    """Verifica que el servicio retorne (False, msg) si no hay configuración SMTP completa"""
    with patch.object(settings, "MAIL_HOST", ""), \
         patch.object(settings, "MAIL_USERNAME", ""), \
         patch.object(settings, "MAIL_PASSWORD", ""):
        success, err = EmailService.send_email("test@example.com", "Test Subject", "<p>Test</p>")
        assert success is False
        assert "SMTP no configurado" in err


def test_send_email_smtp_auth_error():
    """Verifica la captura de errores de autenticación SMTP"""
    with patch.object(settings, "MAIL_HOST", "smtp.gmail.com"), \
         patch.object(settings, "MAIL_PORT", 587), \
         patch.object(settings, "MAIL_USERNAME", "testuser@gmail.com"), \
         patch.object(settings, "MAIL_PASSWORD", "invalidpass"), \
         patch.object(settings, "MAIL_FROM", "testuser@gmail.com"):

        mock_smtp_instance = MagicMock()
        mock_smtp_instance.login.side_effect = smtplib.SMTPAuthenticationError(535, b"5.7.8 Username and Password not accepted")

        with patch("smtplib.SMTP", return_value=mock_smtp_instance):
            success, err = EmailService.send_email("user@example.com", "Subject", "Body")
            assert success is False
            assert "Error de autenticación SMTP" in err
            mock_smtp_instance.quit.assert_called_once()


def test_send_email_smtp_exception():
    """Verifica la captura de errores genéricos de conexión o protocolo SMTP"""
    with patch.object(settings, "MAIL_HOST", "smtp.gmail.com"), \
         patch.object(settings, "MAIL_PORT", 587), \
         patch.object(settings, "MAIL_USERNAME", "testuser@gmail.com"), \
         patch.object(settings, "MAIL_PASSWORD", "pass"), \
         patch.object(settings, "MAIL_FROM", "testuser@gmail.com"):

        mock_smtp_instance = MagicMock()
        mock_smtp_instance.sendmail.side_effect = smtplib.SMTPException("Connection closed unexpectedly")

        with patch("smtplib.SMTP", return_value=mock_smtp_instance):
            success, err = EmailService.send_email("user@example.com", "Subject", "Body")
            assert success is False
            assert "Error SMTP" in err
            mock_smtp_instance.quit.assert_called_once()


def test_send_email_success_starttls():
    """Verifica el envío exitoso por el puerto 587 con STARTTLS"""
    with patch.object(settings, "MAIL_HOST", "smtp.gmail.com"), \
         patch.object(settings, "MAIL_PORT", 587), \
         patch.object(settings, "MAIL_USERNAME", "user@gmail.com"), \
         patch.object(settings, "MAIL_PASSWORD", "app-password"), \
         patch.object(settings, "MAIL_FROM", "VEXTOR Admin <user@gmail.com>"):

        mock_smtp_instance = MagicMock()

        with patch("smtplib.SMTP", return_value=mock_smtp_instance) as mock_smtp_cls:
            success, err = EmailService.send_email("recipient@gmail.com", "Test Subject", "<p>Hello</p>", "Hello")
            assert success is True
            assert err is None
            mock_smtp_cls.assert_called_once_with("smtp.gmail.com", 587, timeout=15)
            mock_smtp_instance.starttls.assert_called_once()
            mock_smtp_instance.login.assert_called_once_with("user@gmail.com", "app-password")
            mock_smtp_instance.sendmail.assert_called_once()
            args, _ = mock_smtp_instance.sendmail.call_args
            assert args[0] == "user@gmail.com"
            assert args[1] == ["recipient@gmail.com"]
            mock_smtp_instance.quit.assert_called_once()


def test_send_email_success_ssl():
    """Verifica el envío exitoso por el puerto 465 con SSL"""
    with patch.object(settings, "MAIL_HOST", "smtp.gmail.com"), \
         patch.object(settings, "MAIL_PORT", 465), \
         patch.object(settings, "MAIL_USERNAME", "user@gmail.com"), \
         patch.object(settings, "MAIL_PASSWORD", "app-password"), \
         patch.object(settings, "MAIL_FROM", "user@gmail.com"):

        mock_smtp_instance = MagicMock()

        with patch("smtplib.SMTP_SSL", return_value=mock_smtp_instance) as mock_ssl_cls:
            success, err = EmailService.send_email("recipient@gmail.com", "SSL Subject", "<p>SSL</p>")
            assert success is True
            assert err is None
            mock_ssl_cls.assert_called_once_with("smtp.gmail.com", 465, timeout=15)
            mock_smtp_instance.login.assert_called_once_with("user@gmail.com", "app-password")
            mock_smtp_instance.sendmail.assert_called_once()
            mock_smtp_instance.quit.assert_called_once()


def test_send_password_reset_email_link_formatting():
    """Verifica que el correo de recuperación incluya el enlace completo con FRONTEND_URL y raw_token"""
    with patch.object(settings, "FRONTEND_URL", "http://localhost:5173"), \
         patch.object(EmailService, "send_email") as mock_send_email:
        mock_send_email.return_value = (True, None)

        raw_token = "secret-token-12345"
        success, err = EmailService.send_password_reset_email("target@example.com", raw_token)

        assert success is True
        assert err is None
        mock_send_email.assert_called_once()
        _, kwargs = mock_send_email.call_args
        args = mock_send_email.call_args[0]
        to_email = args[0]
        subject = args[1]
        html_body = args[2]
        text_body = args[3]

        expected_link = f"http://localhost:5173/reset-password?token={raw_token}"
        assert to_email == "target@example.com"
        assert "Restablecimiento de Contraseña" in subject
        assert expected_link in html_body
        assert expected_link in text_body
