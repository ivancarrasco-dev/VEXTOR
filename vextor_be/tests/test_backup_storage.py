"""Pruebas de configuración segura de Supabase Storage."""
import pytest

from app.services import backup_storage


def test_public_bucket_is_rejected(monkeypatch):
    monkeypatch.setattr(
        backup_storage,
        "_request",
        lambda method, path: {"id": "vextor-backups", "public": True},
    )

    with pytest.raises(backup_storage.BackupStorageError, match="privado"):
        backup_storage.ensure_private_bucket()


def test_private_bucket_is_accepted(monkeypatch):
    expected = {"id": "vextor-backups", "public": False}
    monkeypatch.setattr(
        backup_storage,
        "_request",
        lambda method, path: expected,
    )

    assert backup_storage.ensure_private_bucket() == expected
