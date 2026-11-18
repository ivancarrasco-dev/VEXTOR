"""Cliente mínimo y privado para objetos de respaldo en Supabase Storage.

No usa enlaces públicos ni expone credenciales al frontend.
"""
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from app.core.config import settings


class BackupStorageError(RuntimeError):
    pass


def _request(method: str, path: str, body: bytes | None = None, content_type: str = "application/json"):
    if not settings.BACKUP_STORAGE_CONFIGURED:
        raise BackupStorageError("El almacenamiento de respaldos no está configurado en el backend.")

    url = f"{settings.SUPABASE_URL}/storage/v1{path}"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
    }
    request = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=settings.BACKUP_STORAGE_TIMEOUT_SECONDS) as response:
            payload = response.read()
            if not payload:
                return None
            try:
                return json.loads(payload.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                return payload
    except HTTPError as exc:
        # No propagar cuerpo del proveedor: podría contener detalles internos.
        raise BackupStorageError(f"Supabase Storage respondió con HTTP {exc.code}.") from None
    except (URLError, TimeoutError, OSError):
        raise BackupStorageError("No fue posible conectar con Supabase Storage.") from None


def upload_backup(filename: str, content: bytes):
    object_path = f"manual/{quote(filename, safe='')}"
    return _request(
        "POST",
        f"/object/{quote(settings.SUPABASE_BACKUP_BUCKET, safe='')}/{object_path}",
        body=content,
        content_type="application/sql",
    )


def list_backups():
    payload = json.dumps({
        "prefix": "manual/",
        "limit": 100,
        "offset": 0,
        "sortBy": {"column": "created_at", "order": "desc"},
    }).encode("utf-8")
    result = _request(
        "POST",
        f"/object/list/{quote(settings.SUPABASE_BACKUP_BUCKET, safe='')}",
        body=payload,
    )
    return result if isinstance(result, list) else []


def download_backup(filename: str):
    object_path = f"manual/{quote(filename, safe='')}"
    return _request(
        "GET",
        f"/object/{quote(settings.SUPABASE_BACKUP_BUCKET, safe='')}/{object_path}",
        content_type="application/octet-stream",
    )
