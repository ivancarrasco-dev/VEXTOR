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
