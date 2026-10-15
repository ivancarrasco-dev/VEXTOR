"""
Excepciones personalizadas del sistema VEXTOR
"""


class VextorException(Exception):
    """Excepción base de VEXTOR"""
    pass


class AuthenticationError(VextorException):
    """Error de autenticación"""
    pass


class AuthorizationError(VextorException):
    """Error de autorización"""
    pass


class ResourceNotFoundError(VextorException):
    """Recurso no encontrado"""
    pass


class ValidationError(VextorException):
    """Error de validación"""
    pass


class ConflictError(VextorException):
    """Conflicto de datos (ej: duplicate key)"""
    pass


class IntegrationError(VextorException):
    """Error en integración externa (ej: OSRM, SMTP)"""
    pass


class OsrmError(IntegrationError):
    """Error específico de OSRM"""
    pass


class EmailError(IntegrationError):
    """Error específico de envío de email"""
    pass


def setup_exception_handlers(app):
    """Registra los manejadores globales de excepciones en la app FastAPI"""
    from fastapi import Request
    from fastapi.responses import JSONResponse
    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException

    @app.exception_handler(VextorException)
    async def vextor_exception_handler(request: Request, exc: VextorException):
        status_code = 400
        if isinstance(exc, AuthenticationError):
            status_code = 401
        elif isinstance(exc, AuthorizationError):
            status_code = 403
        elif isinstance(exc, ResourceNotFoundError):
            status_code = 404
        elif isinstance(exc, ConflictError):
            status_code = 409
        elif isinstance(exc, IntegrationError):
            status_code = 502

        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": {
                    "type": exc.__class__.__name__,
                    "message": str(exc),
                    "path": request.url.path
                }
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            msg = detail.get("message", detail.get("detail", str(detail)))
        else:
            msg = str(detail)

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": msg,
                "error": {
                    "type": "HTTPException",
                    "message": msg,
                    "path": request.url.path
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "type": "ValidationError",
                    "message": "Error de validación en los datos enviados.",
                    "details": exc.errors(),
                    "path": request.url.path
                }
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        import traceback
        import logging
        logging.error(f"Unhandled Exception on {request.url.path}: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "type": "InternalServerError",
                    "message": "Ha ocurrido un error interno en el servidor.",
                    "path": request.url.path
                }
            }
        )
