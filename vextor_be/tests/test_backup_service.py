"""Pruebas unitarias de seguridad para restauración PostgreSQL."""
from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.services import backup_service


def _enable_storage(monkeypatch):
    monkeypatch.setattr(
        type(settings),
        "BACKUP_STORAGE_CONFIGURED",
        property(lambda self: True),
    )


def test_restore_verifies_pre_restore_backup_before_running_psql(monkeypatch):
    events = []
    _enable_storage(monkeypatch)
    monkeypatch.setattr(
        backup_service,
        "generate_database_backup",
        lambda: ("vextor_backup_test.sql", b"-- current database snapshot"),
    )
    monkeypatch.setattr(
        backup_service,
        "upload_backup",
        lambda name, content: events.append(("upload", name, content)),
    )
    monkeypatch.setattr(
        backup_service,
        "download_backup",
        lambda name: (events.append(("verify", name)) or b"-- current database snapshot"),
    )
    monkeypatch.setattr(backup_service.shutil, "which", lambda name: "/usr/bin/psql")
    monkeypatch.setattr(
        backup_service,
        "_connection_parameters",
        lambda: {
            "host": "db.example.test",
            "port": "5432",
            "user": "test",
            "password": "not-a-real-password",
            "database": "test",
            "sslmode": "require",
        },
    )

    def fake_run(command, **kwargs):
        assert "--single-transaction" in command
        assert "--no-psqlrc" in command
        assert command[command.index("--set") + 1] == "ON_ERROR_STOP=1"
        events.append(("restore",))
        return SimpleNamespace(returncode=0, stdout="", stderr="")

    monkeypatch.setattr(backup_service.subprocess, "run", fake_run)

    result = backup_service.restore_postgres_sql("CREATE TABLE example (id integer);")

    assert result == "vextor_pre_restore_test.sql"
    assert [event[0] for event in events] == ["upload", "verify", "restore"]


def test_restore_aborts_when_pre_restore_integrity_check_fails(monkeypatch):
    events = []
    _enable_storage(monkeypatch)
    monkeypatch.setattr(
        backup_service,
        "generate_database_backup",
        lambda: ("vextor_backup_test.sql", b"expected"),
    )
    monkeypatch.setattr(
        backup_service,
        "upload_backup",
        lambda name, content: events.append("upload"),
    )
    monkeypatch.setattr(
        backup_service,
        "download_backup",
        lambda name: b"corrupted",
    )
    monkeypatch.setattr(backup_service.shutil, "which", lambda name: "/usr/bin/psql")
    monkeypatch.setattr(
        backup_service,
        "_connection_parameters",
        lambda: pytest.fail("No debe abrir conexión para restaurar si falla la verificación previa."),
    )

    with pytest.raises(backup_service.BackupOperationError, match="integridad"):
        backup_service.restore_postgres_sql("DROP TABLE important;")

    assert events == ["upload"]


def test_backup_connection_url_can_use_session_pooler_for_same_project(monkeypatch):
    monkeypatch.setattr(
        settings,
        "DATABASE_URL",
        "postgresql+psycopg://postgres:app-pass@db.project123.supabase.co:5432/postgres",
    )
    monkeypatch.setattr(
        settings,
        "BACKUP_DATABASE_URL",
        "postgresql://postgres.project123:backup-pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
    )

    params = backup_service._connection_parameters()

    assert params["host"] == "aws-0-us-east-1.pooler.supabase.com"
    assert params["user"] == "postgres.project123"
    assert params["database"] == "postgres"


def test_backup_connection_url_rejects_different_supabase_project(monkeypatch):
    monkeypatch.setattr(
        settings,
        "DATABASE_URL",
        "postgresql+psycopg://postgres:app-pass@db.project123.supabase.co:5432/postgres",
    )
    monkeypatch.setattr(
        settings,
        "BACKUP_DATABASE_URL",
        "postgresql://postgres.project999:backup-pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    )

    with pytest.raises(backup_service.BackupOperationError, match="proyecto Supabase distinto"):
        backup_service._connection_parameters()
