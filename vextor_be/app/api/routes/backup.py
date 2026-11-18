"""Endpoints de generación, listado y descarga de respaldos.

Todas las operaciones están restringidas a administradores y usan un bucket privado.
"""
from datetime import datetime, timezone
import asyncio
from pathlib import Path
import re
from uuid import uuid4

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
from app.services.backup_service import BackupOperationError, generate_database_backup

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


@router.get("/status")
def get_backup_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_backup_admin(db, current_user)
    storage_ready = settings.BACKUP_STORAGE_CONFIGURED
    if storage_ready:
        try:
            list_backups()  # Verifica que el bucket exista y sea accesible.
        except BackupStorageError:
            storage_ready = False
    return {
        "storage_configured": storage_ready,
        "automatic_enabled": bool(settings.BACKUP_AUTO_ENABLED and storage_ready),
        "hour": settings.BACKUP_AUTO_HOUR,
        "minute": settings.BACKUP_AUTO_MINUTE,
        "timezone": settings.BACKUP_AUTO_TIMEZONE,
    }


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
    try:
        filename, content = generate_database_backup()
        upload_backup(filename, content)
    except BackupOperationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except BackupStorageError as exc:
        _storage_error(exc)

    return {
        "status": "success",
        "message": "Respaldo generado y almacenado correctamente.",
        "backup": {
            "id": filename,
            "filename": filename,
            "size": len(content),
            "date": datetime.now(timezone.utc).isoformat(),
            "status": "Completado",
        },
    }


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_manual_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Guarda un SQL proporcionado por el administrador sin ejecutarlo."""
    require_backup_admin(db, current_user)
    original_name = Path(file.filename or "backup.sql").name
    if not original_name.lower().endswith(".sql"):
        raise HTTPException(status_code=400, detail="Formato no permitido. Debe ser un archivo .sql.")
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise HTTPException(
            status_code=503,
            detail="Configura Supabase Storage en el backend antes de subir respaldos.",
        )
    content = await file.read(settings.BACKUP_MAX_SIZE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="El archivo SQL está vacío.")
    if len(content) > settings.BACKUP_MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera el tamaño máximo permitido.")
    try:
        # Nombre único: nunca sobrescribir una copia que ya exista.
        safe_stem = "".join(
            ch if ch.isascii() and (ch.isalnum() or ch in "._-") else "_"
            for ch in Path(original_name).stem
        )[:80] or "backup"
        filename = (
            f"manual_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}_"
            f"{uuid4().hex[:8]}_{safe_stem}.sql"
        )
        await asyncio.to_thread(upload_backup, filename, content)
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
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.sql", filename, re.IGNORECASE):
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
