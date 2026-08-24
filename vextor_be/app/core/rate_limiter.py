"""
Limitador de tasa (Rate Limiter) en memoria para protección de endpoints sensibles
"""
import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

class InMemoryRateLimiter:
    def __init__(self, max_requests: int = 5, window_seconds: int = 900):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def check(self, request: Request, key_prefix: str = ""):
        client_ip = request.client.host if request.client else "unknown"
        key = f"{key_prefix}:{client_ip}"
        now = time.time()

        # Filtrar peticiones fuera de la ventana
        self.requests[key] = [t for t in self.requests[key] if now - t < self.window_seconds]

        if len(self.requests[key]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos. Por favor espere 15 minutos antes de reintentar.",
            )

        self.requests[key].append(now)

auth_rate_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=900)
