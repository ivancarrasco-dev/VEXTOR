"""Operaciones PostgreSQL para respaldos y restauración protegida."""
import hashlib
import os
import shutil
import subprocess
import tempfile
from uuid import uuid4
from datetime import datetime, timezone
from urllib.parse import parse_qs, unquote, urlparse

from app.core.config import settings
from app.services.backup_storage import (
    BackupStorageError,
    upload_backup,
    download_backup,
)


class BackupOperationError(RuntimeError):
    pass


def _connection_parameters():
    raw_url = (
        settings.BACKUP_DATABASE_URL
        .replace("postgresql+psycopg://", "postgresql://")
        .replace("postgres://", "postgresql://")
    )
    parsed = urlparse(raw_url)
    if parsed.scheme != "postgresql":
        raise BackupOperationError("La base de datos configurada no es PostgreSQL.")
    if not parsed.hostname or not parsed.username or not parsed.path.lstrip("/"):
        raise BackupOperationError("La URL de base de datos está incompleta.")

    # Una URL alternativa para pg_dump/psql debe apuntar a la misma base/proyecto.
    app_url = (
        settings.DATABASE_URL
        .replace("postgresql+psycopg://", "postgresql://")
        .replace("postgres://", "postgresql://")
    )
    app_parsed = urlparse(app_url)
    if app_parsed.scheme != "postgresql":
        raise BackupOperationError("BACKUP_DATABASE_URL solo puede usarse cuando DATABASE_URL apunta a PostgreSQL.")
    backup_database = unquote(parsed.path.lstrip("/"))
    app_database = unquote(app_parsed.path.lstrip("/"))
    if backup_database != app_database:
        raise BackupOperationError("BACKUP_DATABASE_URL debe apuntar a la misma base de datos que DATABASE_URL.")

    def supabase_project_ref(url_parts):
        host = url_parts.hostname or ""
        if host.startswith("db.") and host.endswith(".supabase.co"):
            return host[3:-len(".supabase.co")]
        username = unquote(url_parts.username or "")
        if username.startswith("postgres."):
            return username.split(".", 1)[1]
        return None

    app_ref = supabase_project_ref(app_parsed)
    backup_ref = supabase_project_ref(parsed)
    if app_ref and backup_ref and app_ref != backup_ref:
        raise BackupOperationError("BACKUP_DATABASE_URL apunta a un proyecto Supabase distinto.")
    query = parse_qs(parsed.query)
    return {
        "host": parsed.hostname,
        "port": str(parsed.port or 5432),
        "user": unquote(parsed.username),
        "password": unquote(parsed.password or ""),
        "database": unquote(parsed.path.lstrip("/")),
        "sslmode": query.get("sslmode", ["require"])[0],
    }


def _postgres_env(params):
    env = os.environ.copy()
    if params["password"]:
        env["PGPASSWORD"] = params["password"]
    env["PGSSLMODE"] = params["sslmode"]
    env["PGCONNECT_TIMEOUT"] = "15"
    return env


def generate_database_backup():
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise BackupOperationError("Supabase Storage no está configurado en el backend.")
    executable = shutil.which("pg_dump")
    if not executable:
        raise BackupOperationError("pg_dump no está instalado en el servidor.")
    params = _connection_parameters()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"vextor_backup_{timestamp}_{uuid4().hex[:8]}.sql"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(prefix="vextor_backup_", suffix=".sql", delete=False) as temp:
            tmp_path = temp.name
        command = [
            executable,
            "--no-password",
            "--host", params["host"],
            "--port", params["port"],
            "--username", params["user"],
            "--dbname", params["database"],
            "--format", "plain",
            "--no-owner",
            "--no-privileges",
            "--clean",
            "--if-exists",
            "--schema=public",
            "--file", tmp_path,
        ]
        result = subprocess.run(
            command,
            env=_postgres_env(params),
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
        if result.returncode != 0:
            raise BackupOperationError(
                "pg_dump no pudo generar el respaldo. Verifica la versión de PostgreSQL y los permisos de lectura."
            )
        size = os.path.getsize(tmp_path)
        if size <= 0:
            raise BackupOperationError("pg_dump generó un archivo vacío.")
        if size > settings.BACKUP_MAX_SIZE_BYTES:
            raise BackupOperationError("El respaldo supera el tamaño máximo configurado.")
        with open(tmp_path, "rb") as backup_file:
            content = backup_file.read()
        return filename, content
    except subprocess.TimeoutExpired:
        raise BackupOperationError("La generación del respaldo superó el tiempo máximo permitido.") from None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def create_verified_pre_restore_backup():
    """Crea una copia del estado actual y verifica que pueda descargarse íntegra."""
    filename, content = generate_database_backup()
    filename = filename.replace("vextor_backup_", "vextor_pre_restore_", 1)
    upload_backup(filename, content)
    stored_content = download_backup(filename)
    if not isinstance(stored_content, bytes):
        raise BackupOperationError("No se pudo verificar la copia previa almacenada.")
    if hashlib.sha256(stored_content).digest() != hashlib.sha256(content).digest():
        raise BackupOperationError("La copia previa no superó la verificación de integridad.")
    return filename


def restore_postgres_sql(sql_content: str):
    """Restaura SQL solo después de verificar una copia previa en Storage."""
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise BackupOperationError("No se puede restaurar sin configurar el almacenamiento de respaldos.")
    executable = shutil.which("psql")
    if not executable:
        raise BackupOperationError("psql no está instalado en el servidor.")
    pre_backup_name = create_verified_pre_restore_backup()
    params = _connection_parameters()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(prefix="vextor_restore_", suffix=".sql", delete=False, mode="w", encoding="utf-8") as temp:
            temp.write(sql_content)
            tmp_path = temp.name
        command = [
            executable,
            "--no-psqlrc",
            "--no-password",
            "--host", params["host"],
            "--port", params["port"],
            "--username", params["user"],
            "--dbname", params["database"],
            "--set", "ON_ERROR_STOP=1",
            "--single-transaction",
            "--file", tmp_path,
        ]
        result = subprocess.run(
            command,
            env=_postgres_env(params),
            capture_output=True,
            text=True,
            timeout=600,
            check=False,
        )
        if result.returncode != 0:
            raise BackupOperationError(
                f"La restauración se detuvo ante un error. La copia previa verificada quedó guardada como {pre_backup_name}."
            )
        return pre_backup_name
    except subprocess.TimeoutExpired:
        raise BackupOperationError(
            f"La restauración superó el tiempo máximo. La copia previa quedó guardada como {pre_backup_name}."
        ) from None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
