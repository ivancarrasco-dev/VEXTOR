"""Endpoints de generación, listado y descarga de respaldos.

Todas las operaciones están restringidas a administradores y usan un bucket privado.
"""
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from urllib.parse import parse_qs, unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.api.routes.auth import get_current_user
from app.models import Rol as RolModel
from app.services.backup_storage import (
    BackupStorageError,
    upload_backup,
    list_backups,
    download_backup,
)

router = APIRouter(prefix="/api/backup", tags=["Backups"])


def require_backup_admin(db: Session, current_user):
    role = db.query(RolModel).filter(RolModel.id_rol == current_user.id_rol).first()
    if not role or "admin" not in (role.nombre_rol or "").strip().lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: se requiere rol de Administrador.",
        )


def _storage_error(exc: BackupStorageError):
    raise HTTPException(status_code=503, detail=str(exc)) from None


@router.get("")
def get_backups(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_backup_admin(db, current_user)
    try:
        entries = list_backups()
    except BackupStorageError as exc:
        _storage_error(exc)

    backups = []
    for entry in entries:
        name = entry.get("name") if isinstance(entry, dict) else None
        if not name or not name.lower().endswith(".sql"):
            continue
        metadata = entry.get("metadata") or {}
        backups.append({
            "id": name,
            "filename": name,
            "size": metadata.get("size") or entry.get("metadata", {}).get("size"),
            "date": entry.get("created_at") or entry.get("updated_at"),
            "status": "Completado",
        })
    return backups


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_backup(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_backup_admin(db, current_user)
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise HTTPException(
            status_code=503,
            detail="Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el backend y crea el bucket privado.",
        )

    pg_dump = shutil.which("pg_dump")
    if not pg_dump:
        raise HTTPException(
            status_code=503,
            detail="pg_dump no está instalado en el servidor. Instala postgresql-client y reinicia el backend.",
        )

    parsed = urlparse(settings.DATABASE_URL.replace("postgresql+psycopg://", "postgresql://").replace("postgres://", "postgresql://"))
    if parsed.scheme not in ("postgresql", "postgres"):
        raise HTTPException(status_code=400, detail="El motor configurado no permite generar un dump PostgreSQL.")

    host = parsed.hostname
    if not host:
        raise HTTPException(status_code=500, detail="La URL de base de datos no contiene un host válido.")
    query = parse_qs(parsed.query)
    db_name = unquote(parsed.path.lstrip("/").split("?")[0])
    db_user = unquote(parsed.username or "")
    db_password = unquote(parsed.password or "")
    db_port = str(parsed.port or 5432)
    if not db_name or not db_user:
        raise HTTPException(status_code=500, detail="La URL de base de datos no contiene usuario o base de datos.")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"vextor_backup_{timestamp}.sql"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(prefix="vextor_backup_", suffix=".sql", delete=False) as temp:
            tmp_path = temp.name

        env = os.environ.copy()
        if db_password:
            env["PGPASSWORD"] = db_password
        sslmode = query.get("sslmode", ["require"])[0]
        env["PGSSLMODE"] = sslmode

        command = [
            pg_dump, "--host", host, "--port", db_port,
            "--username", db_user, "--dbname", db_name,
            "--format", "plain", "--no-owner", "--no-privileges",
            "--schema=public", "--file", tmp_path,
        ]
        result = subprocess.run(
            command,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
        if result.returncode != 0:
            # No incluir stdout/stderr: pueden revelar host, nombres internos u otros datos.
            raise HTTPException(
                status_code=500,
                detail="pg_dump no pudo generar el respaldo. Verifica compatibilidad del cliente PostgreSQL y permisos de lectura.",
            )

        size = os.path.getsize(tmp_path)
        if size <= 0 or size > settings.BACKUP_MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="El respaldo generado está vacío o supera el límite configurado.",
            )
        with open(tmp_path, "rb") as backup_file:
            content = backup_file.read()
        upload_backup(filename, content)
        return {
            "status": "success",
            "message": "Respaldo generado y almacenado correctamente.",
            "backup": {
                "id": filename,
                "filename": filename,
                "size": size,
                "date": datetime.now(timezone.utc).isoformat(),
                "status": "Completado",
            },
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="La generación del respaldo superó el tiempo máximo permitido.") from None
    except BackupStorageError as exc:
        _storage_error(exc)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_manual_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Guarda un SQL proporcionado por el administrador sin ejecutarlo."""
    require_backup_admin(db, current_user)
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise HTTPException(
            status_code=503,
            detail="Configura Supabase Storage en el backend antes de subir respaldos.",
        )
    original_name = Path(file.filename or "backup.sql").name
    if not original_name.lower().endswith(".sql"):
        raise HTTPException(status_code=400, detail="Formato no permitido. Debe ser un archivo .sql.")
    content = await file.read(settings.BACKUP_MAX_SIZE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="El archivo SQL está vacío.")
    if len(content) > settings.BACKUP_MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera el tamaño máximo permitido.")
    try:
        # Nombre único: nunca sobrescribir una copia que ya exista.
        safe_name = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in original_name)
        filename = f"manual_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}_{uuid4().hex[:8]}_{safe_name}"
        upload_backup(filename, content)
    except BackupStorageError as exc:
        _storage_error(exc)
    return {
        "status": "success",
        "message": "Archivo SQL almacenado como respaldo. No se ha ejecutado ni restaurado.",
        "backup": {
            "id": filename,
            "filename": filename,
            "size": len(content),
            "date": datetime.now(timezone.utc).isoformat(),
            "status": "Completado",
        },
    }


@router.get("/{filename}/download")
def download_backup_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_backup_admin(db, current_user)
    if "/" in filename or "\\" in filename or not filename.lower().endswith(".sql"):
        raise HTTPException(status_code=400, detail="Nombre de respaldo inválido.")
    try:
        content = download_backup(filename)
    except BackupStorageError as exc:
        _storage_error(exc)
    if not isinstance(content, bytes):
        raise HTTPException(status_code=502, detail="Supabase Storage devolvió un archivo no válido.")
    if len(content) > settings.BACKUP_MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="El respaldo supera el tamaño máximo permitido.")
    return Response(
        content=content,
        media_type="application/sql",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
